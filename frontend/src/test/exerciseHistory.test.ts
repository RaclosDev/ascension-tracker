import { describe, expect, it } from 'vitest';
import { bestSet, companions, exerciseUse, setText } from '@/lib/coach/exerciseHistory';
import type { CompletedWorkout, WorkoutSet } from '@/lib/workout/types';

const set = (weight: string, reps: string, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `${weight}-${reps}`,
  type: 'normal',
  weight,
  reps,
  completed: true,
  ...extra,
});
const workout = (startedAt: number, exercises: Record<string, WorkoutSet[]>): CompletedWorkout =>
  ({
    id: String(startedAt),
    name: 'Sesión',
    startedAt,
    finishedAt: startedAt + 1,
    exercises: Object.entries(exercises).map(([exerciseId, sets]) => ({ exerciseId, sets })),
  }) as CompletedWorkout;

// Newest first, as the editor passes them.
const history = [
  workout(3, { bench: [set('80', '6'), set('82.5', '5')], row: [set('70', '8')] }),
  workout(2, { squat: [set('100', '5')], warm: [set('20', '10', { type: 'warmup' })] }),
  workout(1, { bench: [set('77.5', '6')], row: [set('', '8', { completed: false })] }),
];

describe('exercise history of an athlete', () => {
  it('ranks by sessions and keeps the newest one as the last time', () => {
    const uses = exerciseUse(history);
    expect(uses.map((use) => [use.exerciseId, use.times])).toEqual([
      ['bench', 2],
      ['row', 1],
      ['squat', 1],
    ]);
    expect(uses[0].last.date).toBe(3);
    expect(bestSet(uses[0].last.sets)?.weight).toBe('82.5');
  });

  it('finds what is trained next to the exercises already written', () => {
    expect(companions(history, ['bench'])).toEqual(['row']);
    expect(companions(history, [])).toEqual([]);
  });

  it('writes a set with only what was logged', () => {
    expect(setText(set('80', '6'))).toBe('80 kg × 6');
    expect(setText(set('80', ''))).toBe('80 kg');
    expect(setText(set('', '12'))).toBe('12 reps');
  });
});
