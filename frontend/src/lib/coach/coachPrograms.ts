import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { isAxiosError } from 'axios';
import { WEEKDAY_LABELS } from './weekdays';

/** Mirrors the backend ProgramDtos: the builder always saves the whole program at once. */
export interface ProgramExercise {
  prescription?: ExercisePrescription | null;
  exerciseId: string;
  exerciseName: string | null;
  variantGrip?: string | null;
  variantMachine?: string | null;
  sets: number;
  repsMin: number | null;
  repsMax: number | null;
  targetRpe: number | null;
  targetRir: number | null;
  restSeconds: number | null;
  loadHint: string | null;
  supersetGroup: number | null;
  notes: string | null;
}

export interface PrescribedLoad {
  mode: 'KG' | 'PERCENT_TM';
  amount: number;
  unit: 'TOTAL' | 'EACH';
  lift?: 'squat' | 'bench' | 'deadlift' | null;
  increment?: number | null;
  referenceKg?: number | null;
  resolvedKg?: number | null;
  referenceDate?: string | null;
}
export interface SetTarget {
  kind: 'WORK' | 'WARMUP' | 'TOP' | 'BACKOFF';
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  load: PrescribedLoad | null;
  notes?: string | null;
}
export interface ExercisePrescription {
  load?: PrescribedLoad | null;
  sets?: SetTarget[] | null;
}

export interface ProgramDay {
  week: number;
  dayIndex: number;
  name: string;
  notes: string | null;
  exercises: ProgramExercise[];
}

export interface Program {
  id: string | null;
  name: string;
  notes: string | null;
  weeks: number;
  days: ProgramDay[];
  updatedAt?: string | null;
  status?: 'DRAFT' | 'READY';
}

export interface ProgramSummary {
  id: string;
  name: string;
  weeks: number;
  dayCount: number;
  updatedAt: string;
  status?: 'DRAFT' | 'READY';
}

export const MAX_WEEKS = 52;
export const MAX_EXERCISES_PER_DAY = 30;
export { WEEKDAY_LABELS } from './weekdays';

export const emptyProgram = (): Program => ({
  id: null,
  name: '',
  notes: null,
  weeks: 4,
  days: [],
  status: 'DRAFT',
});

export const newExercise = (exerciseId: string, exerciseName: string): ProgramExercise => ({
  exerciseId,
  exerciseName,
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  targetRpe: null,
  targetRir: null,
  restSeconds: 120,
  loadHint: null,
  supersetGroup: null,
  notes: null,
});

// ---- Pure editor operations: each returns a new program ----

const sortDays = (days: ProgramDay[]) =>
  [...days].sort((a, b) => a.week - b.week || a.dayIndex - b.dayIndex);

export const findDay = (program: Program, week: number, dayIndex: number) =>
  program.days.find((d) => d.week === week && d.dayIndex === dayIndex);

export function addDay(program: Program, week: number, dayIndex: number): Program {
  if (findDay(program, week, dayIndex)) return program;
  const day: ProgramDay = { week, dayIndex, name: `Día ${dayIndex}`, notes: null, exercises: [] };
  return { ...program, days: sortDays([...program.days, day]) };
}

export function removeDay(program: Program, week: number, dayIndex: number): Program {
  return {
    ...program,
    days: program.days.filter((d) => !(d.week === week && d.dayIndex === dayIndex)),
  };
}

export function updateDay(
  program: Program,
  week: number,
  dayIndex: number,
  change: (day: ProgramDay) => ProgramDay,
): Program {
  return {
    ...program,
    days: program.days.map((d) => (d.week === week && d.dayIndex === dayIndex ? change(d) : d)),
  };
}

/** Copies a day into another slot, replacing whatever was there. */
export function copyDay(
  program: Program,
  from: { week: number; dayIndex: number },
  to: { week: number; dayIndex: number },
): Program {
  const source = findDay(program, from.week, from.dayIndex);
  if (!source || (from.week === to.week && from.dayIndex === to.dayIndex)) return program;
  const copy: ProgramDay = {
    ...source,
    week: to.week,
    dayIndex: to.dayIndex,
    exercises: structuredClone(source.exercises),
  };
  const rest = removeDay(program, to.week, to.dayIndex);
  return { ...rest, days: sortDays([...rest.days, copy]) };
}

/** Copies every day of a week onto another week, replacing that week's days. */
export function copyWeek(program: Program, fromWeek: number, toWeek: number): Program {
  if (fromWeek === toWeek || toWeek < 1 || toWeek > program.weeks) return program;
  const kept = program.days.filter((d) => d.week !== toWeek);
  const copies = program.days
    .filter((d) => d.week === fromWeek)
    .map((d) => ({ ...d, week: toWeek, exercises: structuredClone(d.exercises) }));
  return { ...program, days: sortDays([...kept, ...copies]) };
}

/** Changes the program length; days beyond the new length are dropped. */
export function setWeeks(program: Program, weeks: number): Program {
  const clamped = Math.min(MAX_WEEKS, Math.max(1, Math.round(weeks) || 1));
  return { ...program, weeks: clamped, days: program.days.filter((d) => d.week <= clamped) };
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Problems the backend would reject, in Spanish, so the coach sees them before saving. */
export function programProblems(program: Program): string[] {
  const problems: string[] = [];
  if (!program.name.trim()) problems.push('El programa necesita un nombre.');
  for (const day of program.days) {
    const where = `Semana ${day.week}, ${WEEKDAY_LABELS[day.dayIndex - 1]}`;
    if (!day.name.trim()) problems.push(`${where}: el día necesita un nombre.`);
    if (day.exercises.length > MAX_EXERCISES_PER_DAY)
      problems.push(`${where}: demasiados ejercicios.`);
    day.exercises.forEach((e, i) => {
      if (!(e.sets >= 1 && e.sets <= 20))
        problems.push(`${where}, ejercicio ${i + 1}: las series van de 1 a 20.`);
      if (e.repsMin != null && e.repsMax != null && e.repsMin > e.repsMax)
        problems.push(
          `${where}, ejercicio ${i + 1}: las repeticiones mínimas superan a las máximas.`,
        );
      if (e.targetRpe != null && (e.targetRpe < 1 || e.targetRpe > 10))
        problems.push(`${where}, ejercicio ${i + 1}: el RPE va de 1 a 10.`);
      if (e.targetRir != null && (e.targetRir < 0 || e.targetRir > 10))
        problems.push(`${where}, ejercicio ${i + 1}: el RIR va de 0 a 10.`);
    });
  }
  return problems;
}

export function publishProblems(program: Program): string[] {
  const problems = programProblems(program);
  if (!program.days.length)
    problems.push('Añade al menos una sesión antes de marcarlo como listo.');
  for (const day of program.days) {
    if (!day.exercises.length)
      problems.push(`Semana ${day.week}, ${day.name}: añade ejercicios o elimina el día vacío.`);
  }
  return problems;
}

export function isProgramDraft(value: unknown): value is Program {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    (p.id === null || typeof p.id === 'string') &&
    typeof p.name === 'string' &&
    (p.notes === null || typeof p.notes === 'string') &&
    typeof p.weeks === 'number' &&
    Number.isInteger(p.weeks) &&
    p.weeks >= 1 &&
    p.weeks <= MAX_WEEKS &&
    (p.updatedAt == null || typeof p.updatedAt === 'string') &&
    (p.status === 'DRAFT' || p.status === 'READY' || p.status === undefined) &&
    Array.isArray(p.days) &&
    p.days.length <= 140 &&
    p.days.every((day: unknown) => {
      if (!day || typeof day !== 'object') return false;
      const d = day as Record<string, unknown>;
      return (
        typeof d.name === 'string' &&
        (d.notes == null || typeof d.notes === 'string') &&
        typeof d.week === 'number' &&
        Number.isInteger(d.week) &&
        d.week >= 1 &&
        d.week <= MAX_WEEKS &&
        typeof d.dayIndex === 'number' &&
        Number.isInteger(d.dayIndex) &&
        d.dayIndex >= 1 &&
        d.dayIndex <= 7 &&
        Array.isArray(d.exercises) &&
        d.exercises.length <= MAX_EXERCISES_PER_DAY &&
        d.exercises.every((exercise: unknown) => {
          if (!exercise || typeof exercise !== 'object') return false;
          const e = exercise as Record<string, unknown>;
          return (
            typeof e.exerciseId === 'string' &&
            typeof e.sets === 'number' &&
            ['exerciseName', 'variantGrip', 'variantMachine', 'loadHint', 'notes'].every(
              (key) => e[key] == null || typeof e[key] === 'string',
            ) &&
            ['repsMin', 'repsMax', 'targetRpe', 'targetRir', 'restSeconds', 'supersetGroup'].every(
              (key) => e[key] == null || typeof e[key] === 'number',
            )
          );
        })
      );
    })
  );
}

// ---- API ----

const keys = {
  list: ['coach', 'programs'] as const,
  one: (id: string) => ['coach', 'programs', id] as const,
};

const programPath = (id: string) => `/coach/programs/${encodeURIComponent(id)}`;

export const useCoachPrograms = () =>
  useQuery({
    queryKey: keys.list,
    queryFn: async () => (await api.get<ProgramSummary[]>('/coach/programs')).data,
  });

export const useCoachProgram = (id: string | null) =>
  useQuery({
    queryKey: keys.one(id ?? ''),
    enabled: id != null,
    retry: false,
    queryFn: async () => (await api.get<Program>(programPath(id as string))).data,
  });

export function useSaveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: Program) => {
      const body = { ...program, id: undefined };
      return program.id
        ? (await api.put<Program>(programPath(program.id), body)).data
        : (await api.post<Program>('/coach/programs', body)).data;
    },
    onSuccess: (saved) => {
      if (saved.id) queryClient.setQueryData(keys.one(saved.id), saved);
      return queryClient.invalidateQueries({ queryKey: keys.list, exact: true });
    },
    onError: (error, program) => {
      if (program.id && isAxiosError(error) && error.response?.status === 409)
        void queryClient.invalidateQueries({ queryKey: keys.one(program.id) });
    },
  });
}

export function useDuplicateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<Program>(`${programPath(id)}/duplicate`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.list, exact: true }),
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(programPath(id));
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: keys.one(id) });
      return queryClient.invalidateQueries({ queryKey: keys.list, exact: true });
    },
  });
}

// ---- Assignment to a client ----

/** A program copied to a client; {@link programId} is the client's copy. */
export interface ProgramAssignment {
  id: string;
  programId: string;
  sourceProgramId: string | null;
  programName: string;
  weeks: number;
  startDate: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'ENDED';
  createdAt: string;
  endedAt: string | null;
  effectiveUntil?: string | null;
}

const assignmentsKey = (linkId: string) => ['coach', 'clients', linkId, 'programs'] as const;
const assignmentsPath = (linkId: string) => `/coach/clients/${encodeURIComponent(linkId)}/programs`;

export const useClientAssignments = (linkId: string) =>
  useQuery({
    queryKey: assignmentsKey(linkId),
    queryFn: async () => (await api.get<ProgramAssignment[]>(assignmentsPath(linkId))).data,
  });

export function useAssignProgram(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: {
      programId: string;
      startDate: string;
      programUpdatedAt?: string | null;
    }) => (await api.post<ProgramAssignment>(assignmentsPath(linkId), request)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach', 'clients'] }),
  });
}

export function useEndAssignment(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.post(`${assignmentsPath(linkId)}/${encodeURIComponent(assignmentId)}/end`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach', 'clients'] }),
  });
}

export const useAssignedProgram = (linkId: string, assignmentId: string) =>
  useQuery({
    enabled: !!assignmentId,
    queryKey: [...assignmentsKey(linkId), assignmentId, 'plan'],
    queryFn: async () =>
      (
        await api.get<Program>(
          `${assignmentsPath(linkId)}/${encodeURIComponent(assignmentId)}/plan`,
        )
      ).data,
    retry: false,
  });

export function useAdaptProgram(linkId: string, assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: { program: Program; startDate: string }) =>
      (
        await api.post<ProgramAssignment>(
          `${assignmentsPath(linkId)}/${encodeURIComponent(assignmentId)}/adapt`,
          request,
        )
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach', 'clients'] }),
  });
}
