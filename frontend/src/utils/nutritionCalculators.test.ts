import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  calcBmr,
  calcTdee,
  calcBodyFatNavy,
  calcBodyComposition,
} from './nutritionCalculators';

describe('nutritionCalculators', () => {
  it('parseNumber', () => {
    expect(parseNumber('10.5')).toBe(10.5);
    expect(parseNumber('10,5')).toBe(10.5);
    expect(parseNumber(10)).toBe(10);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });

  it('calcBmr and calcTdee', () => {
    // Man: 30yo, 180cm, 80kg => 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calcBmr('M', 80, 180, 30)).toBe(1780);
    // Woman: 30yo, 180cm, 80kg => 10*80 + 6.25*180 - 5*30 - 161 = 800 + 1125 - 150 - 161 = 1614
    expect(calcBmr('F', 80, 180, 30)).toBe(1614);

    expect(calcTdee(1780, 1.55)).toBeCloseTo(2759);

    // out of bounds
    expect(calcBmr('M', 10, 180, 30)).toBeNull(); // weight too low
    expect(calcBmr('M', 80, 100, 30)).toBeNull(); // height too low
    expect(calcBmr('M', 80, 180, 5)).toBeNull(); // age too low
  });

  it('calcBodyFatNavy', () => {
    const bfM = calcBodyFatNavy({ sex: 'M', heightCm: 180, waistCm: 85, neckCm: 38 });
    expect(bfM).toBeCloseTo(16.1, 1);

    const bfF = calcBodyFatNavy({ sex: 'F', heightCm: 165, waistCm: 75, neckCm: 32, hipCm: 98 });
    expect(bfF).toBeCloseTo(28.9, 1);

    expect(calcBodyFatNavy({ sex: 'M', heightCm: 180, waistCm: 30, neckCm: 38 })).toBeNull(); // waist <= neck
  });

  it('calcBodyComposition', () => {
    const { fatKg, leanKg } = calcBodyComposition(80, 20);
    expect(fatKg).toBe(16);
    expect(leanKg).toBe(64);
  });
});
