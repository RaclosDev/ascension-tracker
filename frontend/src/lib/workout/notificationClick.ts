/** The few bits of the service worker `clients` API used to answer a tap on a notification. */
export interface ClickableWindow {
  url: string;
  focus?: () => Promise<ClickableWindow | null | undefined>;
  navigate?: (url: string) => Promise<unknown>;
}
export interface ClientsApi {
  matchAll: (options: {
    type: 'window';
    includeUncontrolled: boolean;
  }) => Promise<readonly ClickableWindow[]>;
  openWindow?: (url: string) => Promise<unknown>;
}

/** Only same-origin relative paths are followed; anything else falls back to the workout screen. */
export function notificationTargetUrl(data: unknown): string {
  const url = (data as { url?: unknown } | null)?.url;
  return typeof url === 'string' && /^\/(?!\/)/.test(url) ? url : '/workout';
}

/**
 * Brings the app to the front. A window that is already open is reused, even if it is on another page,
 * so the user never ends up with a second copy of the app (two copies would fight over the saved session).
 * A new window opens only when the app is not open at all.
 */
export async function focusOrOpen(clients: ClientsApi, url: string, origin: string) {
  const windows = (await clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(
    (client) => new URL(client.url).origin === origin,
  );
  const exact = windows.find((client) => new URL(client.url).pathname === url);
  const target = exact ?? windows[0];
  if (target?.focus) {
    const focused = (await target.focus()) ?? target;
    if (!exact) {
      try {
        if (focused.navigate) {
          await focused.navigate(url);
          return;
        }
      } catch {
        // Navigation refused: the window is in front, which is what matters.
      }
    }
    return;
  }
  await clients.openWindow?.(url);
}
