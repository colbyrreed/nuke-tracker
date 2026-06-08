// src/app/api/insights/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import { generateInsights, generatePlayerInsight } from '@/lib/ml/ai-insights'
import type { DashboardPlayer } from '@/types'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  const playerId = req.nextUrl.searchParams.get('playerId')
  const today = new Date().toISOString().split('T')[0]

  // Single player insight
  if (playerId) {
    const cacheKey = `insight:player:${playerId}:${today}`
    const cached = await cache.get(cacheKey)
    if (cached) return NextResponse.json(cached)

    const playerData = await fetchPlayerData(playerId, today)
    if (!playerData) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const insight = await generatePlayerInsight(playerData)
    await cache.set(cacheKey, insight, 1800) // 30-min TTL
    return NextResponse.json(insight)
  }

  // Top players insights (Pro+ only)
  const isPro = await checkPlan(userId, ['PRO', 'ELITE'])
  const cacheKey = `insights:top:${today}:${isPro}`
  const cached = await cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  const topPlayers = await fetchTopPlayers(today, isPro ? 10 : 3)
  const insights = await generateInsights(topPlayers, isPro ? 10 : 3)

  const result = {
    date: today,
    count: insights.length,
    isPro,
    insights,
  }

  await cache.set(cacheKey, result, 1800)
  return NextResponse.json(result)
}

async function fetchTopPlayers(date: string, limit: number): Promise<DashboardPlayer[]> {
  const scores = await db.dailyScore.findMany({
    where: { date: new Date(date) },
    orderBy: { nukeScore: 'desc' },
    take: limit,
    include: {
      player: {
        include: {
          team: { include: { stadium: true } },
        },
      },
    },
  })

  return scores.map((s) => ({
    rank: s.rank ?? 0,
    player: s.player as any,
    team: s.player.team as any,
    opponent: null as any,
    game: null as any,
    score: s as any,
    weather: null as any,
    stadium: s.player.team?.stadium as any,
    pitcher: null as any,
  }))
}

async function fetchPlayerData(playerId: string, date: string): Promise<DashboardPlayer | null> {
  const score = await db.dailyScore.findUnique({
    where: { playerId_date: { playerId, date: new Date(date) } },
    include: {
      player: { include: { team: { include: { stadium: true } } } },
    },
  })
  if (!score) return null

  return {
    rank: score.rank ?? 0,
    player: score.player as any,
    team: score.player.team as any,
    opponent: null as any,
    game: null as any,
    score: score as any,
    stadium: score.player.team?.stadium as any,
    pitcher: null as any,
    weather: null as any,
  }
}

async function checkPlan(userId: string | null, plans: string[]): Promise<boolean> {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true } })
  return user ? plans.includes(user.plan) : false
}
