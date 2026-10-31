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

export function clearChunkReloadLocks(): void {
  try {
    for (const key of [
      'ascension_chunk_reload_lock',
      'ascension_global_chunk_reload_at',
      'ascension_eb_reload_lock',
    ])
      sessionStorage.removeItem(key);
  } catch {
    // Restricted storage must not prevent rendering or manual recovery.
  }
}

export function claimChunkReload(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, 'true');
    return true;
  } catch {
    // Without a persistent lock, automatic reload could loop indefinitely.
    return false;
  }
}

export function lazyWithRetry<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
): LazyExoticComponent<ComponentType<P>> {
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
      clearChunkReloadLocks();
      return component;
    } catch (error: unknown) {
      const isMimeOrChunkError = isChunkLoadError(error);
      if (isMimeOrChunkError && claimChunkReload(sessionKey)) {
        // Never delete all Cache Storage entries here: that includes Workbox's
        // precache and can destroy the only offline app shell.
        window.location.reload();
        return new Promise<{ default: ComponentType<P> }>(() => {});
      }

      throw error;
    }
  });
}
