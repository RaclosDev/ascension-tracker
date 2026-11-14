import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

/** Mirrors the backend ClientStatusDtos records. */
export type StatusLevel = 'GREEN' | 'AMBER' | 'RED';
type StatusReason =
  | 'INACTIVE'
  | 'CHECKIN_MISSING'
  | 'FEW_FOOD_LOGS'
  | 'WEIGHT_STALLED'
  | 'NO_PROGRAM'
  | 'NO_NUTRITION_PLAN';

export interface StatusSignal {
  reason: StatusReason;
  level: StatusLevel;
  value: number;
}

export interface ClientStatus {
  linkId: string;
  level: StatusLevel;
  lastActivity: string | null;
  lastWorkout?: string | null;
  lastCheckin?: string | null;
  nextWeekStatus?: 'DRAFT' | 'SCHEDULED' | 'MISSING' | null;
  pendingReplies: number;
  /** Kilos gained (+) or lost (-) between the last week and three weeks earlier; null if unknown. */
  weightChange: number | null;
  signals: StatusSignal[];
}

export const LEVEL_ORDER: Record<StatusLevel, number> = { RED: 0, AMBER: 1, GREEN: 2 };

export const LEVEL_COLORS: Record<StatusLevel, string> = {
  RED: 'var(--color-danger)',
  AMBER: 'var(--color-warning)',
  GREEN: 'var(--color-success)',
};

export function signalText({ reason, value }: StatusSignal): string {
  switch (reason) {
    case 'INACTIVE':
      return `${value} días sin registrar nada`;
    case 'CHECKIN_MISSING':
      return value === 1
        ? 'Falta un seguimiento tras la fecha acordada'
        : `${value} semanas sin seguimiento`;
    case 'FEW_FOOD_LOGS':
      return `Comida registrada ${value} de 7 días`;
    case 'WEIGHT_STALLED':
      return `Pocos cambios de peso en las últimas ${value} semanas`;
    case 'NO_PROGRAM':
      return 'Sin programa asignado';
    case 'NO_NUTRITION_PLAN':
      return 'Sin plan de nutrición';
  }
}

export const useClientStatus = (enabled: boolean, linkId?: string) =>
  useQuery({
    queryKey: linkId ? ['coach', 'clients', 'status', linkId] : ['coach', 'clients', 'status'],
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () =>
      linkId
        ? [
            (await api.get<ClientStatus>(`/coach/clients/${encodeURIComponent(linkId)}/status`))
              .data,
          ]
        : (await api.get<ClientStatus[]>('/coach/clients/status')).data,
  });
