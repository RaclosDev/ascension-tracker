import { describe, expect, it } from 'vitest';
import type { Program } from '@/lib/coach/coachPrograms';
import { withDone } from '@/lib/coach/doneWeek';
import { rowsOf } from '@/lib/coach/prescription';
import type { CompletedWorkout } from '@/lib/workout/types';

const week: Program = {
  id: null,
  name: 'Semana',
  notes: null,
  weeks: 1,
  days: [
    {
      week: 1,
      dayIndex: 1,
      name: 'Torso',
      notes: null,
      exercises: ['press', 'remo'].map((exerciseId) => ({
        exerciseId,
        exerciseName: exerciseId,
        sets: 3,
        repsMin: 8,
        repsMax: 10,
        targetRpe: null,
        targetRir: 2,
        restSeconds: 120,
        loadHint: null,
        supersetGroup: null,
        notes: null,
        prescription: { load: { mode: 'KG', amount: 50, unit: 'TOTAL' } } as never,
      })),
    },
  ],
};

const set = (weight: string, reps: string, completed = true, type = 'normal') =>
  ({ id: `${weight}-${reps}-${type}`, type, weight, reps, completed }) as never;

const workout = {
  id: 'w1',
  name: 'Torso',
  startedAt: 0,
  finishedAt: 1,
  exercises: [
    {
      id: 'e1',
      exerciseId: 'press',
      sets: [
        set('20', '10', true, 'warmup'),
        set('52,5', '9'),
        set('52.5', '8'),
        set('50', '', false),
      ],
    },
  ],
} as unknown as CompletedWorkout;

describe('withDone', () => {
  it('rewrites the logged exercises with what the athlete completed', () => {
    const { program, changed } = withDone(week, [{ dayIndex: 1, workout }]);
    expect(changed).toBe(1);
    const rows = rowsOf(program.days[0].exercises[0]);
    expect(rows.map((row) => [row.load?.amount, row.reps, row.rir])).toEqual([
      [52.5, 9, 2],
      [52.5, 8, 2],
    ]);
    // What was not logged keeps its target.
    expect(program.days[0].exercises[1]).toBe(week.days[0].exercises[1]);
  });

  it('leaves the week alone when nothing was logged for its days', () => {
    expect(withDone(week, [{ dayIndex: 3, workout }])).toEqual({ program: week, changed: 0 });
  });
});
