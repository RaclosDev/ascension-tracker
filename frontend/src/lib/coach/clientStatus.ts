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
  pendingReplies: number;
  signals: StatusSignal[];
}

export const LEVEL_ORDER: Record<StatusLevel, number> = { RED: 0, AMBER: 1, GREEN: 2 };

export const LEVEL_LABELS: Record<StatusLevel, string> = {
  RED: 'Necesita atención',
  AMBER: 'Vigilar',
  GREEN: 'Al día',
};

export function signalText({ reason, value }: StatusSignal): string {
  switch (reason) {
    case 'INACTIVE':
      return `${value} días sin registrar nada`;
    case 'CHECKIN_MISSING':
      return value === 1
        ? 'Falta el check-in de la semana pasada'
        : `${value} semanas sin check-in`;
    case 'FEW_FOOD_LOGS':
      return `Comida registrada ${value} de 7 días`;
    case 'WEIGHT_STALLED':
      return `Peso estancado en las últimas ${value} semanas`;
    case 'NO_PROGRAM':
      return 'Sin programa asignado';
    case 'NO_NUTRITION_PLAN':
      return 'Sin plan de nutrición';
  }
}

export const useClientStatus = (enabled: boolean) =>
  useQuery({
    queryKey: ['coach', 'clients', 'status'] as const,
    enabled,
    queryFn: async () => (await api.get<ClientStatus[]>('/coach/clients/status')).data,
  });
