import { useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { SavedFood } from '../../types/api';
import { getLocalDateString } from '../../utils/dateHelper';

export function useMealSelection(savedFoods: SavedFood[]) {
  const queryClient = useQueryClient();
  const addingRef = useRef(false);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [isMealSelectorOpen, setIsMealSelectorOpen] = useState(false);
  const [mealSelectorDate, setMealSelectorDate] = useState(getLocalDateString());
  const [bulkQuantities, setBulkQuantities] = useState<Record<number, number>>({});
  const [isAddingToMeal, setIsAddingToMeal] = useState(false);

  const toggleFoodSelection = (id: number) => {
    const next = new Set(selectedFoods);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFoods(next);
  };

  const openMealSelector = () => {
    const initial: Record<number, number> = {};
    Array.from(selectedFoods).forEach((id) => {
      const food = savedFoods.find((f) => f.id === id);
      if (food) initial[id] = (food.servingSize || 0) > 0 ? food.servingSize! : 100;
    });
    setBulkQuantities(initial);
    setMealSelectorDate(getLocalDateString());
    setIsMealSelectorOpen(true);
  };

  const handleBulkAddToMeal = async (mealIndex: number, mealKey?: string) => {
    if (selectedFoods.size === 0 || addingRef.current) return;
    addingRef.current = true;
    setIsAddingToMeal(true);
    try {
      const foodsToAdd = savedFoods.filter((f) => f.id !== undefined && selectedFoods.has(f.id));
      const promises = foodsToAdd.map((food) => {
        const qty = bulkQuantities[food.id!] || 100;
        const factor = qty / 100.0;
        return api.post('/nutrition/logs', {
          date: mealSelectorDate,
          mealIndex,
          mealKey,
          product: food.name + (food.brand ? ` (${food.brand})` : ''),
          quantity: qty,
          kcal: food.kcalPer100g * factor,
          protein: food.proteinPer100g * factor,
          carbs: food.carbsPer100g * factor,
          fat: food.fatPer100g * factor,
        });
      });
      const results = await Promise.allSettled(promises);
      const failedIds = new Set<number>();
      results.forEach((result, index) => {
        if (result.status === 'rejected') failedIds.add(foodsToAdd[index].id!);
      });
      const savedCount = foodsToAdd.length - failedIds.size;
      setSelectedFoods(failedIds);
      if (savedCount > 0) {
        for (const key of [
          'nutritionData',
          'dashboard',
          'trackingWeeks',
          'foodLists',
          'myFoodsData',
        ]) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
        toast.success(`${savedCount} añadidos al diario`);
      }
      if (failedIds.size > 0)
        toast.error(`${failedIds.size} no se han guardado. Reintenta los alimentos seleccionados.`);
      else setIsMealSelectorOpen(false);
    } catch {
      toast.error('Error al añadir al diario');
    } finally {
      addingRef.current = false;
      setIsAddingToMeal(false);
    }
  };

  const clearSelection = () => setSelectedFoods(new Set());

  return {
    selectedFoods,
    setSelectedFoods,
    toggleFoodSelection,
    isMealSelectorOpen,
    setIsMealSelectorOpen,
    mealSelectorDate,
    setMealSelectorDate,
    bulkQuantities,
    setBulkQuantities,
    isAddingToMeal,
    handleBulkAddToMeal,
    openMealSelector,
    clearSelection,
  };
}
