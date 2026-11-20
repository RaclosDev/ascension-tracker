import api from '../../api/client';
import type { CompletedWorkout, WorkoutExercise } from '../workout/types';
import type { Program, ProgramExercise, SetTarget } from './coachPrograms';
import { rowsOf, withRows } from './prescription';
import type { ProgramSession } from './sessions';
import { shiftWeek } from './weeks';

const MAX_SETS = 20;

const numberOf = (text?: string) => {
  const value = Number((text ?? '').replace(',', '.'));
  return text?.trim() && Number.isFinite(value) && value >= 0 ? value : null;
};

/** The exercise's targets rewritten with the load and reps the athlete actually completed. */
function doneRows(exercise: ProgramExercise, logged: WorkoutExercise): SetTarget[] | null {
  const sets = logged.sets.filter((set) => set.completed && set.type !== 'warmup');
  if (!sets.length) return null;
  const rows = rowsOf(exercise);
  const work = rows.filter((row) => row.kind !== 'WARMUP');
  const unit = work.find((row) => row.load?.mode === 'KG')?.load?.unit ?? 'TOTAL';
  const done = sets.map((set, i): SetTarget => {
    const plan = work[Math.min(i, work.length - 1)];
    const kg = numberOf(set.weight);
    return {
      kind: plan?.kind ?? 'WORK',
      rpe: plan?.rpe ?? null,
      rir: plan?.rir ?? null,
      notes: plan?.notes ?? null,
      reps: numberOf(set.reps) ?? plan?.reps ?? null,
      repsMax: null,
      load: kg != null && kg > 0 ? { mode: 'KG', amount: kg, unit } : (plan?.load ?? null),
    };
  });
  return [...rows.filter((row) => row.kind === 'WARMUP'), ...done].slice(0, MAX_SETS);
}

export interface DoneDay {
  dayIndex: number;
  workout: CompletedWorkout;
}

/**
 * Last week's plan with every exercise the athlete logged replaced by what they did, so next
 * week starts from real numbers. Exercises without completed sets keep their original target.
 */
export function withDone(week: Program, done: DoneDay[]): { program: Program; changed: number } {
  let changed = 0;
  const days = week.days.map((day) => {
    const workout = done.find((item) => item.dayIndex === day.dayIndex)?.workout;
    if (!workout) return day;
    const pool = [...workout.exercises];
    return {
      ...day,
      exercises: day.exercises.map((exercise) => {
        const at = pool.findIndex((logged) => logged.exerciseId === exercise.exerciseId);
        if (at < 0) return exercise;
        const rows = doneRows(exercise, pool.splice(at, 1)[0]);
        if (!rows) return exercise;
        changed += 1;
        return withRows(exercise, rows);
      }),
    };
  });
  return { program: changed ? { ...week, days } : week, changed };
}

/** The workouts the athlete logged for the sessions of one week of an assigned program. */
export async function fetchDone(
  linkId: string,
  assignmentId: string,
  weekStart: string,
): Promise<DoneDay[]> {
  const base = `/coach/clients/${encodeURIComponent(linkId)}`;
  const sessions = (
    await api.get<ProgramSession[]>(`${base}/programs/${encodeURIComponent(assignmentId)}/sessions`)
  ).data;
  const end = shiftWeek(weekStart, 1);
  return Promise.all(
    sessions
      .filter((session) => session.workoutId && session.date >= weekStart && session.date < end)
      .map(async (session) => ({
        dayIndex: session.dayIndex,
        workout: (
          await api.get<CompletedWorkout>(
            `${base}/workouts/${encodeURIComponent(session.workoutId!)}`,
          )
        ).data,
      })),
  );
}
