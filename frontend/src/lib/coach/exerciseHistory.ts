import type { CompletedWorkout, WorkoutSet } from '@/lib/workout/types';

interface LastDone {
  /** When the session started, in ms. */
  date: number;
  variant?: { grip?: string; machine?: string };
  /** Working sets the athlete completed, in order. */
  sets: WorkoutSet[];
}

export interface ExerciseUse {
  exerciseId: string;
  /** Sessions it appears in. */
  times: number;
  last: LastDone;
}

const worked = (set: WorkoutSet) =>
  set.completed && set.type !== 'warmup' && !!(set.weight || set.reps);

/** "80 kg × 6", or only the part the athlete logged. */
export const setText = (set: WorkoutSet) =>
  set.weight && set.reps
    ? `${set.weight} kg × ${set.reps}`
    : set.weight
      ? `${set.weight} kg`
      : `${set.reps} reps`;

/** The heaviest set of a session: what a coach looks at before writing the next load. */
export function bestSet(sets: WorkoutSet[]) {
  return sets.reduce<WorkoutSet | null>(
    (best, set) => (!best || Number(set.weight) > Number(best.weight) ? set : best),
    null,
  );
}

/** Every exercise the athlete has logged, most trained first. `history` is newest first. */
export function exerciseUse(history: CompletedWorkout[]): ExerciseUse[] {
  const uses = new Map<string, ExerciseUse>();
  for (const workout of history)
    for (const exercise of workout.exercises) {
      const sets = exercise.sets.filter(worked);
      if (!sets.length) continue;
      const use = uses.get(exercise.exerciseId);
      if (use) use.times++;
      else
        uses.set(exercise.exerciseId, {
          exerciseId: exercise.exerciseId,
          times: 1,
          last: { date: workout.startedAt, variant: exercise.variant, sets },
        });
    }
  return [...uses.values()].sort((a, b) => b.times - a.times || b.last.date - a.last.date);
}

/** Exercises the athlete usually trains in the same session as the given ones, closest first. */
export function companions(history: CompletedWorkout[], ids: string[]): string[] {
  const together = new Map<string, number>();
  for (const workout of history) {
    const logged = workout.exercises.map((exercise) => exercise.exerciseId);
    const shared = logged.filter((id) => ids.includes(id)).length;
    if (!shared) continue;
    for (const id of logged)
      if (!ids.includes(id)) together.set(id, (together.get(id) ?? 0) + shared);
  }
  return [...together.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
