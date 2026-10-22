import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Checks whether an error is caused by a deployment chunk mismatch,
 * network failure during dynamic import, MIME type mismatch, or
 * stale minified chunk default export mismatch.
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
    msg.includes('load chunk') ||
    msg.includes('_result.default') ||
    msg.includes("reading 'default'") ||
    msg.includes('missing default export') ||
    msg.includes('invalid module')
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
      if (
        !component ||
        typeof component !== 'object' ||
        !('default' in component) ||
        !component.default
      ) {
        throw new Error('Failed to load component chunk: invalid module or missing default export');
      }
      sessionStorage.removeItem(sessionKey);
      sessionStorage.removeItem('ascension_global_chunk_reload_at');
      sessionStorage.removeItem('ascension_eb_reload_lock');
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
