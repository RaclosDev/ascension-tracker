import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { CoachPerson } from './api';

export interface WorkoutComment {
  coach: CoachPerson;
  text: string;
  updatedAt: string;
}

/** Coach comments on one of the user's own workouts. */
export const useWorkoutComments = (workoutId: string | null) =>
  useQuery({
    queryKey: ['coaching', 'workouts', workoutId, 'comments'],
    enabled: Boolean(workoutId),
    queryFn: async () =>
      (
        await api.get<WorkoutComment[]>(
          `/coaching/workouts/${encodeURIComponent(workoutId!)}/comments`,
        )
      ).data,
  });
