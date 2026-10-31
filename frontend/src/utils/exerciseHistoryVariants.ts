import type { CompletedWorkout } from '../lib/workout/types';

export function collectExerciseVariants(history: CompletedWorkout[], exerciseId?: string | null) {
  const grips = new Set<string>();
  const machines = new Set<string>();
  for (const session of history) {
    for (const exercise of session.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      if (exercise.variant?.grip) grips.add(exercise.variant.grip);
      if (exercise.variant?.machine) machines.add(exercise.variant.machine);
    }
  }
  return { grips: [...grips].sort(), machines: [...machines] };
}
