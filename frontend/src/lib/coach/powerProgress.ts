import { estimateOneRepMax, recordedPowerSets, type Lift } from '../powerlifting';
import type { CompletedWorkout } from '../workout/types';

export function powerProgress(history: CompletedWorkout[], since: number, until: number) {
  const sets = recordedPowerSets(history).filter((s) => s.date >= since && s.date <= until);
  return (['squat', 'bench', 'deadlift'] as Lift[]).map((lift) => {
    const rows = sets.filter((s) => s.lift === lift);
    const single = rows
      .filter((s) => s.reps === 1)
      .sort((a, b) => b.weight - a.weight || b.date - a.date)[0];
    const estimate = rows
      .flatMap((s) => {
        const e1rm = estimateOneRepMax(s.weight, s.reps);
        return e1rm === null ? [] : [{ kg: Math.round(e1rm * 2) / 2, date: s.date }];
      })
      .sort((a, b) => b.kg - a.kg || b.date - a.date)[0];
    const byWeek = new Map<string, typeof rows>();
    for (const row of rows) {
      const monday = new Date(row.date);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      byWeek.set(key, [...(byWeek.get(key) ?? []), row]);
    }
    const summarize = (entries: typeof rows) => {
      const rpes = entries.flatMap((s) => (s.rpe === null ? [] : [s.rpe]));
      return {
        sets: entries.length,
        reps: entries.reduce((sum, s) => sum + s.reps, 0),
        volume: entries.reduce((sum, s) => sum + s.weight * s.reps, 0),
        maxLoad: entries.reduce((max, s) => Math.max(max, s.weight), 0),
        rpe: rpes.length ? rpes.reduce((sum, n) => sum + n, 0) / rpes.length : null,
        rpeCount: rpes.length,
      };
    };
    return {
      lift,
      ...summarize(rows),
      single,
      estimate,
      weeks: [...byWeek]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, entries]) => ({ week, ...summarize(entries) })),
    };
  });
}
