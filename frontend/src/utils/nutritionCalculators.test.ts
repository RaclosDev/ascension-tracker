import { describe, it, expect } from 'vitest';
import {
  parseNumber,
  calcBmr,
  calcTdee,
  simpleDailyDeficit,
  weeklyGoalToDailyDeficit,
  simulateWeightChange,
  findIntakeForGoal,
  assessPlan,
  calcMacros,
  calcBodyFatNavy,
  calcBodyComposition
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
    expect(calcBmr('M', 80, 180, 5)).toBeNull();  // age too low
  });

  it('deficits', () => {
    expect(simpleDailyDeficit(80, 73, 90)).toBeCloseTo(598.889, 3);
    expect(simpleDailyDeficit(80, 85, 90)).toBeNull(); // goal >= current
    expect(weeklyGoalToDailyDeficit(0.5)).toBe(550);
  });

  it('simulateWeightChange', () => {
    // 500 kcal deficit -> losing exactly 500*7/7700 = 0.4545 kg first week
    const sim = simulateWeightChange({
      sex: 'M', age: 30, heightCm: 180, weightKg: 80, activityFactor: 1.55,
      intakeKcal: 2759 - 500, weeks: 2
    });
    expect(sim).toBeDefined();
    expect(sim![0].weightKg).toBe(80);
    expect(sim![1].weightKg).toBeCloseTo(80 - 0.4545, 3);
    
    // Intake = TDEE means weight stays same
    const simMaint = simulateWeightChange({
      sex: 'M', age: 30, heightCm: 180, weightKg: 80, activityFactor: 1.55,
      intakeKcal: 2759, weeks: 2
    });
    expect(simMaint![1].weightKg).toBeCloseTo(80, 1);
  });

  it('findIntakeForGoal', () => {
    const intake = findIntakeForGoal('M', 30, 180, 80, 73, 1.55, 12);
    expect(intake).not.toBeNull();
    
    const sim = simulateWeightChange({
      sex: 'M', age: 30, heightCm: 180, weightKg: 80, activityFactor: 1.55,
      intakeKcal: intake!, weeks: 12
    });
    expect(sim![12].weightKg).toBeCloseTo(73, 3);
    
    // Check initial deficit is higher than simple method due to metabolic adaptation
    const simpleDef = simpleDailyDeficit(80, 73, 12 * 7)!;
    const initialTdee = calcTdee(calcBmr('M', 80, 180, 30)!, 1.55);
    const complexDef = initialTdee - intake!;
    expect(complexDef).toBeGreaterThan(simpleDef);

    // Unreachable
    expect(findIntakeForGoal('M', 30, 180, 80, 20, 1.55, 4)).toBeNull();
  });

  it('assessPlan', () => {
    const ok = assessPlan(80, 7/13, 400, 2759, 2359, 1780);
    expect(ok).toHaveLength(0);

    const bad = assessPlan(80, 15/8, 1500, 2759, 1259, 1780); // losing ~1.875kg/w, 54% deficit, < BMR
    expect(bad.some(w => w.code === 'RATE_VERY_HIGH')).toBe(true);
    expect(bad.some(w => w.code === 'DEFICIT_VERY_HIGH')).toBe(true);
    expect(bad.some(w => w.code === 'BELOW_BMR')).toBe(true);
  });

  it('calcMacros', () => {
    // 80kg, 2100kcal. 2g P = 160g, 0.75g F = 60g
    // P=640kcal, F=540kcal -> 1180. Remaining = 920kcal -> 230g C.
    const m = calcMacros({ kcal: 2100, weightKg: 80 });
    expect(m.proteinG).toBe(160);
    expect(m.fatG).toBe(60);
    expect(m.carbsG).toBe(230);
    expect(m.overBudgetKcal).toBe(0);

    const m2 = calcMacros({ kcal: 1000, weightKg: 80 }); // overbudget
    expect(m2.carbsG).toBe(0);
    expect(m2.overBudgetKcal).toBe(180); // 1180 - 1000
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
