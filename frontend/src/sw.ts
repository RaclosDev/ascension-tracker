/// <reference lib="webworker" />
import { precacheAndRoute, PrecacheEntry } from 'workbox-precaching';
declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] };

import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache resources injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);

// Cache API requests for offline support
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/workouts') || url.pathname.startsWith('/api/nutrition'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/foods/search'),
  new StaleWhileRevalidate({
    cacheName: 'food-search-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100 })],
  }),
);

// Ascension Service Worker — handles push notifications

// Push event — fires even when the app is in the background
self.addEventListener('push', (event: PushEvent) => {
  let data = { title: '¡¡Descanso terminado!', body: 'Es hora de la siguiente serie.' };

  try {
    if (event.data) {
      data = event.data.json();
    }

  } catch {
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
      { action: 'dismiss', title: 'OK' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '¡¡Descanso terminado!', options),
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url.includes('/workout') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/workout');
      }
    }),
  );
});

// Activate — claim clients immediately
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// Install — skip waiting
self.addEventListener('install', () => {
  self.skipWaiting();
});
