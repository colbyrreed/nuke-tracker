// src/app/api/cron/sync/route.ts
// Called by Vercel Cron every 60 seconds: */1 12-23 * * *
import { NextRequest, NextResponse } from 'next/server'
import { runDailyScoring } from '@/lib/ml/daily-scorer'
import {
  fetchTodaysGames,
  fetchConfirmedLineups,
  fetchWeatherForStadium,
  fetchPlayerHROdds,
} from '@/lib/api/mlb'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import { calculateWeatherBoost } from '@/lib/ml/scoring-engine'
import { triggerLineupAlert, triggerWeatherAlert } from '@/lib/notifications/engine'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const today = new Date().toISOString().split('T')[0]
  const results: Record<string, any> = {}

  try {
    // ── 1. Sync games ────────────────────────────────────────────────────────
    const games = await fetchTodaysGames()
    results.games = games.length

    for (const game of games) {
      await db.game.upsert({
        where: { id: game.id },
        create: {
          id: game.id,
          date: new Date(game.date),
          status: game.status as any,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          stadiumId: game.stadiumId,
        },
        update: {
          status: game.status as any,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          inning: game.inning,
          inningHalf: game.inningHalf,
          homeLineupConfirmed: game.homeLineupConfirmed,
          awayLineupConfirmed: game.awayLineupConfirmed,
        },
      })
    }

    // ── 2. Check for new lineup confirmations ─────────────────────────────────
    const lineups = await fetchConfirmedLineups()
    let lineupChanged = false

    for (const entry of lineups ?? []) {
      const existing = await db.lineupEntry.findFirst({
        where: { gameId: entry.gameId, playerId: entry.playerId, confirmed: true },
      })

      if (!existing) {
        await db.lineupEntry.upsert({
          where: { gameId_playerId: { gameId: entry.gameId, playerId: entry.playerId } },
          create: {
            gameId: entry.gameId,
            playerId: entry.playerId,
            battingOrder: entry.battingOrder,
            position: entry.position,
            teamSide: entry.teamSide,
            confirmed: true,
          },
          update: { battingOrder: entry.battingOrder, confirmed: true },
        })

        lineupChanged = true

        // Notify subscribers
        const game = await db.game.findUnique({
          where: { id: entry.gameId },
          include: { homeTeam: true, awayTeam: true },
        })
        if (game) {
          const team = entry.teamSide === 'home' ? game.homeTeam : game.awayTeam
          await triggerLineupAlert({
            teamName: team.name,
            teamAbbr: team.abbreviation,
            gameId: game.id,
            side: entry.teamSide as 'home' | 'away',
            confirmedAt: new Date(),
          })
        }
      }
    }
    results.lineupChanged = lineupChanged

    // ── 3. Weather update ─────────────────────────────────────────────────────
    const stadiums = await db.stadium.findMany()
    const stadiumMap = new Map(stadiums.map((s) => [s.id, s]))
    let weatherUpdates = 0

    for (const game of games) {
      if (!game.stadiumId) continue
      const stadium = stadiumMap.get(game.stadiumId)
      if (!stadium) continue

      const wx = await fetchWeatherForStadium({
        lat: stadium.latitude,
        lon: stadium.longitude,
        gameTime: new Date(game.date),
      })

      const newBoost = calculateWeatherBoost({
        windSpeed: wx.windSpeed ?? 5,
        windDirection: wx.windDirection ?? 180,
        temperature: wx.temperature ?? 72,
        humidity: wx.humidity ?? 50,
        altitude: stadium.altitude,
        roofOpen: stadium.roofType !== 'FIXED_DOME',
      })

      // Check for significant weather change
      const existing = await db.weather.findUnique({ where: { gameId: game.id } })
      if (existing && Math.abs(existing.hrBoost - newBoost) >= 3) {
        await triggerWeatherAlert({
          stadiumName: stadium.name,
          gameId: game.id,
          oldBoost: existing.hrBoost,
          newBoost,
          windSpeed: wx.windSpeed ?? 5,
          windDirection: wx.windDirection ? compassLabel(wx.windDirection) : 'Unknown',
        })
      }

      await db.weather.upsert({
        where: { gameId: game.id },
        create: {
          gameId: game.id,
          temperature: wx.temperature ?? 72,
          humidity: wx.humidity ?? 50,
          windSpeed: wx.windSpeed ?? 5,
          windDirection: wx.windDirection ?? 180,
          windDirectionLabel: compassLabel(wx.windDirection ?? 180),
          pressure: wx.pressure ?? 29.92,
          altitude: stadium.altitude,
          airDensity: 0.073,
          hrBoost: newBoost,
          ballCarry: newBoost > 3 ? 'Favorable' : newBoost < -3 ? 'Unfavorable' : 'Neutral',
          roofOpen: stadium.roofType !== 'FIXED_DOME',
        },
        update: {
          temperature: wx.temperature ?? 72,
          windSpeed: wx.windSpeed ?? 5,
          windDirection: wx.windDirection ?? 180,
          hrBoost: newBoost,
          ballCarry: newBoost > 3 ? 'Favorable' : newBoost < -3 ? 'Unfavorable' : 'Neutral',
          updatedAt: new Date(),
        },
      })
      weatherUpdates++
    }
    results.weatherUpdates = weatherUpdates

    // ── 4. Odds sync ──────────────────────────────────────────────────────────
    const odds = await fetchPlayerHROdds(today)
    for (const o of odds) {
      await db.playerOdds.upsert({
        where: { playerId_date_book_market: { playerId: o.playerId, date: new Date(today), book: o.book, market: o.market } },
        create: { ...o, date: new Date(today) },
        update: { overOdds: o.overOdds, impliedProb: o.impliedProb, fetchedAt: new Date() },
      })
    }
    results.oddsUpdates = odds.length

    // ── 5. Rescore ────────────────────────────────────────────────────────────
    await runDailyScoring()
    await cache.delPattern('dashboard:*')
    await cache.del(`scores:${today}`)
    results.rescored = true

    const elapsed = Date.now() - startTime
    results.elapsed = elapsed

    console.log(`[Cron] Sync complete in ${elapsed}ms:`, results)
    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    console.error('[Cron] Sync error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function compassLabel(degrees: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}
