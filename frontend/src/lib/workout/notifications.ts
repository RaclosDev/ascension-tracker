import api from '@/api/client';
import { haptics } from '@/lib/haptics';
import { getWorkoutAccountRevision } from './accountIdentity';
import { showRestPush } from './pushPayload';

let audio: HTMLAudioElement | null = null;
let pushSubscribed = false;

/**
 * Call from a user gesture (e.g. completing a set): preloads the bell, asks for notification
 * permission and subscribes to Web Push.
 */
export async function initAudioAndNotifications() {
  if (typeof window === 'undefined') return;

  if (!audio) {
    audio = new Audio('/bell.mp3');
    audio.load();

    // Prevent pausing background music on iOS 16.4+
    if ('audioSession' in navigator) {
      try {
        (navigator as unknown as { audioSession: { type: string } }).audioSession.type =
          'transient'; // Mixes with other audio and ducks it slightly
      } catch (e: unknown) {
        console.warn('audioSession no soportado', e);
      }
    }
  }

  if ('Notification' in window && !pushSubscribed) {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await subscribeToPush();
      }
    } else if (Notification.permission === 'granted') {
      await subscribeToPush();
    }
  }
}

/**
 * Play the bell sound (only works when app is in foreground).
 */
export function playRestSound() {
  haptics.alarm();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch((e) => console.warn('Audio autoplay blocked', e));
  } catch (e: unknown) {
    console.warn('Error reproduciendo sonido', e);
  }
}

export const REST_NOTIFICATION_TAG = 'ascension-rest-timer';

export async function dismissRestNotifications() {
  if (typeof window === 'undefined') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'getNotifications' in reg) {
        const notifications = await reg.getNotifications();
        notifications
          .filter((notification) => notification.tag.startsWith(REST_NOTIFICATION_TAG))
          .forEach((notification) => notification.close());
      }
    }
  } catch (e: unknown) {
    console.warn('Error descartando notificaciones de descanso', e);
  }
}

/**
 * Show a local notification (only works when app is in foreground or recently backgrounded).
 * Replaces any existing notification with the same tag instead of accumulating in the system tray.
 */
export async function notifyRestFinished() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const tag =
      activeServerTimerId !== null && activeTimerAccountRevision === getWorkoutAccountRevision()
        ? `${REST_NOTIFICATION_TAG}-${activeServerTimerId}`
        : REST_NOTIFICATION_TAG;
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await showRestPush(reg, { tag });
          return;
        }
      }

      new Notification('¡Descanso terminado!', {
        body: 'Es hora de la siguiente serie.',
        icon: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag,
        renotify: false,
      } as NotificationOptions);
    } catch {
      // On some devices, local Notification constructor fails; SW push will handle it
    }
  }
}

async function subscribeToPush() {
  if (pushSubscribed) return;

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return;

    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const { data } = await api.get('/push/vapid-key');
      const vapidKey = data.publicKey;

      if (!vapidKey) {
        console.warn('No VAPID key from server');
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as ArrayBuffer,
      });
    }

    const subJSON = sub.toJSON();
    await api.post('/push/subscribe', {
      endpoint: subJSON.endpoint,
      keys: {
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
      },
    });

    pushSubscribed = true;
  } catch (e: unknown) {
    console.warn('Push subscription failed', e instanceof Error ? e.message : String(e));
  }
}

let timerQueue: Promise<void> = Promise.resolve();
let restIntent = 0;
let activeServerTimerId: number | null = null;
let activeTimerAccountRevision = 0;
function enqueueRestTimer(update: () => Promise<unknown>): Promise<void> {
  const revision = getWorkoutAccountRevision();
  timerQueue = timerQueue.then(async () => {
    if (revision !== getWorkoutAccountRevision()) return;
    try {
      await update();
    } catch (error) {
      console.warn(
        'Failed to update server rest timer',
        error instanceof Error ? error.message : String(error),
      );
    }
  });
  return timerQueue;
}

export function scheduleServerRestTimer(delaySec: number): Promise<void> {
  const deadline = Date.now() + delaySec * 1000;
  const intent = ++restIntent;
  activeServerTimerId = null;
  const revision = getWorkoutAccountRevision();
  return enqueueRestTimer(async () => {
    const remaining = Math.ceil((deadline - Date.now()) / 1000);
    if (remaining <= 0) return api.post('/push/rest-timer/cancel');
    const { data } = await api.post<{ timerId?: number }>('/push/rest-timer', {
      delaySec: remaining,
    });
    if (
      intent === restIntent &&
      revision === getWorkoutAccountRevision() &&
      Number.isSafeInteger(data?.timerId) &&
      data.timerId! > 0
    ) {
      activeServerTimerId = data.timerId!;
      activeTimerAccountRevision = revision;
    }
  });
}

export function cancelServerRestTimer(): Promise<void> {
  restIntent++;
  activeServerTimerId = null;
  return enqueueRestTimer(() => api.post('/push/rest-timer/cancel'));
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
