import { describe, expect, it } from 'vitest';
import { powerProgress } from '../lib/coach/powerProgress';
import type { CompletedWorkout, WorkoutSet } from '../lib/workout/types';

const series = (weight: string, reps: string, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `${weight}-${reps}`,
  type: 'normal',
  weight,
  reps,
  completed: true,
  ...extra,
});
const session = (
  id: string,
  day: number,
  sets: WorkoutSet[],
  exerciseId = 'ex-0043',
): CompletedWorkout => ({
  id,
  name: 'Sesión',
  startedAt: day,
  finishedAt: day + 1000,
  exercises: [{ id, exerciseId, notes: '', sets }],
});
const monday = new Date(2026, 10, 2, 12).getTime();
const day = 86400000;

describe('powerlifting progress from completed sessions', () => {
  it('keeps real singles, estimates, volume, RPE samples and weeks separate', () => {
    const result = powerProgress(
      [
        session('a', monday, [
          series('100', '5', { rpe: '7.5' }),
          series('110', '1'),
          series('200', '1', { type: 'warmup' }),
        ]),
        session('b', monday + 7 * day, [
          series('105', '3', { rpe: '8' }),
          series('500', '1', { completed: false }),
        ]),
        session('custom', monday, [series('500', '1')], 'my-squat'),
      ],
      monday,
      monday + 10 * day,
    )[0];
    expect(result).toMatchObject({
      sets: 3,
      reps: 9,
      volume: 925,
      maxLoad: 110,
      rpe: 7.75,
      rpeCount: 2,
    });
    expect(result.single).toMatchObject({ weight: 110, date: monday });
    expect(result.estimate).toEqual({ kg: 116.5, date: monday });
    expect(result.weeks.map((w) => [w.sets, w.volume])).toEqual([
      [2, 610],
      [1, 315],
    ]);
  });
  it('filters outside the period and excludes malformed numbers without inventing missing RPE', () => {
    const result = powerProgress(
      [
        session('past', monday - 1, [series('900', '1')]),
        session('future', monday + day, [series('900', '1')]),
        session('valid', monday, [
          series('100', '12'),
          series('100kg', '1'),
          series('200', '1.2'),
          series('200', '1x'),
          series('200', '0'),
        ]),
      ],
      monday,
      monday,
    )[0];
    expect(result).toMatchObject({ sets: 1, reps: 12, volume: 1200, rpe: null, rpeCount: 0 });
    expect(result.single).toBeUndefined();
    expect(result.estimate).toBeUndefined();
  });
  it('returns empty series for unrecorded lifts and treats invalid RPE as absent', () => {
    const result = powerProgress(
      [session('a', monday, [series('100', '1', { rpe: '11' })])],
      monday,
      monday,
    );
    expect(result[0].rpe).toBeNull();
    expect(result[1]).toMatchObject({ sets: 0, volume: 0, rpe: null, weeks: [] });
    expect(result[2]).toMatchObject({ sets: 0, volume: 0, weeks: [] });
  });
});
