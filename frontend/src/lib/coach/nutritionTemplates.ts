import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { NutritionPlan, NutritionPlanRequest } from './nutritionPlan';

export interface NutritionTemplate {
  id: string;
  name: string;
  content: Pick<NutritionPlan, 'training' | 'rest' | 'notes' | 'meals'>;
  version: number;
  updatedAt: string;
}
interface TemplateSummary {
  id: string;
  name: string;
  trainingKcal: number;
  restKcal: number;
  version: number;
  updatedAt: string;
}
const key = ['coach', 'nutrition-templates'] as const;
const path = '/coach/nutrition-templates';
export const useNutritionTemplates = (enabled = true) =>
  useQuery({
    queryKey: key,
    enabled,
    retry: false,
    queryFn: async () => (await api.get<TemplateSummary[]>(path)).data,
  });
export const useNutritionTemplate = (id: string | null) =>
  useQuery({
    queryKey: [...key, id],
    enabled: !!id,
    retry: false,
    queryFn: async () =>
      (await api.get<NutritionTemplate>(`${path}/${encodeURIComponent(id!)}`)).data,
  });
export function useSaveNutritionTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...request
    }: {
      id: string | null;
      name: string;
      plan: NutritionPlanRequest;
      expectedVersion: number | null;
    }) =>
      id
        ? (await api.put<NutritionTemplate>(`${path}/${encodeURIComponent(id)}`, request)).data
        : (await api.post<NutritionTemplate>(path, request)).data,
    onSuccess: (saved) => {
      client.setQueryData([...key, saved.id], saved);
      void client.invalidateQueries({ queryKey: key, exact: true });
    },
  });
}
export function useDeleteNutritionTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: number }) => {
      await api.delete(`${path}/${encodeURIComponent(id)}`, {
        params: { expectedVersion: version },
      });
    },
    onSuccess: (_, { id }) => {
      client.removeQueries({ queryKey: [...key, id], exact: true });
      void client.invalidateQueries({ queryKey: key, exact: true });
    },
  });
}
