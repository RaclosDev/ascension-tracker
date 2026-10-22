import { expect, test, describe, beforeEach, vi } from 'vitest';

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

import { cancelServerRestTimer, dismissRestNotifications } from '../lib/workout/notifications';
import { useWorkoutStore } from '../lib/workout/store';

describe('WorkoutStore - finishWorkout persistence & resilience', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      active: null,
      tab: 'home',
      restUntil: null,
      detailId: null,
    });
  });

  test('finishWorkout returns completed record without deleting active state prematurely', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Pierna Pesada',
        startedAt: 1000,
        notes: 'Buen entrenamiento',
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'squat',
            notes: '',
            sets: [
              { id: 's-1', type: 'normal', weight: '100', reps: '5', completed: true },
              { id: 's-2', type: 'normal', weight: '100', reps: '5', completed: false },
            ],
          },
        ],
      },
      tab: 'train',
    });

    const record = useWorkoutStore.getState().finishWorkout('Pierna Finalizada', 3600000);

    expect(record).not.toBeNull();
    expect(record?.name).toBe('Pierna Finalizada');
    expect(record?.exercises[0].sets).toHaveLength(2);

    // CRITICAL: active state must NOT be wiped immediately (survives network drops)
    const stateAfterFinish = useWorkoutStore.getState();
    expect(stateAfterFinish.active).not.toBeNull();
    expect(stateAfterFinish.active?.name).toBe('Pierna Pesada');

    // Only clearActiveWorkout removes it upon server confirmation
    stateAfterFinish.clearActiveWorkout();
    expect(useWorkoutStore.getState().active).toBeNull();
    expect(useWorkoutStore.getState().tab).toBe('home');
  });

  test('finishWorkout returns null if no sets were completed', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Sin Completar',
        startedAt: 1000,
        notes: '',
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'bench',
            notes: '',
            sets: [{ id: 's-1', type: 'normal', weight: '80', reps: '8', completed: false }],
          },
        ],
      },
    });

    const record = useWorkoutStore.getState().finishWorkout();
    expect(record).toBeNull();
    expect(useWorkoutStore.getState().active).not.toBeNull();
  });

  test('finishWorkout cancels rest timer, dismisses notifications and clears restUntil', () => {
    vi.clearAllMocks();
    useWorkoutStore.setState({
      active: {
        name: 'Brazo',
        startedAt: 1000,
        notes: '',
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'curl',
            notes: '',
            sets: [{ id: 's-1', type: 'normal', weight: '20', reps: '10', completed: true }],
          },
        ],
      },
      restUntil: Date.now() + 60000,
    });

    const record = useWorkoutStore.getState().finishWorkout();
    expect(record).not.toBeNull();
    expect(useWorkoutStore.getState().restUntil).toBeNull();
    expect(cancelServerRestTimer).toHaveBeenCalled();
    expect(dismissRestNotifications).toHaveBeenCalled();
  });

  test('clearActiveWorkout and discardWorkout cancel timer and dismiss notifications', () => {
    vi.clearAllMocks();
    useWorkoutStore.setState({
      active: {
        name: 'Pecho',
        startedAt: 1000,
        notes: '',
        exercises: [],
      },
      restUntil: Date.now() + 60000,
    });

    useWorkoutStore.getState().discardWorkout();
    expect(useWorkoutStore.getState().restUntil).toBeNull();
    expect(useWorkoutStore.getState().active).toBeNull();
    expect(cancelServerRestTimer).toHaveBeenCalled();
    expect(dismissRestNotifications).toHaveBeenCalled();
  });

  test('setWorkoutDate correctly updates startedAt and editingFinishedAt', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Pierna Pasada',
        startedAt: 1000000,
        editingId: 'workout-123',
        editingFinishedAt: 1003600,
        notes: '',
        exercises: [],
      },
    });

    const yesterday = Date.now() - 86400000;
    useWorkoutStore.getState().setWorkoutDate(yesterday, yesterday + 3600000);

    const active = useWorkoutStore.getState().active;
    expect(active?.startedAt).toBe(yesterday);
    expect(active?.editingFinishedAt).toBe(yesterday + 3600000);
  });

  test('finishWorkout honors customStartedAt allowing logging workouts in the past', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Entreno de Ayer',
        startedAt: Date.now(),
        notes: 'Ayer por la tarde',
        exercises: [
          {
            id: 'ex-1',
            exerciseId: 'deadlift',
            notes: '',
            sets: [{ id: 's-1', type: 'normal', weight: '140', reps: '5', completed: true }],
          },
        ],
      },
    });

    const yesterday = Date.now() - 86400000;
    const durationMs = 45 * 60000;
    const record = useWorkoutStore
      .getState()
      .finishWorkout('Entreno de Ayer', durationMs, yesterday);

    expect(record).not.toBeNull();
    expect(record?.startedAt).toBe(yesterday);
    expect(record?.finishedAt).toBe(yesterday + durationMs);
  });

  test('cancelEditWorkout closes active session and navigates to history tab', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Entreno en edición',
        startedAt: 1000,
        editingId: 'w-existing',
        notes: '',
        exercises: [],
      },
      tab: 'train',
      detailId: 'w-existing',
    });

    useWorkoutStore.getState().cancelEditWorkout();
    expect(useWorkoutStore.getState().active).toBeNull();
    expect(useWorkoutStore.getState().tab).toBe('history');
  });
});
