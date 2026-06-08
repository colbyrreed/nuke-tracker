// src/app/api/weather/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import { fetchWeatherForStadium } from '@/lib/api/mlb'
import { calculateWeatherBoost } from '@/lib/ml/scoring-engine'

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId')
  const today = new Date().toISOString().split('T')[0]

  if (gameId) {
    // Single game weather
    const weather = await db.weather.findUnique({ where: { gameId } })
    if (!weather) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(weather)
  }

  // All games today
  const cacheKey = `weather:all:${today}`
  const cached = await cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const games = await db.game.findMany({
    where: {
      date: {
        gte: new Date(`${today}T00:00:00`),
        lt: new Date(`${today}T23:59:59`),
      },
    },
    include: {
      weather: true,
      stadium: true,
      homeTeam: true,
      awayTeam: true,
    },
  })

  // Fetch and compute weather for any game missing it
  const enriched = await Promise.all(
    games.map(async (game) => {
      let weather = game.weather
      if (!weather && game.stadium) {
        const raw = await fetchWeatherForStadium({
          lat: game.stadium.latitude,
          lon: game.stadium.longitude,
          gameTime: game.date,
        })
        const boost = calculateWeatherBoost({
          windSpeed: raw.windSpeed ?? 5,
          windDirection: raw.windDirection ?? 180,
          temperature: raw.temperature ?? 72,
          humidity: raw.humidity ?? 50,
          altitude: game.stadium.altitude,
          roofOpen: game.stadium.roofType !== 'FIXED_DOME',
        })
        weather = {
          id: '',
          gameId: game.id,
          temperature: raw.temperature ?? 72,
          humidity: raw.humidity ?? 50,
          windSpeed: raw.windSpeed ?? 5,
          windDirection: raw.windDirection ?? 180,
          windDirectionLabel: compassLabel(raw.windDirection ?? 180),
          pressure: raw.pressure ?? 29.9,
          altitude: game.stadium.altitude,
          airDensity: 0.073,
          hrBoost: boost,
          ballCarry: boost > 3 ? 'Favorable' : boost < -3 ? 'Unfavorable' : 'Neutral',
          roofOpen: game.stadium.roofType !== 'FIXED_DOME',
          fetchedAt: new Date(),
          updatedAt: new Date(),
        }
      }
      return {
        gameId: game.id,
        homeTeam: game.homeTeam.abbreviation,
        awayTeam: game.awayTeam.abbreviation,
        stadium: game.stadium?.name,
        date: game.date,
        weather,
      }
    })
  )

  const result = { date: today, games: enriched }
  await cache.set(cacheKey, result, 1800)
  return NextResponse.json(result)
}

function compassLabel(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}
