// src/lib/notifications/firebase-admin.ts
// Firebase Admin SDK for server-side push notifications

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging'

let app: App

function getFirebaseAdmin(): App {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0]!
    } else {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    }
  }
  return app
}

// ─── Send to specific FCM tokens ─────────────────────────────────────────────

export async function sendPushToTokens(params: {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  clickAction?: string
}): Promise<{ successCount: number; failureCount: number }> {
  if (!params.tokens.length) return { successCount: 0, failureCount: 0 }

  const messaging = getMessaging(getFirebaseAdmin())

  const message: MulticastMessage = {
    tokens: params.tokens,
    notification: {
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl,
    },
    data: params.data ?? {},
    webpush: {
      notification: {
        title: params.title,
        body: params.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        click_action: params.clickAction ?? '/dashboard',
      },
      fcmOptions: { link: params.clickAction ?? '/dashboard' },
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'nuke-tracker-alerts',
        priority: 'high',
        defaultSound: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          contentAvailable: true,
        },
      },
    },
  }

  try {
    const response = await messaging.sendEachForMulticast(message)
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (err) {
    console.error('[Firebase] sendPushToTokens error:', err)
    return { successCount: 0, failureCount: params.tokens.length }
  }
}

// ─── Send to a topic ──────────────────────────────────────────────────────────

export async function sendPushToTopic(params: {
  topic: string // e.g. 'hr-alerts', 'lineup-NYY', 'weather-alerts'
  title: string
  body: string
  data?: Record<string, string>
  clickAction?: string
}): Promise<string | null> {
  const messaging = getMessaging(getFirebaseAdmin())

  try {
    const messageId = await messaging.send({
      topic: params.topic,
      notification: { title: params.title, body: params.body },
      data: params.data ?? {},
      webpush: {
        notification: {
          title: params.title,
          body: params.body,
          icon: '/icon-192.png',
          click_action: params.clickAction ?? '/dashboard',
        },
      },
    })
    return messageId
  } catch (err) {
    console.error('[Firebase] sendPushToTopic error:', err)
    return null
  }
}

// ─── Subscribe token to topic ─────────────────────────────────────────────────

export async function subscribeToTopic(tokens: string[], topic: string): Promise<void> {
  const messaging = getMessaging(getFirebaseAdmin())
  try {
    await messaging.subscribeToTopic(tokens, topic)
  } catch (err) {
    console.error('[Firebase] subscribeToTopic error:', err)
  }
}

export async function unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
  const messaging = getMessaging(getFirebaseAdmin())
  try {
    await messaging.unsubscribeFromTopic(tokens, topic)
  } catch (err) {
    console.error('[Firebase] unsubscribeFromTopic error:', err)
  }
}
