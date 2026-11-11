import { describe, expect, it } from 'vitest';
import { bestLifts, dotsScore, estimateOneRepMax } from '../lib/powerlifting';
import { hasBodyTracking, hasNutrition, isPathEnabled, normalizeModules } from '../lib/appModules';
import { weightGoal } from '../components/calculators/WeightLossPlan';
import type { CompletedWorkout, WorkoutSet } from '../lib/workout/types';

const set = (weight: string, reps: string, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `${weight}x${reps}`,
  type: 'normal',
  weight,
  reps,
  completed: true,
  ...extra,
});

const workout = (startedAt: number, exerciseId: string, sets: WorkoutSet[]): CompletedWorkout => ({
  id: String(startedAt),
  name: 'Día',
  startedAt,
  finishedAt: startedAt + 1,
  exercises: [{ id: `${startedAt}-${exerciseId}`, exerciseId, notes: '', sets }],
});

describe('estimateOneRepMax', () => {
  it('uses Epley and the weight itself for singles', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 1);
  });

  it('ignores invalid sets and high-rep sets', () => {
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(60, 12)).toBeNull();
  });
});

describe('bestLifts', () => {
  it('ignores missing numeric fields returned for empty persisted sets', () => {
    const history = [workout(1, 'ex-0025', [set('100', '5'), set('100', '5'), set('80', '1')])];
    Object.assign(history[0].exercises[0].sets[0], { weight: null });
    Object.assign(history[0].exercises[0].sets[1], { reps: null });
    expect(bestLifts(history).bench).toEqual({ e1rm: 80, actual: 80, date: 1 });
  });

  it('rejects partial numbers and fractional reps instead of inflating estimates', () => {
    const best = bestLifts([
      workout(1, 'ex-0025', [
        set('999kg', '1'),
        set('999', '1rep'),
        set('999', '1.5'),
        set('Infinity', '1'),
        set('102,5', '1'),
      ]),
    ]);
    expect(best.bench).toEqual({ e1rm: 102.5, actual: 102.5, date: 1 });
  });
  it('keeps the best estimate per lift, skipping warm-ups and unfinished sets', () => {
    const best = bestLifts([
      workout(1, 'base-cuadriceps-sentadilla-libre-barra', [
        set('140', '3'),
        set('200', '1', { type: 'warmup' }),
        set('190', '1', { completed: false }),
      ]),
      workout(2, 'ex-1435', [set('150', '1')]),
      workout(3, 'ex-0025', [set('100', '5')]),
      workout(4, 'otro-ejercicio', [set('300', '1')]),
    ]);

    expect(best.squat).toEqual({ e1rm: 154, actual: 150, date: 1 });
    expect(best.bench?.e1rm).toBe(116.5);
    expect(best.bench?.actual).toBeNull();
    expect(best.deadlift).toBeUndefined();
  });
});

describe('dotsScore', () => {
  it('scores a total against bodyweight and sex', () => {
    expect(dotsScore(700, 100, 'M')).toBeCloseTo(430.9, 1);
    expect(dotsScore(400, 60, 'F')).toBeGreaterThan(dotsScore(400, 70, 'F')!);
  });

  it('needs a total, bodyweight and sex', () => {
    expect(dotsScore(-1, 80, 'M')).toBeNull();
    expect(dotsScore(500, -80, 'M')).toBeNull();
    expect(dotsScore(Infinity, 80, 'M')).toBeNull();
    expect(dotsScore(500, Infinity, 'M')).toBeNull();
    expect(dotsScore(0, 80, 'M')).toBeNull();
    expect(dotsScore(500, undefined, 'M')).toBeNull();
    expect(dotsScore(500, 80, undefined)).toBeNull();
  });
});

describe('app modules', () => {
  it('treats a missing or unknown value as everything', () => {
    expect(normalizeModules(null)).toBe('FULL');
    expect(normalizeModules('RARO')).toBe('FULL');
    expect(hasNutrition(undefined)).toBe(true);
    expect(hasBodyTracking(undefined)).toBe(true);
  });

  it('hides the sections of switched-off modules', () => {
    expect(isPathEnabled('/nutrition', 'TRAINING')).toBe(false);
    expect(isPathEnabled('/tracking', 'TRAINING')).toBe(false);
    expect(isPathEnabled('/workout', 'TRAINING')).toBe(true);
    expect(isPathEnabled('/nutrition', 'TRAINING_NUTRITION')).toBe(true);
    expect(isPathEnabled('/tracking', 'TRAINING_NUTRITION')).toBe(false);
    expect(isPathEnabled('/tracking', 'TRAINING_BODY')).toBe(true);
  });
});

describe('weightGoal', () => {
  it('derives the goal from current and target weight', () => {
    expect(weightGoal(80, 75)).toBe('lose');
    expect(weightGoal(80, 80.2)).toBe('maintain');
    expect(weightGoal(70, 75)).toBe('gain');
    expect(weightGoal(null, 75)).toBeNull();
  });
});
