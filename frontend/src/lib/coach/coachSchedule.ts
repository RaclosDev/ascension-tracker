import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export interface ReviewSchedule {
  day: number;
  time: string;
  timeZone: string;
  paused: boolean;
}

export interface CoachFollowup {
  schedule: ReviewSchedule;
  startedAt: string;
  nextDueAt: string | null;
}

export const REVIEW_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];
export const defaultSchedule = (): ReviewSchedule => ({
  day: 7,
  time: '18:00',
  timeZone: 'Europe/Madrid',
  paused: false,
});
export const scheduleLabel = (schedule: ReviewSchedule) =>
  `${REVIEW_DAYS[schedule.day - 1]} · ${schedule.time.slice(0, 5)} · ${schedule.timeZone}`;

export function nextReviewLabel(followup: CoachFollowup): string {
  if (followup.schedule.paused) return 'Seguimiento en pausa';
  if (!followup.nextDueAt) return 'Sin próxima fecha';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: followup.schedule.timeZone,
  }).format(new Date(followup.nextDueAt));
}

export function useSaveSchedule(linkId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: ReviewSchedule) =>
      (
        await api.put<CoachFollowup>(
          `/coach/clients/${encodeURIComponent(linkId)}/schedule`,
          schedule,
        )
      ).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ['coach', 'clients'] }),
  });
}
