import { useQuery } from '@tanstack/react-query';
import { fetchExerciseCatalog } from './exercises';
import type { Exercise } from './types';

export const EXERCISE_CATALOG_QUERY_KEY = ['exercise-catalog'] as const;

export function useExerciseCatalog() {
  return useQuery<Exercise[]>({
    queryKey: EXERCISE_CATALOG_QUERY_KEY,
    queryFn: fetchExerciseCatalog,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
