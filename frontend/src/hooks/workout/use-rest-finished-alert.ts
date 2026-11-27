import { useEffect, useRef } from 'react';
import { useNow } from '@/hooks/use-now';
import { useWorkoutStore } from '@/lib/workout/store';
import { playRestSound, notifyRestFinished } from '@/lib/workout/notifications';

/** How long after a rest ends a sound is still worth playing. */
const RECENT_MS = 15000;

/**
 * Rings (sound + notification) when the rest timer runs out and clears it. It lives in the app shell, not
 * in the live session screen, so the alert also fires while the user is on another page mid-workout.
 */
export function useRestFinishedAlert() {
  const restUntil = useWorkoutStore((s) => s.restUntil);
  const skipRest = useWorkoutStore((s) => s.skipRest);
  const now = useNow(!!restUntil, 200);
  const notified = useRef(false);

  useEffect(() => {
    if (restUntil) notified.current = false;
  }, [restUntil]);

  useEffect(() => {
    if (!restUntil || restUntil > now) return;
    if (!notified.current) {
      // Skip the bell if it ended long ago: a phone locked in a pocket for ten minutes must not chime.
      if (now - restUntil < RECENT_MS) {
        playRestSound();
        void notifyRestFinished();
      }
      notified.current = true;
    }
    skipRest();
  }, [restUntil, now, skipRest]);
}
