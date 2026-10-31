import { expect, it } from 'vitest';
import { extractPortions, getSanitizedKcal } from './portionHelper';
it('ignores invalid nutrient numbers', () => {
  expect(getSanitizedKcal({ 'energy-kcal_100g': Infinity })).toBe(0);
  expect(getSanitizedKcal({ 'energy-kcal_100g': 'bad', proteins_100g: 10 })).toBe(40);
  expect(getSanitizedKcal({ 'energy-kcal_100g': -50 })).toBe(0);
});
it('never labels a liquid volume as grams', () => {
  expect(extractPortions({ product_quantity: 500, product_quantity_unit: 'ml' })).toEqual([]);
  expect(extractPortions({ product_quantity: Infinity, product_quantity_unit: 'g' })).toEqual([]);
  expect(
    extractPortions({ quantity: '4 x 125 g', product_quantity: 500, product_quantity_unit: 'g' }),
  ).toEqual([
    { label: '1 ud (125g)', amount: 125 },
    { label: 'Envase total (500g)', amount: 500 },
  ]);
});
