// src/lib/notifications/dispatcher.ts
// Master notification dispatcher
// Routes alerts to Firebase (mobile) + OneSignal (web) based on alert type and user preferences

import { db } from '@/lib/db'
import { sendPushToTokens, sendPushToTopic } from './firebase-admin'
import {
  sendHRAlert, sendLineupAlert, sendWeatherAlert,
  sendEdgeAlert, sendInjuryAlert,
} from './onesignal'
import { cache } from '@/lib/utils/cache'

type AlertType = 'HR_ALERT' | 'LINEUP_CONFIRMED' | 'WEATHER_CHANGE' | 'INJURY' | 'EDGE_ALERT' | 'LINEUP_ALERT'

interface DispatchPayload {
  type: AlertType
  data: Record<string, unknown>
}

// ─── Get users subscribed to an alert type ────────────────────────────────────

async function getSubscribedUserIds(type: AlertType, filter?: {
  teamId?: string
  playerId?: string
  minThreshold?: number
}): Promise<string[]> {
  const where: any = { type, active: true }
  if (filter?.teamId) where.teamId = filter.teamId
  if (filter?.playerId) where.playerId = filter.playerId

  const alerts = await db.alert.findMany({
    where,
    include: { user: { select: { clerkId: true, plan: true } } },
  })

  // Only notify Pro/Elite users for certain alert types
  const premiumTypes: AlertType[] = ['EDGE_ALERT']
  return alerts
    .filter((a) => {
      if (premiumTypes.includes(type)) {
        return a.user.plan === 'PRO' || a.user.plan === 'ELITE'
      }
      return true
    })
    .map((a) => a.user.clerkId)
}

// ─── Main dispatch function ───────────────────────────────────────────────────

export async function dispatch(payload: DispatchPayload): Promise<void> {
  const { type, data } = payload

  try {
    switch (type) {
      case 'HR_ALERT': {
        const userIds = await getSubscribedUserIds('HR_ALERT', {
          playerId: data.playerId as string,
        })
        // OneSignal: web push
        await sendHRAlert({
          playerName: data.playerName as string,
          team: data.team as string,
          inning: data.inning as number,
          exitVelocity: data.exitVelocity as number,
          distance: data.distance as number,
          userIds: userIds.length ? userIds : undefined,
        })
        // Firebase: mobile push to topic
        await sendPushToTopic({
          topic: 'hr-alerts',
          title: `💣 ${data.playerName} GOES DEEP!`,
          body: `${data.team} · ${(data.exitVelocity as number).toFixed(1)} mph · ${data.distance}ft`,
          data: { type: 'hr_alert', playerId: String(data.playerId ?? '') },
          clickAction: '/live',
        })
        break
      }

      case 'LINEUP_CONFIRMED': {
        const userIds = await getSubscribedUserIds('LINEUP_CONFIRMED', {
          teamId: data.teamId as string,
        })
        await sendLineupAlert({
          team: data.teamName as string,
          teamAbbr: data.teamAbbr as string,
          gameTime: data.gameTime as string,
          topPlayer: data.topPlayer as string,
          topScore: data.topScore as number,
          userIds: userIds.length ? userIds : undefined,
        })
        // Invalidate caches immediately on lineup confirmation
        await cache.delPattern('dashboard:*')
        await cache.delPattern('scores:*')
        break
      }

      case 'WEATHER_CHANGE': {
        const hrBoost = data.hrBoost as number
        if (Math.abs(hrBoost) < 4) return // Only alert on significant changes

        const userIds = await getSubscribedUserIds('WEATHER_CHANGE')
        await sendWeatherAlert({
          stadium: data.stadium as string,
          team: data.team as string,
          windSpeed: data.windSpeed as number,
          windDir: data.windDir as string,
          hrBoost,
          userIds: userIds.length ? userIds : undefined,
        })
        break
      }

      case 'EDGE_ALERT': {
        const edge = data.edge as number
        if (edge < 0.08) return // Only alert on 8%+ edge

        const userIds = await getSubscribedUserIds('EDGE_ALERT')
        await sendEdgeAlert({
          playerName: data.playerName as string,
          modelProb: data.modelProb as number,
          bookProb: data.bookProb as number,
          edge,
          book: data.book as string,
          userIds: userIds.length ? userIds : undefined,
        })
        break
      }

      case 'INJURY': {
        const userIds = await getSubscribedUserIds('INJURY', {
          playerId: data.playerId as string,
        })
        await sendInjuryAlert({
          playerName: data.playerName as string,
          team: data.team as string,
          status: data.status as string,
          userIds: userIds.length ? userIds : undefined,
        })
        break
      }
    }

    console.log(`[Dispatcher] Sent ${type} alert`)
  } catch (err) {
    console.error(`[Dispatcher] Failed to send ${type}:`, err)
  }
}

// ─── Batch HR alerts (end of scoring run) ────────────────────────────────────

export async function dispatchTopEdgeAlerts(limit = 3): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const topEdge = await db.dailyScore.findMany({
    where: { date: today, edge: { gte: 0.08 } },
    orderBy: { edge: 'desc' },
    take: limit,
    include: { player: { include: { team: true } } },
  })

  for (const score of topEdge) {
    const cacheKey = `edge-alert-sent:${score.playerId}:${today.toISOString().split('T')[0]}`
    const alreadySent = await cache.get(cacheKey)
    if (alreadySent) continue

    await dispatch({
      type: 'EDGE_ALERT',
      data: {
        playerName: score.player.name,
        modelProb: score.hrProbability,
        bookProb: score.bookOdds ?? 0,
        edge: score.edge ?? 0,
        book: 'DraftKings',
        playerId: score.playerId,
      },
    })

    // Mark as sent for today
    await cache.set(cacheKey, true, 86400)
  }
}
