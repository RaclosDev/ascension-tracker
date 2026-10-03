/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

import { precacheAndRoute } from 'workbox-precaching';
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

// Ascension Service Worker â€“ handles push notifications

// Push event â€” fires even when the app is in the background
self.addEventListener('push', (event: PushEvent) => {
  let data = { title: 'Â¡Descanso terminado!', body: 'Es hora de la siguiente serie.' };

  try {
    if (event.data) {
      data = event.data.json();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
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
    self.registration.showNotification(data.title || 'Â¡Descanso terminado!', options),
  );
});

// Notification click â€” open the app
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

// Activate â€” claim clients immediately
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// Install â€” skip waiting
self.addEventListener('install', () => {
  self.skipWaiting();
});




