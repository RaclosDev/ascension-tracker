/** Funciones puras de gasto energético biomecánico (modelo de Weyand). */

export interface WeyandStepsParams {
  weightKg: number;
  steps: number;
}

export function calculateWeyandSteps(params: WeyandStepsParams): number {
  const { weightKg, steps } = params;
  if (weightKg <= 0 || steps <= 0) return 0;
  const energyJ = 2.74 * weightKg * (steps / 2);
  return energyJ / 4184;
}

export interface WeyandMetabolicParams {
  weightKg: number;
  heightM: number;
  distanceM: number;
  totalSeconds: number;
}

export interface WeyandMetabolicResult {
  kcal: number;
  vo2: number;
  speedMps: number;
}

export function calculateWeyandMetabolic(params: WeyandMetabolicParams): WeyandMetabolicResult {
  const { weightKg, heightM, distanceM, totalSeconds } = params;
  if (weightKg <= 0 || heightM <= 0 || distanceM <= 0 || totalSeconds <= 0) {
    return { kcal: 0, vo2: 0, speedMps: 0 };
  }

  const v = distanceM / totalSeconds;
  const vo2 = 7.35 + (5.97 * (v * v)) / heightM;
  const o2PerMin = (vo2 * weightKg) / 1000;
  const kcalPerMin = o2PerMin * 5;
  const totalKcal = kcalPerMin * (totalSeconds / 60);

  return {
    kcal: totalKcal,
    vo2,
    speedMps: v,
  };
}
