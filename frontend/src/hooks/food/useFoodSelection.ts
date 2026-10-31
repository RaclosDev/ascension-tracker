import { useState, useEffect } from 'react';
import { extractPortions, getSanitizedKcal } from '../../utils/portionHelper';
import type { SearchProduct } from '../../components/food/FoodPortionEditor';
import type { SavedFoodExtended } from '../../components/food/FoodSearchResultsList';
import type { FoodLog } from '../../types/api';

export function useFoodSelection() {
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [inputMode, setInputMode] = useState<'grams' | 'portions'>('grams');
  useEffect(() => {
    setInputMode(selectedProduct?.portions?.length ? 'portions' : 'grams');
  }, [selectedProduct]);

  const handleSelectOff = (p: Record<string, unknown>) => {
    const name = (p.product_name || p.product_name_es || 'Producto') as string;
    const brand = p.brands ? ` - ${p.brands}` : '';
    const nut = (p.nutriments || {}) as Record<string, unknown>;

    const portions = extractPortions(p);

    setSelectedProduct({
      name: `${name}${brand}`,
      category: 'Supermercado',
      kcal: getSanitizedKcal(nut),
      protein: Number(nut['proteins_100g'] ?? nut['proteins'] ?? 0) || 0,
      carbs: Number(nut['carbohydrates_100g'] ?? nut['carbohydrates'] ?? 0) || 0,
      fat: Number(nut['fat_100g'] ?? nut['fat'] ?? 0) || 0,
      portions: portions,
    });

    if (portions.length > 0) {
      setQuantity(portions[0].amount);
    } else {
      setQuantity(100);
    }
  };

  const handleSelectRecent = (log: FoodLog) => {
    const q = Number(log.quantity) || 100;
    setSelectedProduct({
      name: log.product,
      category: 'Reciente',
      kcal: (Number(log.kcal) || 0) * (100 / q),
      protein: (Number(log.protein) || 0) * (100 / q),
      carbs: (Number(log.carbs) || 0) * (100 / q),
      fat: (Number(log.fat) || 0) * (100 / q),
    });
    setQuantity(Math.round(q));
  };

  const handleSelectSaved = (food: SavedFoodExtended & { image?: string }) => {
    let portions: Array<{ label: string; amount: number }> = [];
    if (food.servingSize && food.servingSize > 0) {
      const lbl = food.servingLabel || 'ud';
      if (lbl.toLowerCase() === 'g') {
        portions = [
          { label: '50g', amount: 50 },
          { label: '100g', amount: 100 },
          { label: '150g', amount: 150 },
          { label: '200g', amount: 200 },
          { label: '250g', amount: 250 },
        ];
      } else {
        if (food.servingSize <= 15) {
          portions = [
            { label: `1 ${lbl}`, amount: food.servingSize },
            { label: `2 ${lbl}`, amount: food.servingSize * 2 },
            { label: `3 ${lbl}`, amount: food.servingSize * 3 },
            { label: `5 ${lbl}`, amount: food.servingSize * 5 },
            { label: `10 ${lbl}`, amount: food.servingSize * 10 },
            { label: `15 ${lbl}`, amount: food.servingSize * 15 },
          ];
        } else if (food.servingSize <= 50) {
          portions = [
            { label: `1 ${lbl}`, amount: food.servingSize },
            { label: `2 ${lbl}`, amount: food.servingSize * 2 },
            { label: `3 ${lbl}`, amount: food.servingSize * 3 },
            { label: `4 ${lbl}`, amount: food.servingSize * 4 },
            { label: `5 ${lbl}`, amount: food.servingSize * 5 },
          ];
        } else {
          portions = [
            { label: `0.5 ${lbl}`, amount: food.servingSize / 2 },
            { label: `1 ${lbl}`, amount: food.servingSize },
            { label: `2 ${lbl}`, amount: food.servingSize * 2 },
            { label: `3 ${lbl}`, amount: food.servingSize * 3 },
            { label: `4 ${lbl}`, amount: food.servingSize * 4 },
          ];
        }
      }
    }

    setSelectedProduct({
      name: food.name + (food.brand && food.brand !== 'Genérico' ? ` (${food.brand})` : ''),
      category: food.brand === 'Genérico' ? 'Básico' : 'Guardado',
      kcal: food.kcalPer100g ?? food.kcal ?? 0,
      protein: food.proteinPer100g ?? food.protein ?? 0,
      carbs: food.carbsPer100g ?? food.carbs ?? 0,
      fat: food.fatPer100g ?? food.fat ?? 0,
      portions: portions,
    });

    if (food.servingSize && food.servingSize > 0) {
      setQuantity(food.servingSize);
    } else {
      setQuantity(100);
    }
  };

  return {
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    inputMode,
    setInputMode,
    handleSelectOff,
    handleSelectRecent,
    handleSelectSaved,
  };
}
