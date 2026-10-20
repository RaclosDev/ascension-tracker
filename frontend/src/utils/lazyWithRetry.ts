import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Helper to wrap dynamic component imports with automatic reload recovery.
 * When a new deployment occurs, older chunk hashes may return 404 or index.html (MIME text/html).
 * This detects that specific deployment mismatch and cleanly reloads the window to fetch
 * the latest index.html and chunk manifest without stranding the user on an error screen.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    const sessionKey = 'ascension_chunk_reload_lock';

    try {
      const component = await factory();
      sessionStorage.removeItem(sessionKey);
      return component;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isMimeOrChunkError =
        errorMsg.includes('MIME type') ||
        errorMsg.includes('text/html') ||
        errorMsg.includes('dynamically imported module') ||
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        errorMsg.includes('Importing a module script failed') ||
        errorMsg.includes('error loading dynamically imported module');

      const alreadyReloaded = sessionStorage.getItem(sessionKey);

      if (isMimeOrChunkError && !alreadyReloaded) {
        sessionStorage.setItem(sessionKey, 'true');
        // Hard refresh from server to pull latest index.html with new chunk hashes
        window.location.reload();
        // Return a never-resolving promise so React Suspense/ErrorBoundary doesn't crash while reloading
        return new Promise<{ default: T }>(() => {});
      }

      sessionStorage.removeItem(sessionKey);
      throw error;
    }
  });
}
