import { afterEach, expect, it, vi } from 'vitest';
import api from '../api/client';
import { mergeExerciseReferences } from './mergeExerciseReferences';
import { useWorkoutStore } from '../lib/workout/store';
import { setWorkoutAccountIdentity } from '../lib/workout/accountIdentity';
vi.mock('../api/client', () => ({ default: { post: vi.fn(), delete: vi.fn() } }));
afterEach(() => {
  vi.resetAllMocks();
  useWorkoutStore.setState({ active: null });
  setWorkoutAccountIdentity(null);
});
it('delegates all history and template changes to one atomic server operation', async () => {
  vi.mocked(api.post).mockResolvedValueOnce({ data: { sourceDeleted: true } });
  await mergeExerciseReferences('source/id', 'target');
  expect(api.post).toHaveBeenCalledExactlyOnceWith('/workouts/exercises/source%2Fid/merge', {
    targetExerciseId: 'target',
  });
  expect(api.delete).not.toHaveBeenCalled();
});
it('propagates failure without deleting the source from the client', async () => {
  useWorkoutStore.setState({
    active: {
      name: 'Offline session',
      startedAt: 1,
      exercises: [{ id: 'row', exerciseId: 'source', notes: '', sets: [] }],
    },
  });
  vi.mocked(api.post).mockRejectedValueOnce(new Error('offline'));
  await expect(mergeExerciseReferences('source', 'target')).rejects.toThrow('offline');
  expect(api.delete).not.toHaveBeenCalled();
  expect(useWorkoutStore.getState().active?.exercises[0].exerciseId).toBe('source');
});

it('updates active offline references only after the server confirms the merge', async () => {
  let release: (() => void) | undefined;
  vi.mocked(api.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ data: { sourceDeleted: true } });
      }),
  );
  useWorkoutStore.setState({
    active: {
      name: 'Offline session',
      startedAt: 1,
      exercises: [{ id: 'row', exerciseId: 'source', notes: '', sets: [] }],
    },
  });
  const request = mergeExerciseReferences('source', 'target');
  expect(useWorkoutStore.getState().active?.exercises[0].exerciseId).toBe('source');
  release?.();
  await request;
  expect(useWorkoutStore.getState().active?.exercises[0].exerciseId).toBe('target');
});

it('does not change the active session of a different account after a late merge response', async () => {
  let release: (() => void) | undefined;
  vi.mocked(api.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ data: { sourceDeleted: true } });
      }),
  );
  setWorkoutAccountIdentity('a@example.com');
  const request = mergeExerciseReferences('source', 'target');
  setWorkoutAccountIdentity('b@example.com');
  useWorkoutStore.setState({
    active: {
      name: 'B session',
      startedAt: 1,
      exercises: [{ id: 'row', exerciseId: 'source', notes: '', sets: [] }],
    },
  });
  release?.();
  await request;
  expect(useWorkoutStore.getState().active?.exercises[0].exerciseId).toBe('source');
});
