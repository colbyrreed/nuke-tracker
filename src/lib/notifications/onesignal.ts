// src/lib/notifications/onesignal.ts
// OneSignal REST API integration for web push notifications

const ONESIGNAL_API = 'https://onesignal.com/api/v1'

interface OneSignalNotification {
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
  imageUrl?: string
  playerIds?: string[]      // specific device IDs
  externalUserIds?: string[] // clerk user IDs
  segments?: string[]        // 'All', 'Subscribed Users', etc.
  filters?: OneSignalFilter[]
  sendAfter?: string         // ISO date string for scheduled
}

interface OneSignalFilter {
  field: string
  key?: string
  relation: '=' | '!=' | '>' | '<' | 'exists' | 'not_exists'
  value?: string
}

interface OneSignalResponse {
  id: string
  recipients: number
  external_id?: string
  errors?: string[]
}

async function oneSignalRequest(endpoint: string, body: unknown): Promise<OneSignalResponse | null> {
  try {
    const res = await fetch(`${ONESIGNAL_API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[OneSignal] API error:', err)
      return null
    }
    return res.json()
  } catch (err) {
    console.error('[OneSignal] request error:', err)
    return null
  }
}

// ─── Send notification ────────────────────────────────────────────────────────

export async function sendOneSignalNotification(
  n: OneSignalNotification
): Promise<OneSignalResponse | null> {
  const payload: Record<string, unknown> = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: { en: n.title },
    contents: { en: n.body },
    url: n.url ?? 'https://nuketracker.com/dashboard',
    data: n.data ?? {},
    chrome_web_icon: 'https://nuketracker.com/icon-192.png',
    firefox_icon: 'https://nuketracker.com/icon-192.png',
    chrome_web_badge: 'https://nuketracker.com/badge-72.png',
  }

  if (n.imageUrl) payload.big_picture = n.imageUrl

  // Targeting
  if (n.playerIds?.length) {
    payload.include_player_ids = n.playerIds
  } else if (n.externalUserIds?.length) {
    payload.include_external_user_ids = n.externalUserIds
  } else if (n.filters?.length) {
    payload.filters = n.filters
  } else if (n.segments?.length) {
    payload.included_segments = n.segments
  } else {
    payload.included_segments = ['All']
  }

  if (n.sendAfter) payload.send_after = n.sendAfter

  return oneSignalRequest('/notifications', payload)
}

// ─── Pre-built alert types ────────────────────────────────────────────────────

export async function sendHRAlert(params: {
  playerName: string
  team: string
  inning: number
  exitVelocity: number
  distance: number
  userIds?: string[]
}) {
  return sendOneSignalNotification({
    title: `💣 ${params.playerName} GOES DEEP!`,
    body: `${params.team} · Inning ${params.inning} · ${params.exitVelocity.toFixed(1)} mph · ${params.distance}ft`,
    url: 'https://nuketracker.com/live',
    data: { type: 'hr_alert', playerName: params.playerName },
    externalUserIds: params.userIds,
    segments: params.userIds ? undefined : ['HR Alert Subscribers'],
  })
}

export async function sendLineupAlert(params: {
  team: string
  teamAbbr: string
  gameTime: string
  topPlayer: string
  topScore: number
  userIds?: string[]
}) {
  return sendOneSignalNotification({
    title: `📋 ${params.team} Lineup Confirmed`,
    body: `${params.gameTime} · ${params.topPlayer} ranks #1 with score ${params.topScore}`,
    url: 'https://nuketracker.com/lineup',
    data: { type: 'lineup_confirmed', team: params.teamAbbr },
    externalUserIds: params.userIds,
    segments: params.userIds ? undefined : [`Lineup ${params.teamAbbr}`],
  })
}

export async function sendWeatherAlert(params: {
  stadium: string
  team: string
  windSpeed: number
  windDir: string
  hrBoost: number
  userIds?: string[]
}) {
  const emoji = params.hrBoost >= 5 ? '💨🔥' : '⚠️'
  return sendOneSignalNotification({
    title: `${emoji} Weather Alert: ${params.stadium}`,
    body: `${params.windSpeed.toFixed(0)}mph ${params.windDir} · HR Boost: +${params.hrBoost.toFixed(1)}%`,
    url: 'https://nuketracker.com/weather',
    data: { type: 'weather_alert', stadium: params.stadium },
    externalUserIds: params.userIds,
    segments: params.userIds ? undefined : ['Weather Alert Subscribers'],
  })
}

export async function sendEdgeAlert(params: {
  playerName: string
  modelProb: number
  bookProb: number
  edge: number
  book: string
  userIds?: string[]
}) {
  return sendOneSignalNotification({
    title: `📈 Edge Alert: ${params.playerName}`,
    body: `Model: ${(params.modelProb * 100).toFixed(1)}% vs ${params.book}: ${(params.bookProb * 100).toFixed(1)}% · Edge: +${(params.edge * 100).toFixed(1)}%`,
    url: 'https://nuketracker.com/value',
    data: { type: 'edge_alert', player: params.playerName },
    externalUserIds: params.userIds,
    segments: params.userIds ? undefined : ['Edge Alert Subscribers'],
  })
}

export async function sendInjuryAlert(params: {
  playerName: string
  team: string
  status: string
  userIds?: string[]
}) {
  return sendOneSignalNotification({
    title: `🚨 Injury Alert: ${params.playerName}`,
    body: `${params.team} · ${params.status}`,
    url: 'https://nuketracker.com/dashboard',
    data: { type: 'injury_alert', player: params.playerName },
    externalUserIds: params.userIds,
    segments: params.userIds ? undefined : ['Injury Alert Subscribers'],
  })
}
