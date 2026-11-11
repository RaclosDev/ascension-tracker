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
  meals: PlannedMeal[];
}

export type DayType = 'TRAINING' | 'REST';

/** A prescribed meal: a copy of the coach's recipe, macros for all the servings. */
export interface PlannedMeal {
  dayType: DayType;
  slotName: string;
  /** null once the coach deletes the recipe; the copy stays. */
  recipeId: string | null;
  name: string;
  description: string | null;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealRequest {
  dayType: DayType;
  slotName: string;
  recipeId: string;
  servings: number;
  expectedRecipeUpdatedAt?: string;
}

export type DayGrams = Pick<DayTargets, 'protein' | 'carbs' | 'fat'>;

export interface NutritionPlanRequest {
  training: DayGrams;
  rest: DayGrams;
  notes: string | null;
  meals: MealRequest[];
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
    mutationFn: async (request: { plan: NutritionPlanRequest; expectedPlanId: string | null }) =>
      (
        await api.post<NutritionPlan>(
          `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan/publish`,
          request,
        )
      ).data,
    onSuccess: (plan) => {
      queryClient.setQueryData(coachKey(linkId), plan);
      void queryClient.invalidateQueries({ queryKey: [...coachKey(linkId), 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'client', linkId, 'targets'] });
      void queryClient.invalidateQueries({
        queryKey: ['coach', 'client', linkId, 'nutrition-adherence'],
      });
    },
  });
}

export function useEndNutritionPlan(linkId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      await api.post(
        `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan/${encodeURIComponent(planId)}/end`,
      );
    },
    onSuccess: () => {
      queryClient.setQueryData(coachKey(linkId), null);
      void queryClient.invalidateQueries({ queryKey: [...coachKey(linkId), 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'client', linkId, 'targets'] });
      void queryClient.invalidateQueries({
        queryKey: ['coach', 'client', linkId, 'nutrition-adherence'],
      });
    },
  });
}

export interface NutritionPlanVersion {
  id: string;
  training: DayTargets;
  rest: DayTargets;
  status: 'ACTIVE' | 'ENDED';
  createdAt: string;
  endedAt: string | null;
}

export const useNutritionPlanHistory = (linkId: string, enabled: boolean) =>
  useQuery({
    queryKey: [...coachKey(linkId), 'history'],
    enabled,
    retry: false,
    queryFn: async () =>
      (
        await api.get<NutritionPlanVersion[]>(
          `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan/history`,
        )
      ).data,
  });

export const useNutritionPlanVersion = (linkId: string, planId: string) =>
  useQuery({
    queryKey: [...coachKey(linkId), 'version', planId],
    retry: false,
    queryFn: async () =>
      (
        await api.get<NutritionPlan>(
          `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan/history/${encodeURIComponent(planId)}`,
        )
      ).data,
  });

/** The plan a coach set for the signed-in user, while in force. */
export const useMyNutritionPlan = () =>
  useQuery({
    queryKey: myKey,
    retry: false,
    queryFn: async () =>
      orNull((await api.get<NutritionPlan | ''>('/coaching/nutrition-plan')).data),
  });
