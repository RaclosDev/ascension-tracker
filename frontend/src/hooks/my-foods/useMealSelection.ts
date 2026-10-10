import { useState } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { PageFoodItem } from '../../types/myfoods';

const getLocalISODate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export function useMealSelection(savedFoods: PageFoodItem[]) {
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [isMealSelectorOpen, setIsMealSelectorOpen] = useState(false);
  const [mealSelectorDate, setMealSelectorDate] = useState(getLocalISODate());
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
    setMealSelectorDate(getLocalISODate());
    setIsMealSelectorOpen(true);
  };

  const handleBulkAddToMeal = async (mealIndex: number) => {
    if (selectedFoods.size === 0) return;
    setIsAddingToMeal(true);
    try {
      const foodsToAdd = savedFoods.filter((f) => f.id !== undefined && selectedFoods.has(f.id));
      const promises = foodsToAdd.map((food) => {
        const qty = bulkQuantities[food.id!] || 100;
        const factor = qty / 100.0;
        return api.post('/nutrition/logs', {
          date: mealSelectorDate,
          mealIndex,
          product: food.name + (food.brand ? ` (${food.brand})` : ''),
          quantity: qty,
          kcal: food.kcalPer100g * factor,
          protein: food.proteinPer100g * factor,
          carbs: food.carbsPer100g * factor,
          fat: food.fatPer100g * factor,
        });
      });
      await Promise.all(promises);
      toast.success(`${selectedFoods.size} añadidos al diario`);
      setSelectedFoods(new Set());
      setIsMealSelectorOpen(false);
    } catch {
      toast.error('Error al añadir al diario');
    } finally {
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
