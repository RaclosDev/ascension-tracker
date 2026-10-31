import type { Exercise, CompletedWorkout } from '../lib/workout/types';
import { formatVariant } from '../lib/workout/format';

export function exerciseHistoryStats(
  exercise: Exercise | null,
  history: CompletedWorkout[],
  filterGrip: string,
  filterMachine: string,
) {
  if (!exercise) return null;

  let maxWeight = 0;
  const maxWeightPerRange = {
    '1-5': 0,
    '6-10': 0,
    '11-15': 0,
    '16+': 0,
  };
  const sessions: Array<{
    date: number;
    name: string;
    variant?: string;
    sets: Array<{ weight: string; reps: string }>;
  }> = [];

  for (const session of history) {
    const exDatas = session.exercises.filter((e: import('@/lib/workout/types').WorkoutExercise) => {
      if (e.exerciseId !== exercise.id) return false;
      if (filterGrip !== 'ALL' && e.variant?.grip !== filterGrip) return false;
      if (filterMachine !== 'ALL' && e.variant?.machine !== filterMachine) return false;
      return true;
    });

    for (const exData of exDatas) {
      const validSets = exData.sets.filter(
        (s: import('@/lib/workout/types').WorkoutSet) => s.completed,
      );
      if (validSets.length === 0) continue;

      const sessionSets: Array<{ weight: string; reps: string }> = [];

      for (const set of validSets) {
        const w = Number.parseFloat(set.weight);
        const r = Number.parseFloat(set.reps);

        sessionSets.push({ weight: set.weight, reps: set.reps });

        if (Number.isFinite(w) && w > maxWeight) {
          maxWeight = w;
        }

        if (Number.isFinite(w) && Number.isFinite(r)) {
          if (r >= 1 && r <= 5) maxWeightPerRange['1-5'] = Math.max(maxWeightPerRange['1-5'], w);
          else if (r >= 6 && r <= 10)
            maxWeightPerRange['6-10'] = Math.max(maxWeightPerRange['6-10'], w);
          else if (r >= 11 && r <= 15)
            maxWeightPerRange['11-15'] = Math.max(maxWeightPerRange['11-15'], w);
          else if (r >= 16) maxWeightPerRange['16+'] = Math.max(maxWeightPerRange['16+'], w);
        }
      }

      sessions.push({
        date: session.finishedAt,
        name: session.name || 'Entrenamiento',
        variant: formatVariant(exData.variant),
        sets: sessionSets,
      });
    }
  }

  return {
    maxWeight,
    maxWeightPerRange,
    sessions: sessions.sort((a, b) => b.date - a.date),
  };
}
