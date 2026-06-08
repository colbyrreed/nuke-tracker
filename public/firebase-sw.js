// public/firebase-sw.js
// Firebase Cloud Messaging Service Worker
// Handles background push notifications when app is not in foreground

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {}

  self.registration.showNotification(title ?? 'Nuke Tracker', {
    body: body ?? '',
    icon: icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data ?? {},
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
  })
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? 'https://nuketracker.com/dashboard'

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('nuketracker.com') && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
    )
  }
})
