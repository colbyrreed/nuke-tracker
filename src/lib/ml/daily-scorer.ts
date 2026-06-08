// src/lib/ml/daily-scorer.ts
// Nuke Tracker — Daily Scoring Pipeline
// Runs on 60-second interval, immediately on lineup confirmation

import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import {
  scorePlayer,
  buildFeatures,
  calculateWeatherBoost,
  calculateParkBoost,
} from './scoring-engine'
import {
  fetchTodaysGames,
  fetchWeatherForStadium,
  fetchPlayerHROdds,
} from '@/lib/api/mlb'
import type { ScoringResult } from '@/types'

// ─── Main Pipeline ────────────────────────────────────────────────────────────

export async function runDailyScoring(): Promise<void> {
  const startTime = Date.now()
  const today = new Date().toISOString().split('T')[0]

  console.log(`[Scorer] Starting daily scoring run for ${today}`)

  try {
    // 1. Fetch today's games
    const games = await fetchTodaysGames()
    if (!games.length) {
      console.log('[Scorer] No games today')
      return
    }

    // 2. Fetch odds for value calculation
    const oddsMap = await buildOddsMap(today)

    // 3. Score each player in each game
    const results: ScoringResult[] = []
    const playersSeen = new Set<string>()

    for (const game of games) {
      // Fetch weather for this game's stadium
      const stadium = await db.stadium.findUnique({
        where: { id: game.stadiumId ?? '' },
      })

      let weatherData = null
      if (stadium) {
        weatherData = await fetchWeatherForStadium({
          lat: stadium.latitude,
          lon: stadium.longitude,
          gameTime: new Date(game.date),
        })
      }

      // Calculate weather boost
      const wxBoost = weatherData && stadium
        ? calculateWeatherBoost({
            windSpeed: weatherData.windSpeed ?? 5,
            windDirection: weatherData.windDirection ?? 180,
            temperature: weatherData.temperature ?? 72,
            humidity: weatherData.humidity ?? 50,
            altitude: stadium.altitude,
            roofOpen: stadium.roofType !== 'FIXED_DOME',
          })
        : 0

      // Save weather
      if (weatherData && game.id) {
        await upsertWeather(game.id, {
          ...weatherData,
          hrBoost: wxBoost,
          altitude: stadium?.altitude ?? 0,
          airDensity: computeAirDensity(
            weatherData.temperature ?? 72,
            weatherData.humidity ?? 50,
            stadium?.altitude ?? 0,
          ),
          ballCarry: wxBoost > 3
            ? 'Favorable'
            : wxBoost < -3
            ? 'Unfavorable'
            : 'Neutral',
          roofOpen: stadium?.roofType !== 'FIXED_DOME',
        })
      }

      // Score home & away lineups
      for (const side of ['home', 'away'] as const) {
        const lineups = await db.lineupEntry.findMany({
          where: { gameId: game.id, teamSide: side },
          include: { player: true },
        })

        const opponentTeamId = side === 'home' ? game.awayTeamId : game.homeTeamId
        const starterPitcher = await db.gamePitcher.findFirst({
          where: {
            gameId: game.id,
            teamSide: side === 'home' ? 'away' : 'home',
            role: 'STARTER',
          },
          include: { pitcher: true },
        })

        for (const entry of lineups) {
          if (playersSeen.has(entry.playerId)) continue
          playersSeen.add(entry.playerId)

          const player = entry.player
          const pitcher = starterPitcher?.pitcher

          // Park boost
          const parkBoost = stadium
            ? calculateParkBoost({
                hrFactor: stadium.hrFactor,
                altitude: stadium.altitude,
                bats: player.bats as 'LEFT' | 'RIGHT' | 'SWITCH',
                lhHrFactor: stadium.lhHrFactor,
                rhHrFactor: stadium.rhHrFactor,
              })
            : 0

          // Recent stats from DB
          const recentStats = await fetchRecentStats(player.id)

          // Build feature vector
          const features = buildFeatures({
            player: {
              barrelPct: player.barrelPct,
              hardHitPct: player.hardHitPct,
              sweetSpotPct: player.sweetSpotPct,
              avgExitVelo: player.avgExitVelo,
              maxExitVelo: player.maxExitVelo,
              avgLaunchAngle: player.avgLaunchAngle,
              xSLG: player.xSLG,
              xWOBA: player.xWOBA,
              iso: player.iso,
              ops: player.ops,
              pullPct: player.pullPct,
              flyBallPct: player.flyBallPct,
              bats: player.bats as any,
            },
            recentStats: {
              last7: recentStats.last7,
              last15: recentStats.last15,
              last30: recentStats.last30,
              homeAwayFactor: side === 'home' ? 1.05 : 0.97,
            },
            pitcher: pitcher
              ? {
                  hr9: pitcher.hr9,
                  flyBallPct: pitcher.flyBallPct,
                  barrelPct: pitcher.barrelPct,
                  hardContactPct: pitcher.hardContactPct,
                  xERA: pitcher.xERA,
                  avgFastball: pitcher.avgFastball,
                  throws: pitcher.throws as any,
                }
              : defaultPitcherFeatures(),
            park: {
              hrFactor: stadium?.hrFactor ?? 1.0,
              altitude: stadium?.altitude ?? 0,
              lhHrFactor: stadium?.lhHrFactor ?? 1.0,
              rhHrFactor: stadium?.rhHrFactor ?? 1.0,
            },
            weather: {
              hrBoost: wxBoost,
              windSpeed: weatherData?.windSpeed ?? 5,
              windDirection: weatherData?.windDirection ?? 180,
              temperature: weatherData?.temperature ?? 72,
            },
            game: {
              battingOrder: entry.battingOrder,
              historicalMatchupHRs: await getHistoricalMatchupHRs(player.id, pitcher?.id ?? ''),
              historicalMatchupABs: await getHistoricalMatchupABs(player.id, pitcher?.id ?? ''),
            },
          })

          // Score
          const result = scorePlayer(features)
          result.playerId = player.id

          // Value vs book
          const bookOdds = oddsMap.get(player.id)
          const edge = bookOdds !== undefined
            ? result.hrProbability - bookOdds
            : undefined

          results.push({ ...result, valueScore: (edge ?? 0) * 100 })

          // Persist to DB
          await db.dailyScore.upsert({
            where: { playerId_date: { playerId: player.id, date: new Date(today) } },
            create: {
              playerId: player.id,
              date: new Date(today),
              gameId: game.id,
              nukeScore: result.nukeScore,
              hrProbability: result.hrProbability,
              expectedHRs: result.expectedHRs,
              confidence: result.confidence,
              valueScore: result.valueScore,
              riskScore: result.riskScore,
              leverageScore: result.leverageScore,
              upsideScore: result.upsideScore,
              weatherBoost: result.weatherBoost,
              parkBoost: result.parkBoost,
              matchupBoost: result.matchupBoost,
              formBoost: result.formBoost,
              battingOrder: entry.battingOrder,
              bookOdds: bookOdds,
              edge: edge,
              modelInputs: features as any,
            },
            update: {
              nukeScore: result.nukeScore,
              hrProbability: result.hrProbability,
              confidence: result.confidence,
              weatherBoost: wxBoost,
              parkBoost,
              bookOdds,
              edge,
              updatedAt: new Date(),
            },
          })
        }
      }
    }

    // Assign ranks
    await assignRanks(today)

    // Invalidate dashboard cache
    await cache.delPattern('dashboard:*')
    await cache.del(`scores:${today}`)

    const elapsed = Date.now() - startTime
    console.log(`[Scorer] Completed: ${results.length} players scored in ${elapsed}ms`)

    // Log model accuracy snapshot
    await logModelRun(results.length, today)
  } catch (err) {
    console.error('[Scorer] Fatal error:', err)
    throw err
  }
}

// ─── Lineup Trigger ───────────────────────────────────────────────────────────
// Called immediately when a lineup is confirmed (webhook or polling)

export async function onLineupConfirmed(gameId: string, side: 'home' | 'away') {
  console.log(`[Scorer] Lineup confirmed: game=${gameId} side=${side} — triggering immediate rescore`)
  await runDailyScoring()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildOddsMap(date: string): Promise<Map<string, number>> {
  const odds = await fetchPlayerHROdds(date)
  const map = new Map<string, number>()
  for (const o of odds) {
    // Use best (lowest) book probability per player for max edge calc
    const existing = map.get(o.playerId)
    if (!existing || o.impliedProb < existing) {
      map.set(o.playerId, o.impliedProb)
    }
  }
  return map
}

async function fetchRecentStats(playerId: string) {
  const gameDates = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d
  }

  const [last7, last15, last30] = await Promise.all([
    db.gamestat.aggregate({
      where: { playerId, date: { gte: gameDates(7) } },
      _sum: { homeRuns: true, atBats: true },
    }),
    db.gamestat.aggregate({
      where: { playerId, date: { gte: gameDates(15) } },
      _sum: { homeRuns: true, atBats: true },
    }),
    db.gamestat.aggregate({
      where: { playerId, date: { gte: gameDates(30) } },
      _sum: { homeRuns: true, atBats: true },
    }),
  ])

  return {
    last7:  { homeRuns: last7._sum.homeRuns ?? 0,  atBats: last7._sum.atBats ?? 1 },
    last15: { homeRuns: last15._sum.homeRuns ?? 0, atBats: last15._sum.atBats ?? 1 },
    last30: { homeRuns: last30._sum.homeRuns ?? 0, atBats: last30._sum.atBats ?? 1 },
  }
}

async function getHistoricalMatchupHRs(playerId: string, pitcherId: string): Promise<number> {
  if (!pitcherId) return 0
  const m = await db.pitcherMatchup.findUnique({
    where: { playerId_pitcherId: { playerId, pitcherId } },
  })
  return m?.homeRuns ?? 0
}

async function getHistoricalMatchupABs(playerId: string, pitcherId: string): Promise<number> {
  if (!pitcherId) return 0
  const m = await db.pitcherMatchup.findUnique({
    where: { playerId_pitcherId: { playerId, pitcherId } },
  })
  return m?.atBats ?? 0
}

async function assignRanks(date: string) {
  const scores = await db.dailyScore.findMany({
    where: { date: new Date(date) },
    orderBy: { nukeScore: 'desc' },
    select: { id: true },
  })
  await Promise.all(
    scores.map((s, i) =>
      db.dailyScore.update({ where: { id: s.id }, data: { rank: i + 1 } })
    )
  )
}

async function upsertWeather(gameId: string, data: any) {
  await db.weather.upsert({
    where: { gameId },
    create: { gameId, ...data },
    update: { ...data, updatedAt: new Date() },
  })
}

async function logModelRun(playerCount: number, date: string) {
  // Placeholder — will be filled with actual accuracy calcs after games finish
  await cache.set(`model:run:${date}`, { playerCount, timestamp: Date.now() }, 86400)
}

function defaultPitcherFeatures() {
  return {
    hr9: 1.2,
    flyBallPct: 36,
    barrelPct: 8.5,
    hardContactPct: 38,
    xERA: 4.20,
    avgFastball: 93.5,
    throws: 'RIGHT' as const,
  }
}

function computeAirDensity(tempF: number, humidity: number, altitudeFt: number): number {
  // Air density in lb/ft³
  const tempK = (tempF - 32) * 5 / 9 + 273.15
  const pressurePa = 101325 * Math.pow(1 - 0.0000225577 * altitudeFt * 0.3048, 5.25588)
  const vaporPressure = humidity / 100 * 610.78 * Math.exp(17.269 * (tempK - 273.15) / (tempK - 35.85))
  const rhoKgM3 = (pressurePa - 0.378 * vaporPressure) / (287.058 * tempK)
  return rhoKgM3 * 0.0624  // convert to lb/ft³
}
