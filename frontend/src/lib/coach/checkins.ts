import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { CoachPerson } from './api';

/** Mirrors the backend CheckinDtos records. */
export interface CheckinTemplate {
  questions: string[];
  /** false while the coach still uses the default questions. */
  custom: boolean;
}

interface CheckinAnswer {
  question: string;
  answer: string;
}

export interface Checkin {
  id: string;
  linkId: string;
  weekStart: string;
  /** Only while the client shares body data. */
  weightAvg: number | null;
  energy: number;
  sleep: number;
  trainingAdherence: number;
  dietAdherence: number;
  answers: CheckinAnswer[];
  notes: string | null;
  coachReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCheckin {
  linkId: string;
  coach: CoachPerson;
  weekStart: string;
  questions: string[];
  current: Checkin | null;
}

export type Scores = Pick<Checkin, 'energy' | 'sleep' | 'trainingAdherence' | 'dietAdherence'>;

export interface CheckinRequest extends Scores {
  answers: string[];
  notes: string;
}

export const SCORE_LABELS: Record<keyof Scores, string> = {
  energy: 'Energía',
  sleep: 'Sueño',
  trainingAdherence: 'Cumplimiento del entreno',
  dietAdherence: 'Cumplimiento de la dieta',
};

export const SCORE_KEYS = Object.keys(SCORE_LABELS) as (keyof Scores)[];

const enc = encodeURIComponent;
const keys = {
  template: ['coach', 'checkin-template'] as const,
  client: (linkId: string) => ['coach', 'client', linkId, 'checkins'] as const,
  mine: (linkId: string) => ['coaching', 'checkin', linkId] as const,
  history: (linkId: string) => ['coaching', 'checkins', linkId] as const,
};

// ---- Coach side ----

export const useCheckinTemplate = (enabled = true) =>
  useQuery({
    queryKey: keys.template,
    enabled,
    queryFn: async () => (await api.get<CheckinTemplate>('/coach/checkin-template')).data,
  });

export function useSaveCheckinTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questions: string[]) =>
      (await api.put<CheckinTemplate>('/coach/checkin-template', { questions })).data,
    onSuccess: (data) => queryClient.setQueryData(keys.template, data),
  });
}

export const useClientCheckins = (linkId: string) =>
  useQuery({
    queryKey: keys.client(linkId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async () => (await api.get<Checkin[]>(`/coach/clients/${enc(linkId)}/checkins`)).data,
  });

export function useReplyCheckin(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) =>
      (
        await api.put<Checkin>(`/coach/clients/${enc(linkId)}/checkins/${enc(id)}/reply`, {
          reply,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.client(linkId) });
      // The pending replies count on the client list.
      queryClient.invalidateQueries({ queryKey: ['coach', 'clients', 'status'] });
    },
  });
}

// ---- Client side ----

export const useMyCheckin = (linkId: string) =>
  useQuery({
    queryKey: keys.mine(linkId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async () =>
      (await api.get<ClientCheckin>(`/coaching/coaches/${enc(linkId)}/checkin`)).data,
  });

export const useMyCheckinHistory = (linkId: string) =>
  useQuery({
    queryKey: keys.history(linkId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () =>
      (await api.get<Checkin[]>(`/coaching/coaches/${enc(linkId)}/checkins`)).data,
  });

export function useSendCheckin(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CheckinRequest) =>
      (await api.put<Checkin>(`/coaching/coaches/${enc(linkId)}/checkin`, request)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.mine(linkId) });
      queryClient.invalidateQueries({ queryKey: keys.history(linkId) });
    },
  });
}
