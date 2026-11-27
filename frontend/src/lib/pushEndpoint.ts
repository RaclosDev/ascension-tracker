/**
 * Endpoint of this browser's push subscription, if there is one. The server uses it on logout to delete
 * only this device's subscription. It never blocks or breaks the logout: a missing service worker, a
 * browser without push or a slow lookup all just return null.
 */
export async function currentPushEndpoint(timeoutMs = 1500): Promise<string | null> {
  try {
    const lookup = (async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      const subscription = await reg?.pushManager?.getSubscription();
      return subscription?.endpoint ?? null;
    })();
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
    return await Promise.race([lookup, timeout]);
  } catch {
    return null;
  }
}
