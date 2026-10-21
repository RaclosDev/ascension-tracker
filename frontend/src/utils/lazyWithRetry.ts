import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Checks whether an error is caused by a deployment chunk mismatch,
 * network failure during dynamic import, or MIME type mismatch.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('mime type') ||
    msg.includes('text/html') ||
    msg.includes('dynamically imported module') ||
    msg.includes('failed to fetch dynamically') ||
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed') ||
    msg.includes('importing module script failed') ||
    msg.includes('module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('failed to load module script') ||
    msg.includes('loading chunk') ||
    msg.includes('load chunk')
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const sessionKey = 'ascension_chunk_reload_lock';

    try {
      const component = await factory();
      sessionStorage.removeItem(sessionKey);
      return component;
    } catch (error: unknown) {
      const isMimeOrChunkError = isChunkLoadError(error);
      const alreadyReloaded = sessionStorage.getItem(sessionKey);

      if (isMimeOrChunkError && !alreadyReloaded) {
        sessionStorage.setItem(sessionKey, 'true');
        // Never delete all Cache Storage entries here: that includes Workbox's
        // precache and can destroy the only offline app shell.
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      sessionStorage.removeItem(sessionKey);
      throw error;
    }
  });
}
