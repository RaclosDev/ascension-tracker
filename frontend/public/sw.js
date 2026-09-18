import { precacheAndRoute } from 'workbox-precaching';

// Precache resources injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);

// Ascension Service Worker – handles push notifications
const CACHE_NAME = 'ascension-v1';

// Push event — fires even when the app is in the background
self.addEventListener('push', (event) => {
  let data = { title: '¡Descanso terminado!', body: 'Es hora de la siguiente serie.' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback to defaults
  }

  const options = {
    body: data.body || 'Es hora de la siguiente serie.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 300],
    tag: 'rest-timer',
    renotify: true,
    requireInteraction: true,
    data: { url: '/workout' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'OK' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '¡Descanso terminado!', options)
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url.includes('/workout') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/workout');
      }
    })
  );
});

// Activate — claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Install — skip waiting
self.addEventListener('install', () => {
  self.skipWaiting();
});
