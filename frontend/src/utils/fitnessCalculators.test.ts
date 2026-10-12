import { describe, it, expect } from 'vitest';
import {
  calcEpley,
  calcBrzycki,
  calcLombardi,
  calcOConner,
  calcAverage1RM,
  calculateOneRepMax,
  roundToStep,
  calculatePlateLoader,
  IWF_PLATES,
  calculateBmr,
  calculateTdee,
  calculateWeyandSteps,
  calculateWeyandMetabolic,
  calculateMacroDistribution,
  kgToLbs,
  lbsToKg,
  kgToStoneLbs,
  stoneLbsToKg,
  cmToInches,
  inchesToCm,
  cmToFeetInches,
  feetInchesToCm,
  kmToMiles,
  milesToKm,
  paceKmToPaceMiles,
  paceMilesToPaceKm,
  paceToSpeedKmh,
  speedKmhToPace,
  formatPace,
  parsePace,
} from './fitnessCalculators';

describe('fitnessCalculators - 1RM & Strength', () => {
  it('returns the same weight when reps === 1 for all formulas', () => {
    const weight = 100;
    expect(calcEpley(weight, 1)).toBe(100);
    expect(calcBrzycki(weight, 1)).toBe(100);
    expect(calcLombardi(weight, 1)).toBe(100);
    expect(calcOConner(weight, 1)).toBe(100);
    expect(calcAverage1RM(weight, 1)).toBe(100);
  });

  it('calculates Epley correctly', () => {
    // 100 * (1 + 10 / 30) = 133.333...
    expect(calcEpley(100, 10)).toBeCloseTo(133.33, 2);
  });

  it('calculates Brzycki correctly', () => {
    // 100 * (36 / (37 - 10)) = 100 * (36 / 27) = 133.333...
    expect(calcBrzycki(100, 10)).toBeCloseTo(133.33, 2);
  });

  it('handles Brzycki boundary safely when reps >= 37', () => {
    expect(calcBrzycki(100, 37)).toBe(0);
    expect(calcBrzycki(100, 40)).toBe(0);
  });

  it('calculates Lombardi and OConner correctly', () => {
    // Lombardi: 100 * 10^0.1 = 125.8925
    expect(calcLombardi(100, 10)).toBeCloseTo(125.89, 2);
    // OConner: 100 * (1 + 0.025 * 10) = 125
    expect(calcOConner(100, 10)).toBe(125);
  });

  it('handles negative or zero weight/reps gracefully', () => {
    expect(calcEpley(-10, 5)).toBe(0);
    expect(calcEpley(100, 0)).toBe(0);
    expect(calcBrzycki(0, 5)).toBe(0);
    expect(calcAverage1RM(-5, -2)).toBe(0);
  });

  it('roundToStep rounds correctly', () => {
    expect(roundToStep(102.3, 0.5)).toBe(102.5);
    expect(roundToStep(102.2, 0.5)).toBe(102.0);
    expect(roundToStep(101.4, 2.5)).toBe(102.5);
    expect(roundToStep(100.8, 1)).toBe(101);
  });

  it('calculateOneRepMax returns all formulas and percentage breakdown', () => {
    const res = calculateOneRepMax({ weight: 100, reps: 5, formula: 'average', roundStep: 0.5 });
    expect(res.oneRepMax).toBeGreaterThan(100);
    expect(res.formulaResults.epley).toBeGreaterThan(0);
    expect(res.formulaResults.brzycki).toBeGreaterThan(0);
    expect(res.percentages.length).toBe(10);
    expect(res.percentages[0].percentage).toBe(100);
    expect(res.percentages[0].weight).toBe(res.oneRepMax);
  });
});

describe('fitnessCalculators - Barbell Plate Loader', () => {
  it('calculates standard 100kg load on a 20kg bar', () => {
    // 100kg total - 20kg bar = 80kg plates -> 40kg per side (1x25kg + 1x15kg)
    const res = calculatePlateLoader({ targetWeight: 100, barWeight: 20 });
    expect(res.isExact).toBe(true);
    expect(res.weightPerSide).toBe(40);
    expect(res.totalPlatesWeight).toBe(80);
    expect(res.actualTotalWeight).toBe(100);
    expect(res.difference).toBe(0);

    const p25 = res.platesPerSide.find((p) => p.plate.weight === 25);
    const p15 = res.platesPerSide.find((p) => p.plate.weight === 15);
    expect(p25?.countPerSide).toBe(1);
    expect(p15?.countPerSide).toBe(1);
  });

  it('accounts for collars weight', () => {
    // Target 105kg, 20kg bar, 2.5kg collars each side (5kg total) -> 80kg plates -> 40kg/side
    const res = calculatePlateLoader({
      targetWeight: 105,
      barWeight: 20,
      collarsWeight: 2.5,
    });
    expect(res.isExact).toBe(true);
    expect(res.actualTotalWeight).toBe(105);
    expect(res.totalPlatesWeight).toBe(80);
    expect(res.weightPerSide).toBe(40);
  });

  it('detects when an exact weight cannot be loaded with available plates', () => {
    // Only big plates available: [20, 10]
    const res = calculatePlateLoader({
      targetWeight: 75,
      barWeight: 20,
      availablePlateWeights: [20, 10],
    });
    // 55kg needed -> 27.5kg per side. Can load 20kg -> 20kg/side = 40kg. Total 60kg.
    expect(res.isExact).toBe(false);
    expect(res.difference).not.toBe(0);
    expect(res.actualTotalWeight).toBe(60);
  });

  it('handles target weight <= bar weight', () => {
    const res = calculatePlateLoader({ targetWeight: 20, barWeight: 20 });
    expect(res.platesPerSide.length).toBe(0);
    expect(res.actualTotalWeight).toBe(20);
    expect(res.isExact).toBe(true);

    const under = calculatePlateLoader({ targetWeight: 15, barWeight: 20 });
    expect(under.platesPerSide.length).toBe(0);
    expect(under.isExact).toBe(false);
  });

  it('supports LBS plates correctly', () => {
    // Target 225 lbs on 45 lbs bar -> 180 lbs plates -> 90 lbs per side -> 2x 45 lbs plates
    const res = calculatePlateLoader({
      targetWeight: 225,
      barWeight: 45,
      unit: 'lbs',
    });
    expect(res.isExact).toBe(true);
    expect(res.weightPerSide).toBe(90);
    expect(res.platesPerSide[0].plate.weight).toBe(45);
    expect(res.platesPerSide[0].countPerSide).toBe(2);
  });

  it('exports standard IWF plate definitions with proper colors', () => {
    expect(IWF_PLATES.length).toBe(8);
    const red = IWF_PLATES.find((p) => p.weight === 25);
    expect(red?.color).toBe('#EF4444');
    const blue = IWF_PLATES.find((p) => p.weight === 20);
    expect(blue?.color).toBe('#3B82F6');
  });
});

describe('fitnessCalculators - TDEE, BMR & Weyand Biomechanics', () => {
  it('calculates Mifflin-St Jeor for males and females correctly', () => {
    // Male: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const male = calculateBmr({ sex: 'M', weightKg: 80, heightCm: 180, age: 30 });
    expect(male.bmr).toBe(1780);

    // Female: 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    const female = calculateBmr({ sex: 'F', weightKg: 60, heightCm: 165, age: 25 });
    expect(female.bmr).toBe(1345);
  });

  it('calculates Katch-McArdle using body fat percentage', () => {
    // 80kg with 15% fat -> LBM = 68kg -> 370 + 21.6 * 68 = 1838.8 -> 1839
    const katch = calculateBmr({
      sex: 'M',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      bodyFatPercentage: 15,
      formula: 'katch',
    });
    expect(katch.bmr).toBe(1839);
    expect(katch.formulaUsed).toBe('katch');
  });

  it('calculates TDEE and all caloric goal targets', () => {
    const tdeeRes = calculateTdee({
      sex: 'M',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      activityFactor: 1.55,
    });
    expect(tdeeRes.bmr).toBe(1780);
    expect(tdeeRes.tdee).toBe(Math.round(1780 * 1.55));
    expect(tdeeRes.goals.maintenance.kcal).toBe(tdeeRes.tdee);
    expect(tdeeRes.goals.moderate_deficit.kcal).toBeLessThan(tdeeRes.tdee);
    expect(tdeeRes.goals.lean_bulk.kcal).toBeGreaterThan(tdeeRes.tdee);
  });

  it('replicates Weyand steps calculation identically to legacy code', () => {
    // 80.5 kg, 10000 steps -> 2.74 * 80.5 * 5000 / 4184
    const res = calculateWeyandSteps({ weightKg: 80.5, steps: 10000 });
    const legacy = (2.74 * 80.5 * (10000 / 2)) / 4184;
    expect(res).toBeCloseTo(legacy, 5);
  });

  it('replicates Weyand metabolic calculation identically to legacy code', () => {
    const params = {
      weightKg: 80.5,
      heightM: 1.73,
      distanceM: 400,
      totalSeconds: 120,
    };
    const res = calculateWeyandMetabolic(params);

    const v = 400 / 120;
    const vo2 = 7.35 + (5.97 * (v * v)) / 1.73;
    const o2PerMin = (vo2 * 80.5) / 1000;
    const kcalPerMin = o2PerMin * 5;
    const totalKcal = kcalPerMin * (120 / 60);

    expect(res.kcal).toBeCloseTo(totalKcal, 5);
    expect(res.vo2).toBeCloseTo(vo2, 5);
    expect(res.speedMps).toBeCloseTo(v, 5);
  });
});

describe('fitnessCalculators - Macro Distribution', () => {
  it('calculates macros based on bodyweight recommendations', () => {
    const res = calculateMacroDistribution({
      strategy: 'bodyweight',
      targetKcal: 2500,
      weightKg: 80,
      proteinGPerKg: 2.0, // 160g = 640 kcal
      fatGPerKg: 1.0, // 80g = 720 kcal
      mealsCount: 4,
    });

    expect(res.protein.grams).toBe(160);
    expect(res.fat.grams).toBe(80);
    // Remaining: 2500 - 1360 = 1140 kcal / 4 = 285g carbs
    expect(res.carbs.grams).toBe(285);
    expect(res.perMeal?.mealCount).toBe(4);
    expect(res.perMeal?.proteinGrams).toBe(40);
    expect(res.perMeal?.fatGrams).toBe(20);
  });

  it('calculates macros based on percentages', () => {
    const res = calculateMacroDistribution({
      strategy: 'percentage',
      targetKcal: 2000,
      proteinPercent: 30, // 600 kcal -> 150g
      carbsPercent: 40, // 800 kcal -> 200g
      fatPercent: 30, // 600 kcal -> 67g (66.66)
    });

    expect(res.protein.grams).toBe(150);
    expect(res.carbs.grams).toBe(200);
    expect(res.fat.grams).toBe(67);
  });

  it('warns when protein and fats exceed target calories in bodyweight mode', () => {
    const res = calculateMacroDistribution({
      strategy: 'bodyweight',
      targetKcal: 1000,
      weightKg: 100,
      proteinGPerKg: 2.5, // 250g = 1000 kcal
      fatGPerKg: 1.5, // 150g = 1350 kcal -> Total 2350 kcal > 1000
    });

    expect(res.warnings).toBeDefined();
    expect(res.warnings?.length).toBeGreaterThan(0);
    expect(res.carbs.grams).toBe(0);
  });
});

describe('fitnessCalculators - Unit Converter', () => {
  it('converts kg and lbs bidirectionally', () => {
    expect(kgToLbs(100)).toBeCloseTo(220.46, 2);
    expect(lbsToKg(220.46)).toBeCloseTo(100, 1);
  });

  it('converts stones and lbs to/from kg', () => {
    const stLbs = kgToStoneLbs(70);
    expect(stLbs.stones).toBe(11);
    const roundTrip = stoneLbsToKg(stLbs.stones, stLbs.pounds);
    expect(roundTrip).toBeCloseTo(70, 0.5);
  });

  it('converts cm and inches/feet bidirectionally', () => {
    expect(cmToInches(2.54)).toBe(1);
    expect(inchesToCm(1)).toBe(2.54);

    const ftIn = cmToFeetInches(180);
    expect(ftIn.feet).toBe(5);
    expect(ftIn.inches).toBe(10.9);
    expect(feetInchesToCm(5, 10.9)).toBeCloseTo(180.09, 1);
  });

  it('converts km and miles bidirectionally', () => {
    expect(kmToMiles(10)).toBeCloseTo(6.21, 2);
    expect(milesToKm(6.21371)).toBeCloseTo(10, 1);
  });

  it('converts pace and speed', () => {
    // 5 min/km -> 12 km/h
    expect(paceToSpeedKmh(5)).toBe(12);
    expect(speedKmhToPace(12)).toBe(5);

    // 5 min/km to pace/mi: 5 * 1.609344 = 8.05 min/mi
    expect(paceKmToPaceMiles(5)).toBeCloseTo(8.05, 2);
    expect(paceMilesToPaceKm(8.04672)).toBeCloseTo(5, 2);

    expect(formatPace(5.5)).toBe('5:30');
    expect(parsePace(5, 30)).toBe(5.5);
  });
});
