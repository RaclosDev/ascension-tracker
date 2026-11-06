export const KCAL_PER_KG_FAT = 7700;

export const parseNumber = (val: string | number | undefined | null): number | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  const str = val.replace(',', '.');
  const num = parseFloat(str);
  return isFinite(num) ? num : null;
};

export const calcBmr = (
  sex: 'M' | 'F',
  weightKg: number,
  heightCm: number,
  age: number,
): number | null => {
  if (weightKg < 30 || weightKg > 300) return null;
  if (heightCm < 120 || heightCm > 230) return null;
  if (age < 14 || age > 100) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'M' ? base + 5 : base - 161;
};

export const calcTdee = (bmr: number, factor: number): number => {
  return bmr * factor;
};

interface SimParams {
  sex: 'M' | 'F';
  age: number;
  heightCm: number;
  weightKg: number;
  activityFactor: number;
  intakeKcal: number;
  weeks: number;
}

interface SimResult {
  week: number;
  weightKg: number;
  tdee: number;
}

export const simulateWeightChange = (params: SimParams): SimResult[] | null => {
  let { weightKg } = params;
  const { sex, age, heightCm, activityFactor, intakeKcal, weeks } = params;
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 104) return null;

  const results: SimResult[] = [];
  for (let w = 0; w <= weeks; w++) {
    const bmr = calcBmr(sex, weightKg, heightCm, age);
    if (bmr === null) return null; // out of valid ranges
    const tdee = calcTdee(bmr, activityFactor);

    results.push({ week: w, weightKg, tdee });

    if (w < weeks) {
      const dailyDeficit = tdee - intakeKcal; // positive means losing weight
      const kgLost = (dailyDeficit * 7) / KCAL_PER_KG_FAT;
      weightKg -= kgLost;
    }
  }
  return results;
};

interface NavyParams {
  sex: 'M' | 'F';
  heightCm: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number;
}

export const calcBodyFatNavy = (params: NavyParams): number | null => {
  const { sex, heightCm, waistCm, neckCm, hipCm } = params;
  if (!heightCm || !waistCm || !neckCm) return null;

  if (sex === 'M') {
    if (waistCm - neckCm <= 0) return null;
    const bf =
      495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) -
      450;
    if (bf < 2 || bf > 60) return null;
    return bf;
  } else {
    if (!hipCm) return null;
    if (waistCm + hipCm - neckCm <= 0) return null;
    const bf =
      495 /
        (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) -
      450;
    if (bf < 2 || bf > 60) return null;
    return bf;
  }
};

export const calcBodyComposition = (weightKg: number, bfPct: number) => {
  const fatKg = weightKg * (bfPct / 100);
  const leanKg = weightKg - fatKg;
  return { fatKg, leanKg };
};

/** Weyand biomechanics: energy per step impact */
export const calcStepsKcal = (weightKg: number, steps: number): number => {
  if (weightKg <= 0 || steps <= 0) return 0;
  const energyJ = 2.74 * weightKg * (steps / 2);
  return energyJ / 4184;
};

/** Reverse: how many steps to burn targetKcal */
export const calcStepsFromKcal = (weightKg: number, targetKcal: number): number => {
  if (weightKg <= 0 || targetKcal <= 0) return 0;
  return (targetKcal * 4184 * 2) / (2.74 * weightKg);
};
