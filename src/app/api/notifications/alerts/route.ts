// src/app/api/notifications/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  type: z.enum(['HR_ALERT', 'LINEUP_CONFIRMED', 'WEATHER_CHANGE', 'INJURY', 'EDGE_ALERT', 'LINEUP_ALERT']),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
})

// GET: fetch user's alerts
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ alerts: [] })

  const alerts = await db.alert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ alerts })
}

// POST: create alert
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Free users: max 3 alerts
  if (user.plan === 'FREE') {
    const count = await db.alert.count({ where: { userId: user.id } })
    if (count >= 3) {
      return NextResponse.json({ error: 'Free plan limited to 3 alerts. Upgrade to Pro.' }, { status: 403 })
    }
  }

  const alert = await db.alert.create({
    data: {
      userId: user.id,
      type: parsed.data.type,
      playerId: parsed.data.playerId,
      teamId: parsed.data.teamId,
      threshold: parsed.data.threshold,
    },
  })

  return NextResponse.json({ alert }, { status: 201 })
}

// DELETE: remove alert
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alertId = req.nextUrl.searchParams.get('id')
  if (!alertId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.alert.deleteMany({ where: { id: alertId, userId: user.id } })
  return NextResponse.json({ success: true })
}

// PATCH: toggle active
export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { alertId, active } = await req.json()

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const alert = await db.alert.updateMany({
    where: { id: alertId, userId: user.id },
    data: { active },
  })

  return NextResponse.json({ updated: alert.count > 0 })
}
