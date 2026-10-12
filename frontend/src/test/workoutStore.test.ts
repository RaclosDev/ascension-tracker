import { expect, test, describe, beforeEach, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

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
});
