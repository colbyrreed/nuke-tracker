// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// Handles background push notifications for Nuke Tracker

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '',
  projectId:         self.FIREBASE_PROJECT_ID         || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             self.FIREBASE_APP_ID             || '',
})

const messaging = firebase.messaging()

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload)

  const { title, body, icon, image } = payload.notification ?? {}
  const data = payload.data ?? {}

  const notificationOptions = {
    body: body ?? 'New update from Nuke Tracker',
    icon: icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    image,
    data: { url: data.url ?? 'https://nuketracker.com/dashboard', ...data },
    vibrate: [200, 100, 200],
    tag: data.type ?? 'nuke-tracker',
    renotify: true,
    actions: [
      { action: 'open', title: 'View →' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  self.registration.showNotification(
    title ?? '💣 Nuke Tracker',
    notificationOptions
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? 'https://nuketracker.com/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes('nuketracker.com') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new tab
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
