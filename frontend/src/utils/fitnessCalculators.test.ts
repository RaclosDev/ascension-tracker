import { describe, it, expect } from 'vitest';
import { calculateWeyandSteps, calculateWeyandMetabolic } from './fitnessCalculators';

describe('fitnessCalculators - Weyand Biomechanics', () => {
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
