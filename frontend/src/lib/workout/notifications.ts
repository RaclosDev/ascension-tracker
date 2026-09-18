//  Notifications module 
// Handles:
// 1. Subscribing to Web Push (so the server can send background notifications)
// 2. Playing a bell sound when rest finishes (in-app)
// 3. Sending rest-timer schedule/cancel requests to the backend

let audio: HTMLAudioElement | null = null;
let pushSubscribed = false;

/**
 * Call this once on user interaction (e.g. completing a set) to:
 * - Preload the bell sound
 * - Request notification permission
 * - Subscribe to Web Push if not already done
 */
export async function initAudioAndNotifications() {
  if (typeof window === "undefined") return;

  // Init HTML5 Audio
  if (!audio) {
    audio = new Audio('/bell.mp3');
    audio.load();

    // Prevent pausing background music on iOS 16.4+
    if ('audioSession' in navigator) {
      try {
        (navigator as any).audioSession.type = 'transient'; // Mixes with other audio and ducks it slightly
      } catch (e) {
        console.warn("audioSession no soportado", e);
      }
    }
  }

  // Request Notification permission + subscribe to push
  if ("Notification" in window && !pushSubscribed) {
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        await subscribeToPush();
      }
    } else if (Notification.permission === "granted") {
      await subscribeToPush();
    }
  }
}

/**
 * Play the bell sound (only works when app is in foreground).
 */
export function playRestSound() {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(e => console.warn("Audio autoplay blocked", e));
  } catch (e) {
    console.warn("Error reproduciendo sonido", e);
  }
}

/**
 * Show a local notification (only works when app is in foreground or recently backgrounded).
 */
export function notifyRestFinished() {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    try {
      new Notification("¡Descanso terminado!", {
        body: "Es hora de la siguiente serie.",
        icon: "/icon-192.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: "rest-finished",
      } as any);
    } catch {
      // On some devices, local Notification constructor fails; SW push will handle it
    }
  }
}

//  Web Push subscription 

async function subscribeToPush() {
  if (pushSubscribed) return;
  
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return;

    // Check if already subscribed
    let sub = await reg.pushManager.getSubscription();
    
    if (!sub) {
      // Get VAPID public key from server
      const api = (await import("@/api/client")).default;
      const { data } = await api.get("/push/vapid-key");
      const vapidKey = data.publicKey;
      
      if (!vapidKey) {
        console.warn("No VAPID key from server");
        return;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // Send subscription to backend
    const api = (await import("@/api/client")).default;
    const subJSON = sub.toJSON();
    await api.post("/push/subscribe", {
      endpoint: subJSON.endpoint,
      keys: {
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
      },
    });
    
    pushSubscribed = true;
    console.info("Push subscription registered");
  } catch (e) {
    console.warn("Push subscription failed", e);
  }
}

//  Rest timer API calls 

/**
 * Tell the server to send a push notification after `delaySec` seconds.
 */
export async function scheduleServerRestTimer(delaySec: number) {
  try {
    const api = (await import("@/api/client")).default;
    await api.post("/push/rest-timer", { delaySec });
  } catch (e) {
    console.warn("Failed to schedule server rest timer", e);
  }
}

/**
 * Cancel any pending server-side rest timer (e.g. user skipped rest or adjusted it).
 */
export async function cancelServerRestTimer() {
  try {
    const api = (await import("@/api/client")).default;
    await api.post("/push/rest-timer/cancel");
  } catch (e) {
    console.warn("Failed to cancel server rest timer", e);
  }
}

//  Utility 

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
