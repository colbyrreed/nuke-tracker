// src/app/api/games/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'

export async function GET(req: NextRequest) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const cacheKey = `games:all:${today.toISOString().split('T')[0]}`
  const cached = await cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const games = await db.game.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: {
      homeTeam: true,
      awayTeam: true,
      stadium: true,
      weather: true,
      pitchers: { include: { pitcher: true }, where: { role: 'STARTER' } },
    },
    orderBy: { date: 'asc' },
  })

  const result = { games, count: games.length, date: today.toISOString().split('T')[0] }
  await cache.set(cacheKey, result, 60)
  return NextResponse.json(result)
}
