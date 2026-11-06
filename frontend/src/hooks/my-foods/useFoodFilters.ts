import { useState, useMemo } from 'react';
import { Recipe, FoodLog, SavedFood } from '../../types/api';

export function useFoodFilters(recentFoods: FoodLog[], savedFoods: SavedFood[], recipes: Recipe[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [macroFilter, setMacroFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');

  const q = searchQuery.toLowerCase().trim();

  const getPredominantMacro = (f: SavedFood) => {
    const p = f.proteinPer100g || 0;
    const c = f.carbsPer100g || 0;
    const fat = f.fatPer100g || 0;
    if (p >= c && p >= fat) return 'protein';
    if (c >= p && c >= fat) return 'carbs';
    return 'fat';
  };

  const filteredRecent = useMemo(() => {
    return recentFoods.filter((f) => {
      if (!q) return true;
      return (f.product || '').toLowerCase().includes(q);
    });
  }, [recentFoods, q]);

  const filteredFoods = useMemo(() => {
    return savedFoods
      .filter((f: SavedFood) => {
        if (q) {
          const nameMatch = (f.name || '').toLowerCase().includes(q);
          const brandMatch = (f.brand || '').toLowerCase().includes(q);
          if (!nameMatch && !brandMatch) return false;
        }
        if (macroFilter !== 'all' && getPredominantMacro(f) !== macroFilter) return false;
        return true;
      })
      .sort((a: SavedFood, b: SavedFood) => {
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'recent') {
          if (a.id && b.id) {
            if (typeof a.id === 'number' && typeof b.id === 'number') return b.id - a.id;
            return String(b.id).localeCompare(String(a.id));
          }
          return 0;
        }
        return 0;
      });
  }, [savedFoods, q, macroFilter, sortBy]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r: Recipe) => {
      if (!q) return true;
      const nameMatch = (r.name || '').toLowerCase().includes(q);
      const descMatch = (r.description || '').toLowerCase().includes(q);
      return nameMatch || descMatch;
    });
  }, [recipes, q]);

  return {
    searchQuery,
    setSearchQuery,
    macroFilter,
    setMacroFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    filteredRecent,
    filteredFoods,
    filteredRecipes,
    totalResults: filteredRecent.length + filteredFoods.length + filteredRecipes.length,
  };
}
