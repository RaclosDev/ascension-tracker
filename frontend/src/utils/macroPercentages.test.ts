import { expect, it } from 'vitest';
import { macroPercentagesError } from './macroPercentages';

it('accepts a split that adds up to 100 % within half a point', () => {
  expect(macroPercentagesError(30, 30, 40)).toBeNull();
  expect(macroPercentagesError(30, 30, 40.5)).toBeNull();
  expect(macroPercentagesError(30, 30, 39.5)).toBeNull();
});

it('rejects a split the server would answer with a 400', () => {
  expect(macroPercentagesError(30, 30, 41)).toBe(
    'El reparto de macros debe sumar 100 % (ahora suma 101 %)',
  );
  expect(macroPercentagesError(30, 30, 38.9)).not.toBeNull();
});
