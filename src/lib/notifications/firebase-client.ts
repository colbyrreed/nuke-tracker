// src/lib/notifications/firebase-client.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return app
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (messaging) return messaging
  try {
    messaging = getMessaging(getFirebaseApp())
    return messaging
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const msg = getFirebaseMessaging()
    if (!msg) return null
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(msg, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })
    if (token) {
      await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    }
    return token
  } catch (err) {
    console.error('[FCM] Token request failed:', err)
    return null
  }
}

export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
) {
  const msg = getFirebaseMessaging()
  if (!msg) return () => {}
  return onMessage(msg, callback)
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}
