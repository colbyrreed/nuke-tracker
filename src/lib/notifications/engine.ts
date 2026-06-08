// src/lib/notifications/engine.ts
// Nuke Tracker — Notification Engine
// Firebase Cloud Messaging (web push) + OneSignal (mobile)
// Triggers: HR alerts, lineup confirmed, weather change, edge alert, injury

import * as admin from 'firebase-admin'
import OneSignal from 'onesignal-node'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import type { AlertPayload } from '@/types'

// ─── Firebase Admin init ──────────────────────────────────────────────────────

let firebaseApp: admin.app.App | null = null

function getFirebase(): admin.app.App {
  if (firebaseApp) return firebaseApp
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]!
    return firebaseApp
  }
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
  return firebaseApp
}

// ─── OneSignal init ───────────────────────────────────────────────────────────

function getOneSignal(): OneSignal.Client {
  return new OneSignal.Client(
    process.env.ONESIGNAL_APP_ID!,
    process.env.ONESIGNAL_REST_API_KEY!,
  )
}

// ─── Alert Types ─────────────────────────────────────────────────────────────

export type AlertType =
  | 'HR_ALERT'
  | 'LINEUP_CONFIRMED'
  | 'WEATHER_CHANGE'
  | 'INJURY'
  | 'EDGE_ALERT'
  | 'LINEUP_ALERT'

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  url?: string
  data?: Record<string, string>
  imageUrl?: string
}

// ─── Send to single user (Firebase token) ────────────────────────────────────

export async function sendToUser(
  clerkId: string,
  payload: NotificationPayload,
): Promise<boolean> {
  try {
    const token = await getUserFCMToken(clerkId)
    if (!token) return false

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon ?? '/icon-192.png',
          badge: '/badge-72.png',
          data: payload.data,
        },
        fcmOptions: { link: payload.url ?? 'https://nuketracker.com/dashboard' },
      },
      data: payload.data,
    }

    await getFirebase().messaging().send(message)
    return true
  } catch (err) {
    console.error('[Notifications] Firebase send failed:', err)
    return false
  }
}

// ─── Send to segment via OneSignal ───────────────────────────────────────────

export async function sendToSegment(
  segment: 'All' | 'Pro' | 'Elite' | 'Active',
  payload: NotificationPayload,
): Promise<void> {
  try {
    const client = getOneSignal()
    const notification = new OneSignal.Notification()

    notification.contents = { en: payload.body }
    notification.headings = { en: payload.title }
    notification.included_segments = [segment]
    notification.url = payload.url ?? 'https://nuketracker.com/dashboard'

    if (payload.data) {
      notification.data = payload.data
    }

    await new Promise<void>((resolve, reject) => {
      client.createNotification(notification, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  } catch (err) {
    console.error('[Notifications] OneSignal send failed:', err)
  }
}

// ─── Alert triggers ───────────────────────────────────────────────────────────

export async function triggerHRAlert(params: {
  playerName: string
  playerTeam: string
  inning: number
  exitVelocity: number
  distance: number
  gameId: string
}): Promise<void> {
  const payload: NotificationPayload = {
    title: `💣 ${params.playerName} HITS A HOME RUN!`,
    body: `${params.playerTeam} · ${params.exitVelocity.toFixed(0)} mph · ${params.distance} ft · Inning ${params.inning}`,
    url: 'https://nuketracker.com/live',
    data: { type: 'HR_ALERT', gameId: params.gameId },
  }

  // Get all users subscribed to HR_ALERT for this player
  const alerts = await db.alert.findMany({
    where: {
      type: 'HR_ALERT',
      active: true,
      OR: [
        { playerId: { not: null } },
        { teamId: null, playerId: null }, // global HR alerts
      ],
    },
    include: { user: true },
  })

  // Deduplicate by userId
  const userIds = new Set(alerts.map((a) => a.user.clerkId))

  // Rate limit: max 1 HR alert per user per 10 minutes
  const toNotify: string[] = []
  for (const clerkId of userIds) {
    const key = `alert:hr:${clerkId}:${params.gameId}`
    const recent = await cache.get(key)
    if (!recent) {
      toNotify.push(clerkId)
      await cache.set(key, true, 600) // 10-min cooldown
    }
  }

  await Promise.allSettled(
    toNotify.map((clerkId) => sendToUser(clerkId, payload))
  )

  console.log(`[Notifications] HR alert sent to ${toNotify.length} users for ${params.playerName}`)
}

export async function triggerLineupAlert(params: {
  teamName: string
  teamAbbr: string
  gameId: string
  side: 'home' | 'away'
  confirmedAt: Date
}): Promise<void> {
  const payload: NotificationPayload = {
    title: `📋 ${params.teamName} Lineup Confirmed`,
    body: `${params.teamAbbr} lineup is in — scores are being recalculated now`,
    url: 'https://nuketracker.com/lineup',
    data: { type: 'LINEUP_CONFIRMED', gameId: params.gameId },
  }

  const alerts = await db.alert.findMany({
    where: { type: 'LINEUP_CONFIRMED', active: true },
    include: { user: true },
  })

  await Promise.allSettled(
    alerts.map((a) => sendToUser(a.user.clerkId, payload))
  )
}

export async function triggerWeatherAlert(params: {
  stadiumName: string
  gameId: string
  oldBoost: number
  newBoost: number
  windSpeed: number
  windDirection: string
}): Promise<void> {
  const change = params.newBoost - params.oldBoost
  if (Math.abs(change) < 3) return // Only alert on meaningful changes

  const direction = change > 0 ? '↑ Improved' : '↓ Worsened'
  const payload: NotificationPayload = {
    title: `🌬️ Weather Update: ${params.stadiumName}`,
    body: `HR conditions ${direction} (${params.newBoost.toFixed(0)}% boost) · Wind: ${params.windSpeed.toFixed(0)} mph ${params.windDirection}`,
    url: 'https://nuketracker.com/weather',
    data: { type: 'WEATHER_CHANGE', gameId: params.gameId },
  }

  const alerts = await db.alert.findMany({
    where: { type: 'WEATHER_CHANGE', active: true },
    include: { user: true },
  })

  await Promise.allSettled(
    alerts.map((a) => sendToUser(a.user.clerkId, payload))
  )
}

export async function triggerEdgeAlert(params: {
  playerName: string
  modelProb: number
  bookProb: number
  edge: number
  bestBook: string
}): Promise<void> {
  if (params.edge < 0.08) return // Only alert on 8%+ edges

  const payload: NotificationPayload = {
    title: `📈 Value Alert: ${params.playerName}`,
    body: `+${(params.edge * 100).toFixed(1)}% edge on ${params.bestBook} · Model: ${(params.modelProb * 100).toFixed(1)}% vs Book: ${(params.bookProb * 100).toFixed(1)}%`,
    url: 'https://nuketracker.com/value',
    data: { type: 'EDGE_ALERT' },
  }

  const alerts = await db.alert.findMany({
    where: {
      type: 'EDGE_ALERT',
      active: true,
      user: { plan: { in: ['PRO', 'ELITE'] } },
    },
    include: { user: true },
  })

  // Rate limit: one edge alert per user per 5 min
  const toNotify: string[] = []
  for (const a of alerts) {
    const key = `alert:edge:${a.user.clerkId}:${params.playerName.replace(/\s/g, '')}`
    if (!(await cache.get(key))) {
      toNotify.push(a.user.clerkId)
      await cache.set(key, true, 300)
    }
  }

  await Promise.allSettled(
    toNotify.map((clerkId) => sendToUser(clerkId, payload))
  )
}

// ─── Broadcast to all Pro/Elite (OneSignal) ──────────────────────────────────

export async function broadcastTopPick(params: {
  playerName: string
  hrProbability: number
  nukeScore: number
}): Promise<void> {
  await sendToSegment('Pro', {
    title: `💣 Today's #1 Nuke Pick: ${params.playerName}`,
    body: `${(params.hrProbability * 100).toFixed(1)}% HR probability · Score: ${params.nukeScore}/100`,
    url: 'https://nuketracker.com/dashboard',
  })
}

// ─── FCM token management ─────────────────────────────────────────────────────

async function getUserFCMToken(clerkId: string): Promise<string | null> {
  const key = `fcm:token:${clerkId}`
  return cache.get<string>(key)
}

export async function saveUserFCMToken(clerkId: string, token: string): Promise<void> {
  const key = `fcm:token:${clerkId}`
  await cache.set(key, token, 86400 * 30) // 30 days
}

export async function deleteUserFCMToken(clerkId: string): Promise<void> {
  const key = `fcm:token:${clerkId}`
  await cache.del(key)
}
