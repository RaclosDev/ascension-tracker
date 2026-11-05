import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { CoachPerson } from './api';

/** Mirrors the backend NutritionPlanDtos: grams per macro, kcal derived as 4P + 4C + 9F. */
export interface DayTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionPlan {
  id: string;
  coach: CoachPerson;
  training: DayTargets;
  rest: DayTargets;
  notes: string | null;
  createdAt: string;
}

export type DayGrams = Pick<DayTargets, 'protein' | 'carbs' | 'fat'>;

export interface NutritionPlanRequest {
  training: DayGrams;
  rest: DayGrams;
  notes: string | null;
}

export const dayKcal = ({ protein, carbs, fat }: DayGrams) => 4 * protein + 4 * carbs + 9 * fat;

const coachKey = (linkId: string) => ['coach', 'client', linkId, 'nutrition-plan'] as const;
const myKey = ['coaching', 'nutrition-plan'] as const;

/** 204 means no plan: the hooks resolve to null then. */
const orNull = <T>(data: T | '' | undefined) => (data ? data : null);

export const useCoachNutritionPlan = (linkId: string) =>
  useQuery({
    queryKey: coachKey(linkId),
    retry: false,
    queryFn: async () =>
      orNull(
        (
          await api.get<NutritionPlan | ''>(
            `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan`,
          )
        ).data,
      ),
  });

export function useSetNutritionPlan(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: NutritionPlanRequest) =>
      (
        await api.put<NutritionPlan>(
          `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan`,
          request,
        )
      ).data,
    onSuccess: (plan) => queryClient.setQueryData(coachKey(linkId), plan),
  });
}

export function useEndNutritionPlan(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan`);
    },
    onSuccess: () => queryClient.setQueryData(coachKey(linkId), null),
  });
}

/** The plan a coach set for the signed-in user, while in force. */
export const useMyNutritionPlan = () =>
  useQuery({
    queryKey: myKey,
    retry: false,
    queryFn: async () =>
      orNull((await api.get<NutritionPlan | ''>('/coaching/nutrition-plan')).data),
  });
