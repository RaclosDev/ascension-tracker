export function parseRestPushPayload(value: unknown) {
  const data = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    title:
      typeof data.title === 'string' && data.title.trim() ? data.title : '¡Descanso terminado!',
    body:
      typeof data.body === 'string' && data.body.trim()
        ? data.body
        : 'Es hora de la siguiente serie.',
    tag:
      typeof data.tag === 'string' && /^ascension-rest-timer-\d+$/.test(data.tag)
        ? data.tag
        : 'ascension-rest-timer',
  };
}

type NotificationRegistration = {
  getNotifications: () => Promise<Array<{ tag: string; close: () => void }>>;
  showNotification: (title: string, options: NotificationOptions) => Promise<void>;
};

export async function showRestPush(registration: NotificationRegistration, payload: unknown) {
  const data = parseRestPushPayload(payload);
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.tag,
    renotify: false,
    requireInteraction: false,
    data: { url: '/workout' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'OK' },
    ],
  };
  const existing = await registration.getNotifications();
  existing
    .filter(
      (notification) =>
        notification.tag.startsWith('ascension-rest-timer') && notification.tag !== data.tag,
    )
    .forEach((notification) => notification.close());
  await registration.showNotification(data.title, options);
}
