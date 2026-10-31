import { expect, it } from 'vitest';
import type { FoodLog } from '../types/api';
import { belongsToMeal, groupMealLogs } from './mealGroups';

const log: FoodLog = {
  date: '2026-10-31',
  mealIndex: 0,
  mealKey: 'breakfast',
  mealName: 'Desayuno',
  mealIcon: 'sun',
  product: 'Pan',
  quantity: 100,
  kcal: 200,
  protein: 8,
  carbs: 40,
  fat: 2,
};

it('keeps food with its stable meal after reordering even when the old index points elsewhere', () => {
  const meals = [
    { name: 'Cena', mealKey: 'dinner' },
    { name: 'Desayuno', mealKey: 'breakfast' },
  ];
  expect(groupMealLogs(meals, [log]).active).toEqual([[], [log]]);
  expect(belongsToMeal(log, meals[0], 0)).toBe(false);
});

it('retains deleted meal snapshots instead of assigning food to a replacement at the same index', () => {
  const groups = groupMealLogs([{ name: 'Cena', mealKey: 'dinner' }], [log]);
  expect(groups.active).toEqual([[]]);
  expect(groups.historical[0].meal).toEqual({ name: 'Desayuno', icon: 'sun' });
  expect(groups.historical[0].logs).toEqual([log]);
});

it('supports legacy index-only records and keeps unassigned records visible', () => {
  const legacy = { ...log, mealKey: null };
  const unknown = { ...legacy, mealIndex: -1, mealName: null, mealIcon: null };
  const groups = groupMealLogs([{ name: 'Actual' }], [legacy, unknown]);
  expect(groups.active).toEqual([[legacy]]);
  expect(groups.historical[0].logs).toEqual([unknown]);
});
