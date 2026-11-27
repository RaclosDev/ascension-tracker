import { useEffect, useState } from 'react';

/**
 * Loads an optional chunk (one that needs the network and is not in the precache). `React.lazy` keeps a
 * failed import forever, so a screen opened offline would never get its card back without a reload; this
 * gives up quietly (null) and tries again as soon as the browser reports the network is back.
 */
export function useRetryingImport<T>(load: () => Promise<T>): T | null {
  const [value, setValue] = useState<T | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loaded = value !== null;

  useEffect(() => {
    if (loaded) return;
    let alive = true;
    load().then(
      (result) => {
        if (alive) setValue(() => result);
      },
      () => {
        // Offline or a stale chunk: stay empty until the connection returns.
      },
    );
    return () => {
      alive = false;
    };
    // `load` is a module-level loader: only a new attempt should re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, loaded]);

  useEffect(() => {
    if (loaded) return;
    const retry = () => setAttempt((n) => n + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [loaded]);

  return value;
}
