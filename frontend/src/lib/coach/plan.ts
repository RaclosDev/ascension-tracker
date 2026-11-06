import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

/** Mirrors CoachSubscriptionDtos.Subscription. */
export interface CoachSubscription {
  plan: string;
  status: string;
  /** The plan whose limits apply now: the free one once a trial or paid period has run out. */
  effectivePlan: string;
  maxClients: number;
  activeClients: number;
  aiDailyLimit: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface PlanOffer {
  id: string;
  maxClients: number;
  aiDailyLimit: number;
  monthlyPriceEur: number;
  annualPriceEur: number;
}

/** Prices and, when configured, where to send the bank transfer. */
export interface CoachBilling {
  plans: PlanOffer[];
  annualMonths: number;
  transferHolder: string | null;
  transferIban: string | null;
}

export type ContactTopic = 'PLAN' | 'CUSTOM' | 'OTHER';

export interface NewContactRequest {
  topic: ContactTopic;
  message: string;
  desiredClients?: number;
}

export interface AdminContactRequest {
  id: string;
  name: string | null;
  email: string;
  topic: ContactTopic;
  message: string;
  desiredClients: number | null;
  createdAt: string;
  handledAt: string | null;
}

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Gratis',
  STARTER: 'Básico',
  PRO: 'Pro',
  ELITE: 'Élite',
};
export const planName = (id: string) => PLAN_NAMES[id] ?? id;

export const useCoachSubscription = (enabled: boolean) =>
  useQuery({
    queryKey: ['coach', 'subscription'],
    queryFn: async () => (await api.get<CoachSubscription>('/coach/subscription')).data,
    enabled,
  });

export const useCoachBilling = (enabled: boolean) =>
  useQuery({
    queryKey: ['coach', 'billing'],
    queryFn: async () => (await api.get<CoachBilling>('/coach/billing')).data,
    enabled,
    staleTime: 60 * 60 * 1000,
  });

export const useSendContactRequest = () =>
  useMutation({
    mutationFn: async (request: NewContactRequest) => {
      await api.post('/contact-requests', request);
    },
  });

const contactKey = ['admin', 'contact-requests'] as const;

export const useAdminContactRequests = (enabled: boolean) =>
  useQuery({
    queryKey: contactKey,
    queryFn: async () => (await api.get<AdminContactRequest[]>('/admin/contact-requests')).data,
    enabled,
  });

export function useSetContactHandled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, handled }: { id: string; handled: boolean }) => {
      await api.put(`/admin/contact-requests/${encodeURIComponent(id)}/handled`, { handled });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactKey }),
  });
}
