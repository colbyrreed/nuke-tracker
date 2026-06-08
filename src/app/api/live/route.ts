// src/app/api/live/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cacheKey = `live:hrs:${today.toISOString().split('T')[0]}`
  const cached = await cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const events = await db.statcastEvent.findMany({
    where: { isHomeRun: true, gameDate: { gte: today } },
    orderBy: { gameDate: 'desc' },
    take: 50,
    include: { player: { include: { team: true } } },
  })

  const result = {
    events: events.map((e) => ({
      id: e.id,
      gameId: e.gameId,
      playerId: e.playerId,
      playerName: (e.player as any).name,
      team: (e.player as any).team?.abbreviation ?? '—',
      inning: e.inning ?? 0,
      inningHalf: 'bottom',
      exitVelocity: e.exitVelocity ?? 0,
      distance: e.distance ?? 0,
      launchAngle: e.launchAngle ?? 0,
      pitchType: e.pitchType ?? 'Unknown',
      timestamp: e.gameDate,
    })),
    count: events.length,
  }

  await cache.set(cacheKey, result, 15) // 15s TTL for live events
  return NextResponse.json(result)
}
