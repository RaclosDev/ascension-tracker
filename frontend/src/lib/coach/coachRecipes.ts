import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

/** Mirrors the backend CoachRecipeDtos: macros per serving, kcal derived as 4P + 4C + 9F. */
export interface CoachRecipe {
  id: string;
  name: string;
  description: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  updatedAt: string;
}

export interface CoachRecipeRequest {
  name: string;
  description: string | null;
  protein: number;
  carbs: number;
  fat: number;
}

export const recipeKcal = ({
  protein,
  carbs,
  fat,
}: Pick<CoachRecipe, 'protein' | 'carbs' | 'fat'>) => Math.round(4 * protein + 4 * carbs + 9 * fat);

const key = ['coach', 'recipes'] as const;

export const useCoachRecipes = () =>
  useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<CoachRecipe[]>('/coach/recipes')).data,
  });

export function useSaveRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, request }: { id: string | null; request: CoachRecipeRequest }) =>
      id
        ? (await api.put<CoachRecipe>(`/coach/recipes/${encodeURIComponent(id)}`, request)).data
        : (await api.post<CoachRecipe>('/coach/recipes', request)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/coach/recipes/${encodeURIComponent(id)}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
