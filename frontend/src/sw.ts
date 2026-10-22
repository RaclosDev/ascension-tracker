/// <reference lib="webworker" />
import { precacheAndRoute, matchPrecache, PrecacheEntry } from 'workbox-precaching';
declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] };

import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache versioned static assets. Workbox manages old precache revisions.
precacheAndRoute(self.__WB_MANIFEST);

// Do not serve a stale cached index.html just because mobile networking takes >3s.
// A stale shell references deleted Vite chunk hashes and results in "Module script failed".
// Use the network for every navigation while online; only fall back to the precached shell
// when the network actually fails (offline).
const navigationStrategy = new NetworkOnly({
  plugins: [
    {
      handlerDidError: async () => {
        return (await matchPrecache('/index.html')) || Response.error();
      },
    },
  ],
});
const navigationRoute = new NavigationRoute(navigationStrategy, {
  denylist: [/^\/api/],
});
registerRoute(navigationRoute);

// Cache public external food search results only (non-sensitive)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/food-external/search'),
  new StaleWhileRevalidate({
    cacheName: 'food-search-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100 })],
  }),
);

// Ascension Service Worker: handles push notifications
self.addEventListener('push', (event: PushEvent) => {
  let data = { title: '¡Descanso terminado!', body: 'Es hora de la siguiente serie.' };

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
    tag: 'ascension-rest-timer',
    renotify: true,
    requireInteraction: false,
    data: { url: '/workout' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'OK' },
    ],
  };

  event.waitUntil(
    self.registration.getNotifications({ tag: 'ascension-rest-timer' }).then((existing) => {
      existing.forEach((n) => n.close());
      return self.registration.showNotification(data.title || '¡Descanso terminado!', options);
    }),
  );
});

// Notification click: open the app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/workout') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/workout');
      }
    }),
  );
});

// Activate: claim clients immediately
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// Install: skip waiting
self.addEventListener('install', () => {
  self.skipWaiting();
});
