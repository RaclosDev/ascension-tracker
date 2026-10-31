import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { FoodListsData, Recipe } from '../../types/api';

export function useFoodSearchLists(isOpen: boolean | undefined) {
  const {
    data: foodLists,
    isError,
    isFetching,
    refetch,
  } = useQuery<FoodListsData, Error>({
    queryKey: ['foodLists'],
    enabled: !!isOpen,
    queryFn: async () => {
      const [recentRes, savedRes, recipesRes] = await Promise.all([
        api.get<FoodListsData['recent']>('/nutrition/logs/recent'),
        api.get<FoodListsData['saved']>('/nutrition/my-foods'),
        api.get<FoodListsData['recipes']>('/nutrition/recipes'),
      ]);
      return { recent: recentRes.data, saved: savedRes.data, recipes: recipesRes.data };
    },
  });
  const recentLogs = foodLists?.recent || [];
  const mappedRecipes = (foodLists?.recipes || []).map((r: Recipe) => ({
    ...r,
    brand: 'Receta',
    kcalPer100g: r.totalKcal, // Recipes use 100 units for one serving.
    servingSize: 100,
    servingLabel: 'racion',
    kcal: r.totalKcal,
    protein: r.totalProtein,
    carbs: r.totalCarbs,
    fat: r.totalFat,
    isRecipe: true,
  }));
  const savedFoods = [...(foodLists?.saved || []), ...mappedRecipes];
  return { recentLogs, savedFoods, isError, isFetching, refetch };
}
