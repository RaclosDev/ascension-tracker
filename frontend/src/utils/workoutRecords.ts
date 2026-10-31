import type { CompletedWorkout, WorkoutExercise } from '../lib/workout/types';

export function workoutVariantKey(exerciseId: string, variant?: WorkoutExercise['variant']) {
  return JSON.stringify([
    exerciseId,
    (variant?.grip || '').trim().toLowerCase(),
    (variant?.machine || '').trim().toLowerCase(),
  ]);
}

/** The detail view compares every row against the same history, excluding itself. */
export function buildWorkoutRecords(history: CompletedWorkout[], excludeWorkoutId?: string) {
  const records = new Map<string, number>();
  for (const workout of history) {
    if (excludeWorkoutId && workout.id === excludeWorkoutId) continue;
    for (const exercise of workout.exercises) {
      const key = workoutVariantKey(exercise.exerciseId, exercise.variant);
      let best = records.get(key) ?? 0;
      for (const set of exercise.sets) {
        if (!set.completed) continue;
        const weight = Number.parseFloat(set.weight);
        if (Number.isFinite(weight) && weight > best) best = weight;
      }
      records.set(key, best);
    }
  }
  return records;
}

export function beatsWorkoutRecord(weight: string, best: number) {
  const parsed = Number.parseFloat(weight);
  return Number.isFinite(parsed) && parsed > best && best > 0;
}
