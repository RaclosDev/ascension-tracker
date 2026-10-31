import { isPrSet } from '../lib/workout/format';
import type { getExerciseMap } from '../lib/workout/exercises';
import type { WorkoutExercise, WorkoutSet, CompletedWorkout } from '../lib/workout/types';

export function summarizeWorkoutExercises(
  exercises: WorkoutExercise[],
  catalog: ReturnType<typeof getExerciseMap>,
  recentWorkouts: CompletedWorkout[],
) {
  // Filter completed sets and exercises
  return exercises
    .map((ex) => {
      const meta = catalog.get(ex.exerciseId);
      const doneSets = ex.sets.filter((s) => s.completed);
      const exVolume = doneSets.reduce((sum, s) => {
        const w = parseFloat(String(s.weight || '0').replace(',', '.'));
        const r = parseInt(String(s.reps || '0'), 10);
        return sum + (!isNaN(w) && !isNaN(r) ? w * r : 0);
      }, 0);

      // Best set calculation (highest weight or 1RM)
      let bestSet: WorkoutSet | null = null;
      let maxWeight = -1;
      let maxReps = -1;
      for (const s of doneSets) {
        const w = parseFloat(String(s.weight || '0').replace(',', '.')) || 0;
        const r = parseInt(String(s.reps || '0'), 10) || 0;
        if (w > maxWeight || (w === maxWeight && r > maxReps)) {
          maxWeight = w;
          maxReps = r;
          bestSet = s;
        }
      }

      const hasPr = doneSets.some((s) =>
        isPrSet(ex.exerciseId, ex.variant, s.weight, recentWorkouts),
      );

      return {
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: meta?.name || 'Ejercicio',
        muscle: meta?.muscle,
        gifUrl: meta?.gifUrl,
        variant: ex.variant,
        completedSetsCount: doneSets.length,
        sets: doneSets,
        volume: exVolume,
        bestSet,
        hasPr,
      };
    })
    .filter((e) => e.completedSetsCount > 0);
}

export function formatWorkoutDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
