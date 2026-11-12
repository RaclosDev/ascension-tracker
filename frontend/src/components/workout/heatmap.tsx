import { format } from 'date-fns';
import { ActivityCalendar } from '@/components/ui/ActivityCalendar';
import type { CompletedWorkout } from '@/lib/workout/types';

export function ActivityHeatmap({ history }: { history: CompletedWorkout[] }) {
  const volumeByDay = new Map<string, number>();

  for (const w of history) {
    const d = new Date(w.finishedAt);
    const dateStr = format(d, 'yyyy-MM-dd');
    const vol = w.exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets
          .filter((s) => s.completed)
          .reduce((sSum, s) => {
            const wt = Number(s.weight);
            const rp = Number(s.reps);
            return sSum + (Number.isFinite(wt) && Number.isFinite(rp) ? wt * rp : 0);
          }, 0)
      );
    }, 0);

    const existing = volumeByDay.get(dateStr) || 0;
    if (vol > 0) volumeByDay.set(dateStr, existing + vol);
  }

  return (
    <ActivityCalendar values={volumeByDay} formatValue={(volume) => `${Math.round(volume)} kg`} />
  );
}
