// src/app/api/players/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import { z } from 'zod'

const querySchema = z.object({
  date: z.string().optional(),
  team: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
  minScore: z.coerce.number().min(0).max(100).optional(),
  confidence: z.enum(['high', 'med', 'low']).optional(),
  hand: z.enum(['LEFT', 'RIGHT', 'SWITCH']).optional(),
  search: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  const sp = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = querySchema.safeParse(sp)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const q = parsed.data
  const today = q.date ?? new Date().toISOString().split('T')[0]

  // Free plan: limit to top 10
  const isPro = await checkPlan(userId, ['PRO', 'ELITE'])
  const effectiveLimit = isPro ? q.limit : Math.min(q.limit, 10)

  const cacheKey = `players:${today}:${JSON.stringify(q)}:${isPro}`
  const cached = await cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  // Build where clause
  const where: any = {
    date: new Date(today),
    player: { active: true },
  }

  if (q.team) {
    where.player = { ...where.player, team: { abbreviation: q.team } }
  }
  if (q.hand) {
    where.player = { ...where.player, bats: q.hand }
  }
  if (q.minScore) {
    where.nukeScore = { gte: q.minScore }
  }
  if (q.confidence) {
    const confRange: Record<string, { gte: number; lt?: number }> = {
      high: { gte: 0.75 },
      med:  { gte: 0.45, lt: 0.75 },
      low:  { gte: 0, lt: 0.45 },
    }
    where.confidence = confRange[q.confidence]
  }
  if (q.search) {
    where.player = {
      ...where.player,
      name: { contains: q.search, mode: 'insensitive' },
    }
  }

  const [scores, total] = await Promise.all([
    db.dailyScore.findMany({
      where,
      orderBy: { nukeScore: 'desc' },
      take: effectiveLimit,
      skip: q.offset,
      include: {
        player: {
          include: {
            team: { include: { stadium: true } },
          },
        },
      },
    }),
    db.dailyScore.count({ where }),
  ])

  const result = {
    data: scores.map(transformScore),
    meta: {
      total,
      limit: effectiveLimit,
      offset: q.offset,
      date: today,
      isPro,
      truncated: !isPro && total > 10,
    },
  }

  await cache.set(cacheKey, result, 60)
  return NextResponse.json(result)
}

function transformScore(score: any) {
  const p = score.player
  return {
    rank: score.rank,
    player: {
      id: p.id,
      name: p.name,
      position: p.position,
      bats: p.bats,
      team: p.team
        ? {
            id: p.team.id,
            name: p.team.name,
            abbreviation: p.team.abbreviation,
          }
        : null,
    },
    score: {
      nukeScore: score.nukeScore,
      hrProbability: score.hrProbability,
      expectedHRs: score.expectedHRs,
      confidence: score.confidence,
      valueScore: score.valueScore,
      riskScore: score.riskScore,
      leverageScore: score.leverageScore,
      upsideScore: score.upsideScore,
      weatherBoost: score.weatherBoost,
      parkBoost: score.parkBoost,
      matchupBoost: score.matchupBoost,
      formBoost: score.formBoost,
      edge: score.edge,
      bookOdds: score.bookOdds,
      battingOrder: score.battingOrder,
    },
  }
}

async function checkPlan(userId: string | null, plans: string[]): Promise<boolean> {
  if (!userId) return false
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { plan: true },
  })
  return user ? plans.includes(user.plan) : false
}
