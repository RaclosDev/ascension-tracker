import { useState, useMemo } from 'react';
import { normalizeString } from '@/lib/workout/format';
import { MUSCLE_LABEL, type Exercise, type MuscleGroup, type Equipment } from '@/lib/workout/types';
import { BASE_EXERCISES, EXERCISE_CATALOG } from '@/lib/workout/exercises';

export type ExerciseTabFilter = 'basicos' | 'todos' | 'custom' | 'variantes';

export interface UseExerciseFiltersParams {
  customExercises: Exercise[];
  hiddenEquipments?: string[];
  aliases?: Record<string, string>;
  recentWorkouts?: Array<{ exercises: Array<{ exerciseId: string }>; startedAt: number }>;
}

export interface UseExerciseFiltersReturn {
  query: string;
  setQuery: (q: string) => void;
  filter: ExerciseTabFilter;
  setFilter: (f: ExerciseTabFilter) => void;
  filterMuscle: MuscleGroup | 'ALL';
  setFilterMuscle: (m: MuscleGroup | 'ALL') => void;
  filterEquip: Equipment | 'ALL';
  setFilterEquip: (e: Equipment | 'ALL') => void;
  filteredExercises: Exercise[];
  lastUsedMap: Map<string, number>;
  usageCountMap: Map<string, number>;
  totalResults: number;
}

export function useExerciseFilters({
  customExercises,
  hiddenEquipments = [],
  aliases = {},
  recentWorkouts = [],
}: UseExerciseFiltersParams): UseExerciseFiltersReturn {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ExerciseTabFilter>('basicos');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
  const [filterEquip, setFilterEquip] = useState<Equipment | 'ALL'>('ALL');

  // Memorización de uso y última fecha
  const { lastUsedMap, usageCountMap } = useMemo(() => {
    const lastUsed = new Map<string, number>();
    const usageCount = new Map<string, number>();

    for (const w of recentWorkouts) {
      for (const ex of w.exercises) {
        const current = lastUsed.get(ex.exerciseId) || 0;
        if (w.startedAt > current) {
          lastUsed.set(ex.exerciseId, w.startedAt);
        }
        usageCount.set(ex.exerciseId, (usageCount.get(ex.exerciseId) || 0) + 1);
      }
    }

    return { lastUsedMap: lastUsed, usageCountMap: usageCount };
  }, [recentWorkouts]);

  // Selección de colección base según pestaña
  const sourceList = useMemo(() => {
    if (filter === 'custom') return customExercises;
    if (filter === 'basicos') return BASE_EXERCISES;
    return EXERCISE_CATALOG;
  }, [filter, customExercises]);

  // Filtrado compuesto y ordenación por última fecha de uso
  const filteredExercises = useMemo(() => {
    const normalizedQuery = normalizeString(query.trim());
    const queryWords = normalizedQuery ? normalizedQuery.split(/\s+/) : [];

    return sourceList
      .filter((ex) => !hiddenEquipments.includes(ex.equipment))
      .filter((ex) => {
        if (queryWords.length === 0) return true;
        const targetName = normalizeString(aliases[ex.id] || ex.name);
        const originalName = normalizeString(ex.name);
        const muscleName = normalizeString(
          MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL] || '',
        );
        const equipName = normalizeString(ex.equipment);
        const tagsName = normalizeString((ex.tags || []).join(' '));

        return queryWords.every(
          (w) =>
            targetName.includes(w) ||
            originalName.includes(w) ||
            muscleName.includes(w) ||
            equipName.includes(w) ||
            tagsName.includes(w),
        );
      })
      .filter((ex) => filterMuscle === 'ALL' || ex.muscle === filterMuscle)
      .filter((ex) => filterEquip === 'ALL' || ex.equipment === filterEquip)
      .sort((a, b) => {
        const aTime = lastUsedMap.get(a.id) || 0;
        const bTime = lastUsedMap.get(b.id) || 0;
        if (aTime !== bTime) {
          return bTime - aTime;
        }
        return 0;
      });
  }, [sourceList, hiddenEquipments, query, aliases, filterMuscle, filterEquip, lastUsedMap]);

  return {
    query,
    setQuery,
    filter,
    setFilter,
    filterMuscle,
    setFilterMuscle,
    filterEquip,
    setFilterEquip,
    filteredExercises,
    lastUsedMap,
    usageCountMap,
    totalResults: filteredExercises.length,
  };
}
