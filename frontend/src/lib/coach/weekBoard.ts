import { addDays, format, parseISO } from 'date-fns';
import {
  addDay,
  findDay,
  MAX_EXERCISES_PER_DAY,
  moveItem,
  WEEKDAY_LABELS,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from './coachPrograms';
import { protocolText, rowsOf } from './prescription';
import { restLabel } from './today';
import { MUSCLE_LABEL, type MuscleGroup } from '@/lib/workout/types';

const byDay = (days: ProgramDay[]) => [...days].sort((a, b) => a.dayIndex - b.dayIndex);

/**
 * Copies or moves a whole session to another weekday. When the target already has a session it is
 * replaced or the exercises are appended. Returns null when the result would not fit in one day.
 */
export function sendDay(
  program: Program,
  from: number,
  to: number,
  move: boolean,
  clash: 'replace' | 'merge',
): Program | null {
  const source = findDay(program, 1, from);
  if (!source || from === to) return program;
  const target = findDay(program, 1, to);
  const sent: ProgramDay =
    target && clash === 'merge'
      ? { ...target, exercises: [...target.exercises, ...structuredClone(source.exercises)] }
      : { ...structuredClone(source), dayIndex: to };
  if (sent.exercises.length > MAX_EXERCISES_PER_DAY) return null;
  return {
    ...program,
    days: byDay([
      ...program.days.filter((day) => day.dayIndex !== to && !(move && day.dayIndex === from)),
      sent,
    ]),
  };
}

/**
 * Copies or moves one exercise to another weekday (or to another position of its own day).
 * A rest day becomes a session. Returns null when the target day is already full.
 */
export function sendExercise(
  program: Program,
  from: number,
  index: number,
  to: number,
  move: boolean,
  at?: number,
): Program | null {
  const exercise = findDay(program, 1, from)?.exercises[index];
  if (!exercise) return program;
  if (from === to) {
    if (!move && findDay(program, 1, from)!.exercises.length >= MAX_EXERCISES_PER_DAY) return null;
    return {
      ...program,
      days: program.days.map((day) =>
        day.dayIndex !== from
          ? day
          : {
              ...day,
              exercises: move
                ? moveItem(day.exercises, index, at ?? index)
                : [
                    ...day.exercises.slice(0, index + 1),
                    structuredClone(exercise),
                    ...day.exercises.slice(index + 1),
                  ],
            },
      ),
    };
  }
  const base = addDay(program, 1, to);
  const target = findDay(base, 1, to)!;
  if (target.exercises.length >= MAX_EXERCISES_PER_DAY) return null;
  const position = Math.min(at ?? target.exercises.length, target.exercises.length);
  return {
    ...base,
    days: base.days.map((day) => {
      if (day.dayIndex === to)
        return {
          ...day,
          exercises: [
            ...day.exercises.slice(0, position),
            structuredClone(exercise),
            ...day.exercises.slice(position),
          ],
        };
      if (move && day.dayIndex === from)
        return { ...day, exercises: day.exercises.filter((_, i) => i !== index) };
      return day;
    }),
  };
}

type Group = MuscleGroup | 'other';
interface Load {
  sets: number;
  tonnage: number;
}

/** Work sets (warm-ups excluded) and estimated tonnage of one exercise. */
function exerciseLoad(exercise: ProgramExercise): Load {
  let sets = 0;
  let tonnage = 0;
  for (const row of rowsOf(exercise)) {
    if (row.kind === 'WARMUP') continue;
    sets += 1;
    const kg = row.load?.mode === 'KG' ? row.load.amount : (row.load?.resolvedKg ?? null);
    if (kg != null && row.reps != null)
      tonnage += kg * row.reps * (row.load?.unit === 'EACH' ? 2 : 1);
  }
  return { sets, tonnage };
}

function loadByGroup(program: Program, muscleOf: (exerciseId: string) => MuscleGroup | undefined) {
  const groups = new Map<Group, Load>();
  for (const exercise of program.days.flatMap((day) => day.exercises)) {
    const group = muscleOf(exercise.exerciseId) ?? 'other';
    const load = exerciseLoad(exercise);
    const total = groups.get(group) ?? { sets: 0, tonnage: 0 };
    groups.set(group, { sets: total.sets + load.sets, tonnage: total.tonnage + load.tonnage });
  }
  return groups;
}

/** How much more than last week counts as a jump worth a warning. */
const JUMP = 0.3;

export interface WeekVolume {
  groups: { id: Group; label: string; sets: number; before: number | null; jump: boolean }[];
  sets: number;
  tonnage: number;
  tonnageBefore: number | null;
}

/** Weekly work sets per muscle group, compared with the week before when there is one. */
export function weekVolume(
  program: Program,
  last: Program | null,
  muscleOf: (exerciseId: string) => MuscleGroup | undefined,
): WeekVolume {
  const now = loadByGroup(program, muscleOf);
  const before = last ? loadByGroup(last, muscleOf) : null;
  const sum = (groups: Map<Group, Load>, key: keyof Load) =>
    [...groups.values()].reduce((total, load) => total + load[key], 0);
  return {
    groups: [...now.entries()]
      .filter(([, load]) => load.sets > 0)
      .map(([id, load]) => {
        const previous = before ? (before.get(id)?.sets ?? 0) : null;
        return {
          id,
          label: id === 'other' ? 'Otros' : MUSCLE_LABEL[id],
          sets: load.sets,
          before: previous,
          jump: previous != null && previous > 0 && load.sets > previous * (1 + JUMP),
        };
      })
      .sort((a, b) => b.sets - a.sets || a.label.localeCompare(b.label, 'es')),
    sets: sum(now, 'sets'),
    tonnage: Math.round(sum(now, 'tonnage')),
    tonnageBefore: before ? Math.round(sum(before, 'tonnage')) : null,
  };
}

/** The week as plain text, to paste into a message or a document. */
export function weekText(program: Program, weekStart: string): string {
  const start = parseISO(weekStart);
  const lines = [`${program.name} · semana del ${format(start, 'dd/MM/yyyy')}`];
  if (program.notes) lines.push(program.notes);
  for (const day of byDay(program.days)) {
    const date = format(addDays(start, day.dayIndex - 1), 'dd/MM');
    lines.push('', `${WEEKDAY_LABELS[day.dayIndex - 1]} ${date} · ${day.name || 'Sesión'}`);
    if (day.notes) lines.push(day.notes);
    day.exercises.forEach((exercise, i) => {
      const rest =
        exercise.restSeconds != null ? ` · descanso ${restLabel(exercise.restSeconds)}` : '';
      lines.push(
        `${i + 1}. ${exercise.exerciseName ?? exercise.exerciseId}: ${protocolText(exercise)}${rest}`,
      );
      if (exercise.notes) lines.push(`   ${exercise.notes}`);
    });
  }
  return lines.join('\n');
}
