import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, differenceInCalendarWeeks, format, parseISO, startOfWeek } from 'date-fns';
import api from '@/api/client';
import { isProgramDraft, type Program, type ProgramAssignment } from './coachPrograms';

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
