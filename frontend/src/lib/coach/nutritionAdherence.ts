import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { DayTargets, DayType } from './nutritionPlan';

/** Mirrors the backend NutritionPlanDtos adherence records. */
interface Intake {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AdherenceDay {
  date: string;
  /** null when no plan from this coach applied that day. */
  dayType: DayType | null;
  target: DayTargets | null;
  /** null when nothing was logged. */
  intake: Intake | null;
  onTarget: boolean;
}

export interface AdherenceWeek {
  weekStart: string;
  plannedDays: number;
  loggedDays: number;
  onTargetDays: number;
  kcalPct: number | null;
  proteinPct: number | null;
  days: AdherenceDay[];
}

export const useNutritionAdherence = (linkId: string, weeks = 4) =>
  useQuery({
    queryKey: ['coach', 'client', linkId, 'nutrition-adherence', weeks],
    retry: false,
    queryFn: async () =>
      (
        await api.get<AdherenceWeek[]>(
          `/coach/clients/${encodeURIComponent(linkId)}/nutrition-plan/adherence`,
          { params: { weeks } },
        )
      ).data,
  });
