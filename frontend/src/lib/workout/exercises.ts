import type { Exercise } from './types';

export let EXERCISE_CATALOG: Exercise[] = [];
export let BASE_EXERCISES: Exercise[] = [];

export const fetchExerciseCatalog = async () => {
  if (EXERCISE_CATALOG.length > 0 && BASE_EXERCISES.length > 0) return EXERCISE_CATALOG;

  const [res, baseRes] = await Promise.all([
    fetch('/exercises.json'),
    fetch('/exercises-base.json').catch(() => null),
  ]);

  EXERCISE_CATALOG = await res.json();
  if (baseRes) {
    BASE_EXERCISES = await baseRes.json();
  }

  return EXERCISE_CATALOG;
};

export function getExerciseMap(custom: Exercise[] = []) {
  const map = new Map<string, Exercise>();
  for (const ex of BASE_EXERCISES) map.set(ex.id, ex);
  for (const ex of EXERCISE_CATALOG) map.set(ex.id, ex);
  for (const customEx of custom) map.set(customEx.id, customEx);
  return map;
}




