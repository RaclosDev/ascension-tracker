import type { PrescribedLoad, Program, ProgramExercise, SetTarget } from './coachPrograms';

export interface DoseAdjustment {
  day: number | null;
  exerciseId: string | null;
  kg: number;
  percent: number;
  reps: number;
  rpe: number;
  rir: number;
}
const bounded = (value: number | null, delta: number, min: number, max: number) =>
  value == null ? null : Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100));
export function adjustProgram(program: Program, delta: DoseAdjustment): Program {
  const load = (value: PrescribedLoad | null | undefined) =>
    value && (value.mode === 'KG' ? delta.kg : delta.percent) !== 0
      ? {
          ...value,
          amount: bounded(
            value.amount,
            value.mode === 'KG' ? delta.kg : delta.percent,
            0,
            value.mode === 'KG' ? 2000 : 200,
          )!,
          resolvedKg: null,
          referenceKg: null,
          referenceDate: null,
        }
      : value;
  const target = (value: SetTarget): SetTarget => ({
    ...value,
    reps: bounded(value.reps, delta.reps, 1, 100),
    rpe: bounded(value.rpe, delta.rpe, 1, 10),
    rir: bounded(value.rir, delta.rir, 0, 10),
    load: load(value.load) ?? null,
  });
  const exercise = (value: ProgramExercise): ProgramExercise => ({
    ...value,
    repsMin: bounded(value.repsMin, delta.reps, 1, 100),
    repsMax: bounded(value.repsMax, delta.reps, 1, 100),
    targetRpe: bounded(value.targetRpe, delta.rpe, 1, 10),
    targetRir: bounded(value.targetRir, delta.rir, 0, 10),
    prescription: value.prescription
      ? {
          ...value.prescription,
          load: load(value.prescription.load),
          sets: value.prescription.sets?.map(target),
        }
      : value.prescription,
  });
  return {
    ...program,
    days: program.days.map((day) =>
      delta.day != null && day.dayIndex !== delta.day
        ? day
        : {
            ...day,
            exercises: day.exercises.map((value) =>
              delta.exerciseId && value.exerciseId !== delta.exerciseId ? value : exercise(value),
            ),
          },
    ),
  };
}
