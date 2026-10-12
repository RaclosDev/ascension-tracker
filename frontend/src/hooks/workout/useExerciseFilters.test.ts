import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExerciseFilters } from './useExerciseFilters';
import type { Exercise } from '@/lib/workout/types';
import { BASE_EXERCISES, EXERCISE_CATALOG } from '@/lib/workout/exercises';

describe('useExerciseFilters hook', () => {
  const customExercises: Exercise[] = [
    {
      id: 'custom-1',
      name: 'Press Declinado Casero',
      muscle: 'pecho',
      equipment: 'barra',
      custom: true,
    },
    {
      id: 'custom-2',
      name: 'Remo Gironda Unilateral',
      muscle: 'espalda_alta',
      equipment: 'polea',
      custom: true,
    },
  ];

  const recentWorkouts = [
    {
      startedAt: 1000,
      exercises: [{ exerciseId: 'custom-1' }, { exerciseId: 'custom-2' }],
    },
    {
      startedAt: 2000,
      exercises: [{ exerciseId: 'custom-2' }],
    },
  ];

  it('initializes with default values and filters by basicos', () => {
    const { result } = renderHook(() =>
      useExerciseFilters({
        customExercises,
        recentWorkouts,
      }),
    );

    expect(result.current.query).toBe('');
    expect(result.current.filter).toBe('basicos');
    expect(result.current.filterMuscle).toBe('ALL');
    expect(result.current.filterEquip).toBe('ALL');
    expect(result.current.filteredExercises).toEqual(BASE_EXERCISES);
  });

  it('switches tabs between basicos, todos, and custom', () => {
    const { result } = renderHook(() =>
      useExerciseFilters({
        customExercises,
        recentWorkouts,
      }),
    );

    act(() => {
      result.current.setFilter('custom');
    });

    expect(result.current.filter).toBe('custom');
    // custom-2 had startedAt 2000, custom-1 had startedAt 1000 -> custom-2 sorted first
    expect(result.current.filteredExercises[0].id).toBe('custom-2');
    expect(result.current.filteredExercises[1].id).toBe('custom-1');

    act(() => {
      result.current.setFilter('todos');
    });
    expect(result.current.filter).toBe('todos');
    expect(result.current.filteredExercises.length).toBe(EXERCISE_CATALOG.length);
  });

  it('filters by multi-word normalized search query and aliases', () => {
    const aliases = {
      'custom-1': 'Banca Especial',
    };

    const { result } = renderHook(() =>
      useExerciseFilters({
        customExercises,
        aliases,
        recentWorkouts,
      }),
    );

    act(() => {
      result.current.setFilter('custom');
      result.current.setQuery('banca especial');
    });

    expect(result.current.filteredExercises.length).toBe(1);
    expect(result.current.filteredExercises[0].id).toBe('custom-1');

    // Accent insensitive search
    act(() => {
      result.current.setQuery('girónda');
    });
    expect(result.current.filteredExercises.length).toBe(1);
    expect(result.current.filteredExercises[0].id).toBe('custom-2');
  });

  it('filters by muscle group and equipment', () => {
    const { result } = renderHook(() =>
      useExerciseFilters({
        customExercises,
        recentWorkouts,
      }),
    );

    act(() => {
      result.current.setFilter('custom');
      result.current.setFilterMuscle('pecho');
    });

    expect(result.current.filteredExercises.length).toBe(1);
    expect(result.current.filteredExercises[0].id).toBe('custom-1');

    act(() => {
      result.current.setFilterMuscle('ALL');
      result.current.setFilterEquip('polea');
    });

    expect(result.current.filteredExercises.length).toBe(1);
    expect(result.current.filteredExercises[0].id).toBe('custom-2');
  });

  it('excludes hidden equipments', () => {
    const { result } = renderHook(() =>
      useExerciseFilters({
        customExercises,
        hiddenEquipments: ['barra'],
        recentWorkouts,
      }),
    );

    act(() => {
      result.current.setFilter('custom');
    });

    // custom-1 uses barra, so only custom-2 should remain
    expect(result.current.filteredExercises.length).toBe(1);
    expect(result.current.filteredExercises[0].id).toBe('custom-2');
  });

  it('computes lastUsedMap and usageCountMap accurately', () => {
    const { result } = renderHook(() =>
      useExerciseFilters({
        customExercises,
        recentWorkouts,
      }),
    );

    expect(result.current.lastUsedMap.get('custom-1')).toBe(1000);
    expect(result.current.lastUsedMap.get('custom-2')).toBe(2000);
    expect(result.current.usageCountMap.get('custom-1')).toBe(1);
    expect(result.current.usageCountMap.get('custom-2')).toBe(2);
  });
});
