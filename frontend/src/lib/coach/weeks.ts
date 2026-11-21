import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { addDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import api from '@/api/client';
import {
  assignedProgramQuery,
  isProgramDraft,
  useClientAssignments,
  type Program,
  type ProgramAssignment,
} from './coachPrograms';

export const weekDate = (date = new Date()) =>
  format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
export const shiftWeek = (week: string, n: number) =>
  format(addDays(parseISO(week), 7 * n), 'yyyy-MM-dd');
export const INTENTS = {
  BUILD: 'Progresión',
  MAINTAIN: 'Mantenimiento',
  DELOAD: 'Descarga',
  TEST: 'Test',
  COMPETE: 'Competición',
};
export interface WeekContent {
  program: Program;
  privateNotes: string;
  intent: keyof typeof INTENTS;
  decision: string;
}
export interface SavedWeek {
  linkId: string;
  weekStart: string;
  content: WeekContent;
  version: number;
  assignmentId: string | null;
  publishedVersion: number | null;
  updatedAt: string | null;
  /** The week whose sessions this one repeats, until its own are edited by hand. */
  linkedFrom?: string | null;
}
export function isSavedWeek(value: unknown): value is SavedWeek {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!v.content || typeof v.content !== 'object') return false;
  const c = v.content as Record<string, unknown>;
  return (
    typeof v.linkId === 'string' &&
    typeof v.weekStart === 'string' &&
    Number.isInteger(v.version) &&
    isProgramDraft(c.program) &&
    typeof c.privateNotes === 'string' &&
    typeof c.decision === 'string' &&
    typeof c.intent === 'string' &&
    c.intent in INTENTS
  );
}
export function weekFrom(program: Program, assignment: ProgramAssignment, week: string): Program {
  const relative =
    differenceInCalendarWeeks(parseISO(week), parseISO(assignment.startDate), { weekStartsOn: 1 }) +
    1;
  return {
    ...program,
    id: null,
    updatedAt: null,
    name: `Semana del ${week}`,
    weeks: 1,
    status: 'DRAFT',
    days: structuredClone(
      program.days.filter((d) => {
        const date = format(addDays(parseISO(week), d.dayIndex - 1), 'yyyy-MM-dd');
        return (
          d.week === relative &&
          date >= assignment.startDate &&
          (!assignment.effectiveUntil || date < assignment.effectiveUntil) &&
          (!assignment.endedAt || date < assignment.endedAt.slice(0, 10))
        );
      }),
    ).map((d) => ({ ...d, week: 1 })),
  };
}
export function overlapsWeek(a: ProgramAssignment, week: string) {
  const end = a.effectiveUntil ?? shiftWeek(weekDate(parseISO(a.startDate)), a.weeks);
  return (
    a.startDate < shiftWeek(week, 1) && end > week && (!a.endedAt || a.endedAt.slice(0, 10) >= week)
  );
}
const programEnd = (a: ProgramAssignment) => shiftWeek(weekDate(parseISO(a.startDate)), a.weeks);
/**
 * Week number and length counted from where the program first started. Publishing a week by hand
 * splits a program: the rest goes on as a renumbered copy that ends on the same day.
 */
export function programPosition(all: ProgramAssignment[], a: ProgramAssignment, week: string) {
  const origin = all
    .filter(
      (o) =>
        a.sourceProgramId !== null &&
        o.sourceProgramId === a.sourceProgramId &&
        o.weeks > 1 &&
        o.startDate < a.startDate &&
        programEnd(o) === programEnd(a),
    )
    .reduce((first, o) => (o.startDate < first.startDate ? o : first), a);
  return {
    week:
      differenceInCalendarWeeks(parseISO(week), parseISO(origin.startDate), { weekStartsOn: 1 }) +
      1,
    weeks: origin.weeks,
  };
}
export interface ProgramWeek {
  assignment: ProgramAssignment;
  /** That week's sessions, as a one-week plan ready to edit. */
  program: Program;
  /** 1-based week of the program. */
  week: number;
}
const plansOf = (results: { data?: Program }[]) => results.map((r) => r.data);
/** The library program each week falls in, with its sessions, for weeks never prepared by hand. */
export function useProgramWeeks(linkId: string, enabled = true) {
  const assignments = useClientAssignments(linkId, enabled);
  const running = useMemo(
    () => (assignments.data ?? []).filter((a) => a.status !== 'ENDED' && a.weeks > 1),
    [assignments.data],
  );
  const plans = useQueries({
    queries: running.map((a) => assignedProgramQuery(linkId, a.id)),
    combine: plansOf,
  });
  const find = useMemo(
    () =>
      (week: string): ProgramWeek | null => {
        const i = running.findIndex((a) => overlapsWeek(a, week));
        const plan = plans[i];
        if (i < 0 || !plan) return null;
        const assignment = running[i];
        return {
          assignment,
          program: weekFrom(plan, assignment, week),
          week: programPosition(assignments.data ?? [], assignment, week).week,
        };
      },
    [running, plans, assignments.data],
  );
  const loading = assignments.isLoading || running.some((_, i) => plans[i] === undefined);
  return { find, loading };
}
const path = (id: string, week: string) => `/coach/clients/${encodeURIComponent(id)}/weeks/${week}`;
const key = (id: string, week: string) => ['coach', 'clients', id, 'weeks', week];
export const useCoachWeek = (id: string, week: string) =>
  useQuery({
    queryKey: key(id, week),
    queryFn: async () => (await api.get<SavedWeek>(path(id, week))).data,
  });
export function useSaveWeek(id: string, week: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (value: SavedWeek) =>
      (
        await api.put<SavedWeek>(path(id, week), {
          content: value.content,
          expectedVersion: value.version,
        })
      ).data,
    onSuccess: (saved) => cache.setQueryData(key(id, week), saved),
  });
}
export function usePublishWeek(id: string, week: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) =>
      (await api.post<SavedWeek>(`${path(id, week)}/publish`, { expectedVersion: version })).data,
    onSuccess: async (saved) => {
      cache.setQueryData(key(id, week), saved);
      await cache.invalidateQueries({ queryKey: ['coach', 'clients'] });
    },
  });
}
