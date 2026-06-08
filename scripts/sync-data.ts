#!/usr/bin/env tsx
// scripts/sync-data.ts
// Master data sync — MLB games, lineups, statcast, weather, odds
// Run on 60-second cron via Vercel Cron or Railway Scheduler

import { db } from '../src/lib/db'
import { cache } from '../src/lib/utils/cache'
import {
  fetchTodaysGames,
  fetchConfirmedLineups,
  fetchPlayerHROdds,
  fetchWeatherForStadium,
} from '../src/lib/api/mlb'
import { runDailyScoring, onLineupConfirmed } from '../src/lib/ml/daily-scorer'
import { calculateWeatherBoost } from '../src/lib/ml/scoring-engine'

async function syncAll() {
  const startTime = Date.now()
  const today = new Date().toISOString().split('T')[0]
  console.log(`[Sync] Starting at ${new Date().toISOString()}`)

  // ── 1. Games ────────────────────────────────────────────────────────────────
  const games = await fetchTodaysGames()
  console.log(`[Sync] ${games.length} games today`)

  for (const game of games) {
    await db.game.upsert({
      where: { id: game.id },
      create: {
        id: game.id,
        date: game.date,
        status: game.status as any,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        stadiumId: game.stadiumId,
        homeLineupConfirmed: game.homeLineupConfirmed,
        awayLineupConfirmed: game.awayLineupConfirmed,
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

  // ── 2. Lineups ──────────────────────────────────────────────────────────────
  const lineups = await fetchConfirmedLineups()
  let lineupChanged = false

  for (const entry of lineups ?? []) {
    const existing = await db.lineupEntry.findFirst({
      where: { gameId: entry.gameId, playerId: entry.playerId },
    })

    if (!existing) {
      await db.lineupEntry.upsert({
        where: {
          gameId_playerId: { gameId: entry.gameId, playerId: entry.playerId },
        },
        create: {
          gameId: entry.gameId,
          playerId: entry.playerId,
          battingOrder: entry.battingOrder,
          position: entry.position,
          teamSide: entry.teamSide,
          confirmed: true,
        },
        update: {
          battingOrder: entry.battingOrder,
          confirmed: true,
        },
      })
      lineupChanged = true
    }
  }

  // ── 3. Weather ──────────────────────────────────────────────────────────────
  const stadiums = await db.stadium.findMany()
  const stadiumMap = new Map(stadiums.map((s) => [s.id, s]))

  for (const game of games) {
    if (!game.stadiumId) continue
    const stadium = stadiumMap.get(game.stadiumId)
    if (!stadium) continue

    const wx = await fetchWeatherForStadium({
      lat: stadium.latitude,
      lon: stadium.longitude,
      gameTime: new Date(game.date),
    })

    const boost = calculateWeatherBoost({
      windSpeed: wx.windSpeed ?? 5,
      windDirection: wx.windDirection ?? 180,
      temperature: wx.temperature ?? 72,
      humidity: wx.humidity ?? 50,
      altitude: stadium.altitude,
      roofOpen: stadium.roofType !== 'FIXED_DOME',
    })

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
        hrBoost: boost,
        ballCarry: boost > 3 ? 'Favorable' : boost < -3 ? 'Unfavorable' : 'Neutral',
        roofOpen: stadium.roofType !== 'FIXED_DOME',
      },
      update: {
        temperature: wx.temperature ?? 72,
        humidity: wx.humidity ?? 50,
        windSpeed: wx.windSpeed ?? 5,
        windDirection: wx.windDirection ?? 180,
        hrBoost: boost,
        ballCarry: boost > 3 ? 'Favorable' : boost < -3 ? 'Unfavorable' : 'Neutral',
        updatedAt: new Date(),
      },
    })
  }

  // ── 4. Odds ─────────────────────────────────────────────────────────────────
  const odds = await fetchPlayerHROdds(today)
  for (const o of odds) {
    await db.playerOdds.upsert({
      where: {
        playerId_date_book_market: {
          playerId: o.playerId,
          date: new Date(today),
          book: o.book,
          market: o.market,
        },
      },
      create: {
        playerId: o.playerId,
        date: new Date(today),
        book: o.book,
        market: o.market,
        line: o.line,
        overOdds: o.overOdds,
        impliedProb: o.impliedProb,
      },
      update: {
        overOdds: o.overOdds,
        impliedProb: o.impliedProb,
        fetchedAt: new Date(),
      },
    })
  }
  console.log(`[Sync] ${odds.length} odds entries synced`)

  // ── 5. Rescore ──────────────────────────────────────────────────────────────
  // Always rescore on sync cycle; also triggered immediately on lineup change
  await runDailyScoring()

  if (lineupChanged) {
    console.log('[Sync] Lineup change detected — triggering priority rescore')
    await cache.delPattern('dashboard:*')
  }

  const elapsed = Date.now() - startTime
  console.log(`[Sync] Complete in ${elapsed}ms`)
}

function compassLabel(degrees: number): string {
  const dirs = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ]
  return dirs[Math.round(degrees / 22.5) % 16]
}

syncAll().catch((err) => {
  console.error('[Sync] Fatal error:', err)
  process.exit(1)
})
