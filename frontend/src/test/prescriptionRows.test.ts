import { describe, expect, it } from 'vitest';
import { newExercise, type ProgramExercise, type SetTarget } from '@/lib/coach/coachPrograms';
import {
  effortOf,
  parseReps,
  prescribedSet,
  protocolText,
  rowsOf,
  unitFor,
  withRows,
} from '@/lib/coach/prescription';

const row = (patch: Partial<SetTarget> = {}): SetTarget => ({
  kind: 'WORK',
  reps: 8,
  rpe: null,
  rir: null,
  load: null,
  notes: null,
  ...patch,
});
const legacy: ProgramExercise = {
  ...newExercise('bench-press', 'Press banca'),
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  targetRir: 2,
};

describe('pauta serie a serie', () => {
  it('expands a program saved with the old summary into one row per set', () => {
    const rows = rowsOf(legacy);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ kind: 'WORK', reps: 8, repsMax: 12, rir: 2, rpe: null });
    expect(protocolText(legacy)).toBe('3 × 8–12 · RIR 2');
  });

  it('keeps the summary columns in step with the rows', () => {
    const kg = (amount: number) => ({ mode: 'KG' as const, amount, unit: 'TOTAL' as const });
    const next = withRows(legacy, [
      row({ kind: 'WARMUP', reps: 10, load: kg(40) }),
      row({ reps: 5, rpe: 8, load: kg(100) }),
      row({ reps: 8, rpe: 7, load: kg(85) }),
      row({ reps: 8, rpe: 7, load: kg(85) }),
    ]);
    expect(next).toMatchObject({ sets: 4, repsMin: 5, repsMax: 8, targetRpe: 8, targetRir: null });
    expect(next.prescription?.sets).toHaveLength(4);
    expect(protocolText(next)).toBe(
      '1 × 10 de calentamiento con 40 kg + 1 × 5 con 100 kg (RPE 8) + 2 × 8 con 85 kg (RPE 7)',
    );
    expect(prescribedSet(next, 1)).toMatchObject({ weight: 100, min: 5, max: 5 });
  });

  it('reads a rep range typed in one cell', () => {
    expect(parseReps('12-15')).toEqual({ reps: 12, repsMax: 15 });
    expect(parseReps(' 8 ')).toEqual({ reps: 8, repsMax: null });
    expect(parseReps('')).toEqual({ reps: null, repsMax: null });
    expect(parseReps('12-')).toBeUndefined();
    expect(parseReps('15-12')).toBeUndefined();
    const ranged = withRows(legacy, [row({ reps: 12, repsMax: 15 })]);
    expect(prescribedSet(ranged, 0)).toMatchObject({ min: 12, max: 15, repsLabel: '12–15' });
  });

  it('deduces the load unit from the equipment and the effort column from the data', () => {
    expect(unitFor('mancuernas', 'EACH')).toBe('EACH');
    expect(unitFor('mancuernas', 'TOTAL')).toBe('TOTAL');
    expect(unitFor('barra', 'EACH')).toBe('TOTAL');
    expect(effortOf([row({ rpe: 8 })], 'RIR')).toBe('RPE');
    expect(effortOf([row()], 'NONE')).toBe('NONE');
    const dumbbells = withRows(legacy, [
      row({ load: { mode: 'KG', amount: 20, unit: 'EACH' } }),
      row({ load: { mode: 'KG', amount: 20, unit: 'EACH' } }),
    ]);
    expect(protocolText(dumbbells)).toBe('2 × 8 · 20 kg por mancuerna');
  });
});
