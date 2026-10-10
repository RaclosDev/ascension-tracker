import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { PageFoodItem } from '../../types/myfoods';
import { Recipe, FoodLog } from '../../types/api';
import toast from 'react-hot-toast';

export function useMyFoodsData() {
  const queryClient = useQueryClient();

  const {
    data = { recentFoods: [], savedFoods: [], recipes: [] },
    isLoading,
    refetch,
  } = useQuery<
    {
      recentFoods: FoodLog[];
      savedFoods: PageFoodItem[];
      recipes: Recipe[];
    },
    Error
  >({
    queryKey: ['myFoodsData'],
    queryFn: async () => {
      const [recentRes, savedRes, recipesRes] = await Promise.all([
        api.get('/nutrition/logs/recent').catch(() => ({ data: [] })),
        api.get('/nutrition/my-foods').catch(() => ({ data: [] })),
        api.get('/nutrition/recipes').catch(() => ({ data: [] })),
      ]);
      return {
        recentFoods: recentRes.data,
        savedFoods: savedRes.data,
        recipes: recipesRes.data,
      };
    },
  });

  const fetchData = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['foodLists'] });
  };

  const deleteSavedFood = async (id: number | string) => {
    if (!confirm('¿Borrar este alimento?')) return;
    try {
      await api.delete(`/nutrition/my-foods/${id}`);
      toast.success('Eliminado');
      fetchData();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const deleteRecipe = async (id: number | string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta receta?')) return;
    try {
      await api.delete(`/nutrition/recipes/${id}`);
      toast.success('Eliminada');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
      console.error(err);
    }
  };

  const deleteFoodsBulk = async (selectedIds: Set<number>) => {
    if (!confirm(`¿Borrar los ${selectedIds.size} alimentos seleccionados?`)) return false;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => api.delete(`/nutrition/my-foods/${id}`)),
      );
      toast.success(`${selectedIds.size} alimentos eliminados`);
      fetchData();
      return true;
    } catch {
      toast.error('Error al borrar alimentos');
      return false;
    }
  };

  const { recentFoods, savedFoods, recipes } = data;

  return {
    recentFoods,
    savedFoods,
    recipes,
    isLoading,
    fetchData,
    deleteSavedFood,
    deleteRecipe,
    deleteFoodsBulk,
  };
}
