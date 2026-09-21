export const KCAL_PER_KG_FAT = 7700;

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario (poco o ningún ejercicio)' },
  { value: 1.375, label: 'Ligero (ejercicio ligero 1-3 días/semana)' },
  { value: 1.55, label: 'Moderado (ejercicio moderado 3-5 días/semana)' },
  { value: 1.725, label: 'Alto (ejercicio fuerte 6-7 días/semana)' },
  { value: 1.9, label: 'Muy Alto (ejercicio muy fuerte o trabajo físico)' }
];

export const getActivityFactor = (factor?: number): number => {
  if (!factor) return 1.2;
  const valid = ACTIVITY_LEVELS.find(l => l.value === factor);
  return valid ? valid.value : 1.2;
};

export const parseNumber = (val: string | number | undefined | null): number | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  const str = val.replace(',', '.');
  const num = parseFloat(str);
  return isFinite(num) ? num : null;
};

export const calcBmr = (sex: 'M' | 'F', weightKg: number, heightCm: number, age: number): number | null => {
  if (weightKg < 30 || weightKg > 300) return null;
  if (heightCm < 120 || heightCm > 230) return null;
  if (age < 14 || age > 100) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'M' ? base + 5 : base - 161;
};

export const calcTdee = (bmr: number, factor: number): number => {
  return bmr * factor;
};

export const simpleDailyDeficit = (currentWeight: number, goalWeight: number, days: number): number | null => {
  if (goalWeight >= currentWeight || days <= 0) return null;
  return ((currentWeight - goalWeight) * KCAL_PER_KG_FAT) / days;
};

export const weeklyGoalToDailyDeficit = (kgPerWeek: number): number => {
  return (kgPerWeek * KCAL_PER_KG_FAT) / 7;
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
  let { sex, age, heightCm, weightKg, activityFactor, intakeKcal, weeks } = params;
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 104) return null;

  const results: SimResult[] = [];
  for (let w = 0; w <= weeks; w++) {
    const bmr = calcBmr(sex, weightKg, heightCm, age);
    if (bmr === null) return null; // out of valid ranges
    const tdee = calcTdee(bmr, activityFactor);
    
    results.push({ week: w, weightKg, tdee });
    
    if (w < weeks) {
      // Weight change over 1 week (7 days)
      const dailyDeficit = tdee - intakeKcal; // positive means losing weight
      const kgLost = (dailyDeficit * 7) / KCAL_PER_KG_FAT;
      weightKg -= kgLost;
    }
  }
  return results;
};

export const findIntakeForGoal = (
  sex: 'M' | 'F',
  age: number,
  heightCm: number,
  startWeight: number,
  goalWeight: number,
  activityFactor: number,
  weeks: number
): number | null => {
  if (goalWeight >= startWeight) return null;
  const initialBmr = calcBmr(sex, startWeight, heightCm, age);
  if (initialBmr === null) return null;
  const initialTdee = calcTdee(initialBmr, activityFactor);

  let low = 0;
  let high = initialTdee;
  let bestIntake: number | null = null;

  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const sim = simulateWeightChange({ sex, age, heightCm, weightKg: startWeight, activityFactor, intakeKcal: mid, weeks });
    
    if (!sim) return null; 
    
    const finalWeight = sim[sim.length - 1].weightKg;
    
    if (finalWeight < goalWeight) {
      // Ate too little, weight is lower than goal
      low = mid;
    } else {
      // Ate too much, weight is higher than goal
      high = mid;
    }
    bestIntake = mid;
  }

  // Double check if reachable even with 0 kcal
  const minSim = simulateWeightChange({ sex, age, heightCm, weightKg: startWeight, activityFactor, intakeKcal: 0, weeks });
  if (minSim && minSim[minSim.length - 1].weightKg > goalWeight + 0.1) {
    return null; // Unreachable even fasting
  }

  return bestIntake;
};

export interface PlanWarning {
  code: string;
  level: 'warning' | 'danger';
  message: string;
}

export const assessPlan = (
  startWeight: number,
  weeklyRateKg: number,
  initialDeficit: number,
  initialTdee: number,
  intakeKcal: number,
  bmr: number
): PlanWarning[] => {
  const warnings: PlanWarning[] = [];
  
  const ratePct = (weeklyRateKg / startWeight) * 100;
  if (ratePct > 1.5) {
    warnings.push({ code: 'RATE_VERY_HIGH', level: 'danger', message: 'Ritmo de pérdida superior al 1.5% semanal. Riesgo de pérdida muscular y problemas metabólicos.' });
  } else if (ratePct > 1) {
    warnings.push({ code: 'RATE_HIGH', level: 'warning', message: 'Ritmo de pérdida superior al 1% semanal. Recomendado solo para obesidad severa.' });
  }

  const deficitPct = (initialDeficit / initialTdee) * 100;
  if (deficitPct > 35) {
    warnings.push({ code: 'DEFICIT_VERY_HIGH', level: 'danger', message: 'Déficit superior al 35% de tu mantenimiento. Difícil de adherir y poco saludable a medio plazo.' });
  } else if (deficitPct > 25) {
    warnings.push({ code: 'DEFICIT_HIGH', level: 'warning', message: 'Déficit superior al 25%. Podrías experimentar fatiga y pérdida de fuerza.' });
  }

  if (intakeKcal < bmr) {
    warnings.push({ code: 'BELOW_BMR', level: 'danger', message: 'Ingesta por debajo de tu tasa metabólica basal (BMR). No recomendado sin supervisión médica.' });
  }

  return warnings;
};

interface MacrosParams {
  kcal: number;
  weightKg: number;
  proteinPerKg?: number;
  fatPerKg?: number;
}

export const calcMacros = ({ kcal, weightKg, proteinPerKg = 2, fatPerKg = 0.75 }: MacrosParams) => {
  const proteinG = weightKg * proteinPerKg;
  const fatG = weightKg * fatPerKg;
  
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  
  const remainingKcal = kcal - proteinKcal - fatKcal;
  const carbsKcal = Math.max(0, remainingKcal);
  const carbsG = carbsKcal / 4;
  
  const totalAllocatedKcal = proteinKcal + fatKcal + carbsKcal;
  const overBudgetKcal = (proteinKcal + fatKcal > kcal) ? (proteinKcal + fatKcal - kcal) : 0;

  return {
    proteinG,
    fatG,
    carbsG,
    proteinPct: (proteinKcal / totalAllocatedKcal) * 100,
    fatPct: (fatKcal / totalAllocatedKcal) * 100,
    carbsPct: (carbsKcal / totalAllocatedKcal) * 100,
    overBudgetKcal
  };
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
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
    if (bf < 2 || bf > 60) return null;
    return bf;
  } else {
    if (!hipCm) return null;
    if (waistCm + hipCm - neckCm <= 0) return null;
    const bf = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
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
