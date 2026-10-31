import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { get, set, del } from 'idb-keyval';
import { useWorkoutHydrated, useWorkoutStore } from '../lib/workout/store';
import { useWorkoutPersistenceError } from '../lib/workout/storage';
import { workoutStorage } from '../lib/workout/storage';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
}));
let hydrationTest = 0;
beforeEach(() => {
  useWorkoutStore.persist.setOptions({ name: `hydration-test-${++hydrationTest}` });
});

it('rejects syntactically valid but malformed persisted workouts', async () => {
  vi.mocked(get).mockResolvedValueOnce(JSON.stringify({ version: 1, state: { active: {} } }));
  expect(await workoutStorage.getItem('ascension-workout-v1')).toBeNull();
});

it('does not allow persisted data to replace store actions', async () => {
  vi.mocked(get).mockResolvedValueOnce(
    JSON.stringify({ version: 1, state: { active: null, startEmpty: false } }),
  );
  const value = await workoutStorage.getItem('ascension-workout-v1');
  expect(JSON.parse(value ?? '{}').state).not.toHaveProperty('startEmpty');
});

it('accepts nullable optional fields from saved backend workouts', async () => {
  const active = {
    name: 'Backend workout',
    startedAt: 1,
    notes: null,
    exercises: [
      {
        id: 'e',
        exerciseId: 'bench',
        notes: null,
        variant: { grip: 'neutro', machine: null },
        sets: [{ id: 's', type: 'normal', weight: '80', reps: '5', completed: true, rpe: null }],
      },
    ],
  };
  vi.mocked(get).mockResolvedValueOnce(JSON.stringify({ version: 1, state: { active } }));
  const value = await workoutStorage.getItem('ascension-workout-v1');
  expect(JSON.parse(value ?? '{}').state.active).toEqual(active);
});

it('hydrates the legacy session when copying it to the new key fails', async () => {
  const legacy = JSON.stringify({
    version: 1,
    state: { active: { name: 'Legacy session', startedAt: 1, exercises: [] } },
  });
  vi.mocked(get).mockResolvedValueOnce(null).mockResolvedValueOnce(legacy);
  vi.mocked(set).mockRejectedValueOnce(new Error('quota'));
  vi.mocked(del).mockClear();
  expect(JSON.parse((await workoutStorage.getItem('ascension-workout-v1')) ?? '{}')).toEqual(
    JSON.parse(legacy),
  );
  expect(del).not.toHaveBeenCalled();
});

it('waits for persisted session before marking workout hydration ready', async () => {
  await useWorkoutStore.persist.rehydrate();
  let resolve: ((value: string) => void) | undefined;
  vi.mocked(get).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result } = renderHook(() => useWorkoutHydrated());
  let hydration: void | Promise<void>;
  act(() => {
    hydration = useWorkoutStore.persist.rehydrate();
  });
  expect(result.current).toBe(false);
  await act(async () => {
    resolve?.(
      JSON.stringify({
        version: 1,
        state: { active: { name: 'Saved session', startedAt: 1, exercises: [] } },
      }),
    );
    await hydration;
  });
  expect(result.current).toBe(true);
  expect(useWorkoutStore.getState().active?.name).toBe('Saved session');
});

it('finishes hydration and reports unavailable persistence instead of blocking or throwing', async () => {
  vi.mocked(get).mockRejectedValueOnce(new Error('IndexedDB unavailable'));
  const { result } = renderHook(() => useWorkoutPersistenceError());
  await act(async () => {
    await useWorkoutStore.persist.rehydrate();
  });
  expect(useWorkoutStore.persist.hasHydrated()).toBe(true);
  expect(result.current).toContain('No se puede guardar');
  vi.mocked(set).mockRejectedValueOnce(new Error('quota exceeded'));
  act(() => {
    useWorkoutStore.getState().startEmpty('Unsaved');
  });
  await waitFor(() => expect(result.current).toContain('No se puede guardar'));
  expect(useWorkoutStore.getState().active?.name).toBe('Unsaved');
});
