/// <reference lib="webworker" />
import { createHandlerBoundToURL, precacheAndRoute, PrecacheEntry } from 'workbox-precaching';
declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (PrecacheEntry | string)[] };

import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache resources injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);

// SPA Navigation fallback for offline navigation (excluding /api routes)
const navigationHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navigationHandler, {
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

// Ascension Service Worker — handles push notifications

// Push event — fires even when the app is in the background
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
