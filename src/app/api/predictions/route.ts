// src/app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runDailyScoring } from '@/lib/ml/daily-scorer'
import { db } from '@/lib/db'

// GET: fetch today's model predictions summary
export async function GET(req: NextRequest) {
  const today = new Date().toISOString().split('T')[0]

  const [total, topScore, calibration] = await Promise.all([
    db.dailyScore.count({ where: { date: new Date(today) } }),
    db.dailyScore.findFirst({
      where: { date: new Date(today) },
      orderBy: { nukeScore: 'desc' },
      include: { player: true },
    }),
    db.modelAccuracy.findFirst({ orderBy: { date: 'desc' } }),
  ])

  return NextResponse.json({
    date: today,
    totalScored: total,
    topPick: topScore
      ? { name: topScore.player.name, score: topScore.nukeScore, prob: topScore.hrProbability }
      : null,
    modelAccuracy: calibration?.correctTop10 ?? null,
    brierScore: calibration?.brierScore ?? null,
    roi: calibration?.roi ?? null,
    lastRun: new Date().toISOString(),
  })
}

// POST: trigger a manual rescore (admin/cron only)
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  const cronSecret = req.headers.get('x-cron-secret')
  const isAdmin = user?.plan === 'ELITE' // simplified; use a real admin flag in prod
  const isCron = cronSecret === process.env.CRON_SECRET

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await runDailyScoring()
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[API] scoring error:', err)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}
