import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { FoodLog, Recipe, SavedFood } from '../../types/api';
import { useFoodFilters } from './useFoodFilters';

const food = (
  id: number,
  name: string,
  p: number,
  c: number,
  f: number,
  brand?: string,
): SavedFood => ({
  id,
  name,
  brand,
  kcalPer100g: 100,
  proteinPer100g: p,
  carbsPer100g: c,
  fatPer100g: f,
});

const saved = [
  food(1, 'Pechuga', 30, 0, 2, 'Granja'),
  food(2, 'Arroz', 7, 78, 1),
  food(3, 'Aceite', 0, 0, 100, 'Oliva Sur'),
];
const recent: FoodLog[] = [
  {
    date: '2026-11-06',
    mealIndex: 0,
    product: 'Arroz con leche',
    quantity: 100,
    kcal: 120,
    protein: 3,
    carbs: 20,
    fat: 3,
  },
  {
    date: '2026-11-06',
    mealIndex: 1,
    product: 'Pan',
    quantity: 50,
    kcal: 130,
    protein: 4,
    carbs: 25,
    fat: 1,
  },
];
const recipes: Recipe[] = [
  {
    name: 'Bowl',
    description: 'arroz y pollo',
    totalKcal: 500,
    totalProtein: 40,
    totalCarbs: 50,
    totalFat: 10,
  },
  { name: 'Tostada', totalKcal: 200, totalProtein: 6, totalCarbs: 30, totalFat: 5 },
];

describe('useFoodFilters', () => {
  it('shows everything newest first by default', () => {
    const { result } = renderHook(() => useFoodFilters(recent, saved, recipes));

    expect(result.current.filteredFoods.map((f) => f.id)).toEqual([3, 2, 1]);
    expect(result.current.totalResults).toBe(7);
  });

  it('searches names, brands, recent products and recipe descriptions ignoring case', () => {
    const { result } = renderHook(() => useFoodFilters(recent, saved, recipes));

    act(() => result.current.setSearchQuery('  ARROZ '));
    expect(result.current.filteredFoods.map((f) => f.name)).toEqual(['Arroz']);
    expect(result.current.filteredRecent.map((f) => f.product)).toEqual(['Arroz con leche']);
    expect(result.current.filteredRecipes.map((r) => r.name)).toEqual(['Bowl']);

    act(() => result.current.setSearchQuery('sur'));
    expect(result.current.filteredFoods.map((f) => f.name)).toEqual(['Aceite']);
  });

  it('filters by the predominant macro and sorts by name', () => {
    const { result } = renderHook(() => useFoodFilters(recent, saved, recipes));

    act(() => result.current.setMacroFilter('carbs'));
    expect(result.current.filteredFoods.map((f) => f.name)).toEqual(['Arroz']);

    act(() => {
      result.current.setMacroFilter('all');
      result.current.setSortBy('name_asc');
    });
    expect(result.current.filteredFoods.map((f) => f.name)).toEqual(['Aceite', 'Arroz', 'Pechuga']);
  });
});
