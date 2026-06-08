// src/app/api/notifications/register/route.ts
// Register FCM token for a user

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { subscribeToTopic } from '@/lib/notifications/firebase-admin'

// We store FCM tokens in a simple JSON column on User for now
// In production, use a separate DeviceToken table

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  // Get user's active alerts to subscribe to relevant topics
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { alerts: { where: { active: true } } },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Subscribe to topics based on active alerts
  const topics: string[] = []
  for (const alert of user.alerts) {
    switch (alert.type) {
      case 'HR_ALERT':
        topics.push('hr-alerts')
        if (alert.playerId) topics.push(`player-${alert.playerId}`)
        break
      case 'LINEUP_CONFIRMED':
        if (alert.teamId) topics.push(`lineup-${alert.teamId}`)
        break
      case 'WEATHER_CHANGE':
        topics.push('weather-alerts')
        break
      case 'EDGE_ALERT':
        topics.push('edge-alerts')
        break
      case 'INJURY':
        topics.push('injury-alerts')
        break
    }
  }

  if (topics.length > 0) {
    await subscribeToTopic([token], topics.join(','))
  }

  return NextResponse.json({ success: true, topicsSubscribed: topics.length })
}
