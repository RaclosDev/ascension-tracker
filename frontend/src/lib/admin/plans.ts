import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

/** Mirrors the backend AdminDtos. */
export interface PlanInfo {
  id: string;
  maxClients: number;
  aiDailyLimit: number;
}

export interface AdminCoach {
  coachId: string;
  name: string | null;
  email: string;
  plan: string;
  status: string;
  /** The plan whose limits apply now: the free one once a trial or paid period has run out. */
  effectivePlan: string;
  maxClients: number;
  activeClients: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface CoachPlans {
  plans: PlanInfo[];
  coaches: AdminCoach[];
}

/** {@code paidUntil} is the last paid day (yyyy-mm-dd); left out for the free plan. */
export type PaymentMethod = 'TRANSFER' | 'CASH' | 'CARD' | 'OTHER';

/** A paid plan carries the payment that goes to the ledger; the free plan sends only `plan`. */
export interface PlanChange {
  plan: string;
  paidUntil?: string;
  /** Total received, VAT included. */
  amountCents?: number;
  vatRatePct?: number;
  method?: PaymentMethod;
  reference?: string;
}

/** Parses "121", "121,5" or "121.50" euros into cents; null when it is not a positive amount. */
export function eurosToCents(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  if (!text.trim() || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

const key = ['admin', 'coaches'] as const;

export const useIsAdmin = () =>
  useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => (await api.get<{ admin: boolean }>('/admin/me')).data.admin,
    staleTime: Infinity,
  });

export const useAdminCoaches = (enabled: boolean) =>
  useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<CoachPlans>('/admin/coaches')).data,
    enabled,
  });

export function useSetCoachPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ coachId, change }: { coachId: string; change: PlanChange }) =>
      (await api.put<AdminCoach>(`/admin/coaches/${encodeURIComponent(coachId)}/plan`, change))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
