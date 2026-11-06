import { describe, expect, it } from 'vitest';
import type { CompletedWorkout, Exercise, WorkoutExercise, WorkoutSet } from '@/lib/workout/types';
import { exerciseHistoryStats } from './exerciseHistoryStats';
import { formatWorkoutDuration, summarizeWorkoutExercises } from './workoutSummary';

const set = (weight: string, reps: string, completed = true): WorkoutSet => ({
  id: `${weight}x${reps}`,
  type: 'normal',
  weight,
  reps,
  completed,
});

const exercise = (
  exerciseId: string,
  sets: WorkoutSet[],
  variant?: WorkoutExercise['variant'],
): WorkoutExercise => ({ id: `we-${exerciseId}`, exerciseId, notes: '', sets, variant });

const workout = (
  id: string,
  finishedAt: number,
  exercises: WorkoutExercise[],
): CompletedWorkout => ({
  id,
  name: id === 'w0' ? '' : `Entreno ${id}`,
  startedAt: finishedAt - 3_600_000,
  finishedAt,
  exercises,
});

const bench: Exercise = {
  id: 'bench',
  name: 'Press banca',
  muscle: 'pecho',
  equipment: 'barra',
};

describe('exerciseHistoryStats', () => {
  const history = [
    workout('w1', 1_000, [
      exercise('bench', [set('60', '10'), set('70', '5'), set('100', '1', false)], {
        grip: 'Cerrado',
      }),
    ]),
    workout('w2', 2_000, [
      exercise('bench', [set('50', '12'), set('40', '20')]),
      exercise('row', [set('90', '8')]),
    ]),
    workout('w0', 3_000, [exercise('bench', [set('abc', '5')])]),
  ];

  it('returns null without an exercise', () => {
    expect(exerciseHistoryStats(null, history, 'ALL', 'ALL')).toBeNull();
  });

  it('keeps the heaviest completed weight overall and per rep range, newest session first', () => {
    const stats = exerciseHistoryStats(bench, history, 'ALL', 'ALL')!;

    expect(stats.maxWeight).toBe(70);
    expect(stats.maxWeightPerRange).toEqual({ '1-5': 70, '6-10': 60, '11-15': 50, '16+': 40 });
    expect(stats.sessions.map((s) => s.date)).toEqual([3_000, 2_000, 1_000]);
    expect(stats.sessions[0].name).toBe('Entrenamiento');
    expect(stats.sessions[2].variant).toBe('(Cerrado)');
    expect(stats.sessions[2].sets).toHaveLength(2);
  });

  it('only counts sessions that match the grip filter', () => {
    const stats = exerciseHistoryStats(bench, history, 'Cerrado', 'ALL')!;

    expect(stats.sessions).toHaveLength(1);
    expect(stats.maxWeightPerRange['11-15']).toBe(0);
  });
});

describe('summarizeWorkoutExercises', () => {
  const catalog = new Map([['bench', bench]]) as unknown as Parameters<
    typeof summarizeWorkoutExercises
  >[1];

  it('sums volume and picks the best set from completed sets only', () => {
    const [summary] = summarizeWorkoutExercises(
      [exercise('bench', [set('80', '5'), set('80,5', '3'), set('120', '1', false)])],
      catalog,
      [workout('old', 1, [exercise('bench', [set('75', '5')])])],
    );

    expect(summary.name).toBe('Press banca');
    expect(summary.completedSetsCount).toBe(2);
    expect(summary.volume).toBeCloseTo(80 * 5 + 80.5 * 3);
    expect(summary.bestSet?.weight).toBe('80,5');
    expect(summary.hasPr).toBe(true);
  });

  it('drops exercises with nothing completed and names unknown ones generically', () => {
    const result = summarizeWorkoutExercises(
      [exercise('bench', [set('80', '5', false)]), exercise('mystery', [set('10', '10')])],
      catalog,
      [],
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ejercicio');
    expect(result[0].hasPr).toBe(false);
  });
});

describe('formatWorkoutDuration', () => {
  it.each([
    [0, '0 min'],
    [45, '45 min'],
    [60, '1h'],
    [95, '1h 35m'],
  ])('%i minutes -> %s', (minutes, label) => {
    expect(formatWorkoutDuration(minutes)).toBe(label);
  });
});
