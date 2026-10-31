/// <reference lib="webworker" />
import { precacheAndRoute, matchPrecache, PrecacheEntry } from 'workbox-precaching';
declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] };

import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { showRestPush } from './lib/workout/pushPayload';

// Precache versioned static assets. Workbox manages old precache revisions.
precacheAndRoute(self.__WB_MANIFEST);

// Navigations always hit the network: a stale cached shell points at deleted Vite chunks
// ("Module script failed"). Fall back to the precached shell only when the network fails.
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

// Cache exercises catalog at runtime (offline-ready without bloating the installation precache)
registerRoute(
  ({ url }) =>
    url.pathname.endsWith('exercises.json') || url.pathname.endsWith('exercises-base.json'),
  new StaleWhileRevalidate({
    cacheName: 'exercises-catalog-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

self.addEventListener('push', (event: PushEvent) => {
  let data: unknown = null;

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    // fallback to defaults
  }

  event.waitUntil(showRestPush(self.registration, data));
});

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

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('install', () => {
  self.skipWaiting();
});
