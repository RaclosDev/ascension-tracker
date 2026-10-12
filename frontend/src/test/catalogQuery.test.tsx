import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExerciseCatalog, EXERCISE_CATALOG_QUERY_KEY } from '../lib/workout/catalog-query';
import { fetchExerciseCatalog, getExerciseMap } from '../lib/workout/exercises';
import type { Exercise } from '../lib/workout/types';

describe('catalog-query and exercises catalog logic', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('EXERCISE_CATALOG_QUERY_KEY is constant and stable', () => {
    expect(EXERCISE_CATALOG_QUERY_KEY).toEqual(['exercise-catalog']);
  });

  it('getExerciseMap indexes base, catalog, and custom exercises by id', () => {
    const customExercise: Exercise = {
      id: 'custom-press',
      name: 'Prensa Inclinada Custom',
      muscle: 'cuadriceps',
      equipment: 'maquina',
    };

    const map = getExerciseMap([customExercise]);
    expect(map.get('custom-press')).toEqual(customExercise);
  });

  it('fetchExerciseCatalog fetches and parses exercises from public json endpoints', async () => {
    const mockExercises: Exercise[] = [
      { id: 'bench-press', name: 'Press Banca', muscle: 'pecho', equipment: 'barra' },
    ];
    const mockBaseExercises: Exercise[] = [
      { id: 'base-chest', name: 'Pecho Base', muscle: 'pecho', equipment: 'barra' },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/exercises.json') {
        return Promise.resolve({
          json: () => Promise.resolve(mockExercises),
        });
      }
      if (url === '/exercises-base.json') {
        return Promise.resolve({
          json: () => Promise.resolve(mockBaseExercises),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const result = await fetchExerciseCatalog();
    expect(result).toEqual(mockExercises);
  });

  it('useExerciseCatalog resolves query data with TanStack Query provider', async () => {
    const mockExercises: Exercise[] = [
      { id: 'pull-up', name: 'Dominadas', muscle: 'dorsales', equipment: 'peso corporal' },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/exercises.json') {
        return Promise.resolve({
          json: () => Promise.resolve(mockExercises),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve([]),
      });
    });

    const { result } = renderHook(() => useExerciseCatalog(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThanOrEqual(1);
  });
});
