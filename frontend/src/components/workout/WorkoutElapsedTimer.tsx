import { useNow } from '@/hooks/use-now';
import { useWorkoutStore } from '@/lib/workout/store';
import { formatDuration } from '@/lib/workout/format';

export function WorkoutElapsedTimer() {
  const startedAt = useWorkoutStore((state) => state.active?.startedAt);
  const now = useNow(startedAt !== undefined, 500);
  return (
    <div
      className="active-workout-timer"
      style={{ pointerEvents: 'auto', minWidth: '48px', justifyContent: 'center' }}
    >
      <span className="active-workout-timer-dot" />
      <span className="active-workout-timer-text">
        {formatDuration(startedAt === undefined ? 0 : now - startedAt)}
      </span>
    </div>
  );
}
