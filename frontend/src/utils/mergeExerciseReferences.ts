import api from '../api/client';
import { getWorkoutAccountRevision } from '../lib/workout/accountIdentity';
import { useWorkoutStore } from '../lib/workout/store';

export async function mergeExerciseReferences(sourceId: string, targetId: string) {
  const revision = getWorkoutAccountRevision();
  const response = await api.post(`/workouts/exercises/${encodeURIComponent(sourceId)}/merge`, {
    targetExerciseId: targetId,
  });
  if (revision === getWorkoutAccountRevision()) {
    useWorkoutStore.setState((state) => {
      if (!state.active?.exercises.some((exercise) => exercise.exerciseId === sourceId))
        return state;
      return {
        active: {
          ...state.active,
          exercises: state.active.exercises.map((exercise) =>
            exercise.exerciseId === sourceId ? { ...exercise, exerciseId: targetId } : exercise,
          ),
        },
      };
    });
  }
  return response;
}
