import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { ProgramExercise } from './coachPrograms';
import type { ProgramOrigin } from '../workout/types';

/** One prescribed day of an assigned program, next to the workout the client logged for it. */
export interface ProgramSession {
  dayId: string;
  week: number;
  dayIndex: number;
  date: string;
  name: string;
  notes: string | null;
  exercises: ProgramExercise[];
  workoutId: string | null;
  workoutName: string | null;
  finishedAt: number | null;
  origin: ProgramOrigin | null;
  comment: string | null;
}

export type SessionStatus = 'DONE' | 'MODIFIED' | 'MISSED' | 'PENDING';

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  DONE: 'Hecho',
  MODIFIED: 'Hecho con cambios',
  MISSED: 'No registrado',
  PENDING: 'Pendiente',
};

/** Days before `today` (ISO date) without a workout count as missed. */
export function sessionStatus(session: ProgramSession, today: string): SessionStatus {
  if (session.workoutId) return session.origin === 'PRESCRIBED_MODIFIED' ? 'MODIFIED' : 'DONE';
  return session.date < today ? 'MISSED' : 'PENDING';
}

const clientPath = (linkId: string) => `/coach/clients/${encodeURIComponent(linkId)}`;
const sessionsKey = (linkId: string, assignmentId: string) =>
  ['coach', 'clients', linkId, 'programs', assignmentId, 'sessions'] as const;

export const useProgramSessions = (linkId: string, assignmentId: string) =>
  useQuery({
    queryKey: sessionsKey(linkId, assignmentId),
    queryFn: async () =>
      (
        await api.get<ProgramSession[]>(
          `${clientPath(linkId)}/programs/${encodeURIComponent(assignmentId)}/sessions`,
        )
      ).data,
  });

/** Saves (text) or removes (null) the coach's comment on a workout. */
export function useSaveComment(linkId: string, assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, text }: { workoutId: string; text: string | null }) => {
      const path = `${clientPath(linkId)}/workouts/${encodeURIComponent(workoutId)}/comment`;
      if (text == null) await api.delete(path);
      else await api.put(path, { text });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(linkId, assignmentId) }),
  });
}
