import { describe, expect, it } from 'vitest';
import { isPrSet } from '../lib/workout/format';
import type { CompletedWorkout } from '../lib/workout/types';
import { buildWorkoutRecords, beatsWorkoutRecord, workoutVariantKey } from './workoutRecords';

describe('workout record index', () => {
  it('preserves reference results for variants, invalid weights, incomplete sets and exclusions', () => {
    const history: CompletedWorkout[] = Array.from({ length: 4 }, (_, i) => ({
      id: String(i),
      name: 'Session',
      startedAt: i,
      finishedAt: i + 1,
      exercises: [
        {
          id: String(i),
          exerciseId: 'bench',
          notes: '',
          variant: i % 2 ? { grip: ' NEUTRO ', machine: 'SMITH' } : undefined,
          sets: ['40', '0', 'invalid', 'Infinity', '70'].map((weight, j) => ({
            id: String(j),
            type: 'normal',
            completed: j !== 4,
            weight,
            reps: '8',
          })),
        },
      ],
    }));
    for (const excluded of [undefined, '0', '1']) {
      const records = buildWorkoutRecords(history, excluded);
      for (const variant of [undefined, { grip: 'neutro', machine: 'smith' }, { grip: 'prono' }]) {
        for (const weight of ['0', '-1', '40', '41', '70', 'Infinity', 'invalid']) {
          const best = records.get(workoutVariantKey('bench', variant)) ?? 0;
          expect(beatsWorkoutRecord(weight, best)).toBe(
            isPrSet('bench', variant, weight, history, excluded),
          );
        }
      }
    }
  });

  it('reads history weights once instead of once per displayed set', () => {
    let reads = 0;
    const history: CompletedWorkout[] = Array.from({ length: 180 }, (_, i) => ({
      id: String(i),
      name: 'Session',
      startedAt: i,
      finishedAt: i + 1,
      exercises: Array.from({ length: 12 }, (_, e) => ({
        id: String(e),
        exerciseId: String(e),
        notes: '',
        sets: Array.from({ length: 8 }, (_, j) => ({
          id: String(j),
          type: 'normal',
          completed: true,
          reps: '8',
          get weight() {
            reads++;
            return '50';
          },
        })),
      })),
    }));
    for (let e = 0; e < 12; e++)
      for (let s = 0; s < 8; s++) isPrSet(String(e), undefined, '60', history);
    const before = reads;
    reads = 0;
    const records = buildWorkoutRecords(history);
    for (let e = 0; e < 12; e++)
      for (let s = 0; s < 8; s++) {
        expect(beatsWorkoutRecord('60', records.get(workoutVariantKey(String(e))) ?? 0)).toBe(true);
      }
    expect(before).toBe(138240);
    expect(reads).toBe(17280);
  });
});
