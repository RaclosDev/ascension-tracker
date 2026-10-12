/**
 * fitnessCalculators.ts
 * Suite modular de funciones matemáticas y biomecánicas puras para cálculo de 1RM,
 * carga de discos en barra olímpica, metabolismo basal y gasto energético,
 * reparto de macronutrientes y conversión de unidades fitness.
 */

// ==========================================
// 1. ONE REP MAX (1RM) & FUERZA
// ==========================================

export type OneRepMaxFormula = 'epley' | 'brzycki' | 'lombardi' | 'oconner' | 'average';

export interface OneRepMaxParams {
  weight: number;
  reps: number;
  formula?: OneRepMaxFormula;
  roundStep?: number;
}

export interface PercentageBreakdown {
  percentage: number;
  weight: number;
  repsEstimate: number;
  intensityZone: string;
}

export interface OneRepMaxResult {
  oneRepMax: number;
  formulaResults: {
    epley: number;
    brzycki: number;
    lombardi: number;
    oconner: number;
    average: number;
  };
  percentages: PercentageBreakdown[];
}

export function roundToStep(value: number, step?: number): number {
  if (!step || step <= 0) return Math.round(value * 100) / 100;
  return Math.round(value / step) * step;
}

export function calcEpley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function calcBrzycki(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return 0;
  return weight * (36 / (37 - reps));
}

export function calcLombardi(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * Math.pow(reps, 0.1);
}

export function calcOConner(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + 0.025 * reps);
}

export function calcAverage1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  const epley = calcEpley(weight, reps);
  const brzycki = calcBrzycki(weight, reps);
  if (brzycki <= 0) return epley;
  return (epley + brzycki) / 2;
}

const PERCENTAGE_ZONES: { percentage: number; repsEstimate: number; intensityZone: string }[] = [
  { percentage: 100, repsEstimate: 1, intensityZone: 'Fuerza Máxima (Pico)' },
  { percentage: 95, repsEstimate: 2, intensityZone: 'Fuerza Máxima' },
  { percentage: 90, repsEstimate: 3, intensityZone: 'Fuerza Máxima' },
  { percentage: 85, repsEstimate: 5, intensityZone: 'Fuerza / Hipertrofia' },
  { percentage: 80, repsEstimate: 8, intensityZone: 'Hipertrofia Estricta' },
  { percentage: 75, repsEstimate: 10, intensityZone: 'Hipertrofia' },
  { percentage: 70, repsEstimate: 12, intensityZone: 'Hipertrofia / Resistencia' },
  { percentage: 65, repsEstimate: 15, intensityZone: 'Resistencia Muscular' },
  { percentage: 60, repsEstimate: 20, intensityZone: 'Resistencia Muscular' },
  { percentage: 50, repsEstimate: 25, intensityZone: 'Potencia / Calentamiento' },
];

export function calculateOneRepMax(params: OneRepMaxParams): OneRepMaxResult {
  const { weight, reps, formula = 'average', roundStep } = params;

  if (weight <= 0 || reps <= 0) {
    return {
      oneRepMax: 0,
      formulaResults: { epley: 0, brzycki: 0, lombardi: 0, oconner: 0, average: 0 },
      percentages: PERCENTAGE_ZONES.map((z) => ({ ...z, weight: 0 })),
    };
  }

  const epley = calcEpley(weight, reps);
  const brzycki = calcBrzycki(weight, reps);
  const lombardi = calcLombardi(weight, reps);
  const oconner = calcOConner(weight, reps);
  const average = calcAverage1RM(weight, reps);

  let selectedRM: number;
  switch (formula) {
    case 'epley':
      selectedRM = epley;
      break;
    case 'brzycki':
      selectedRM = brzycki > 0 ? brzycki : epley;
      break;
    case 'lombardi':
      selectedRM = lombardi;
      break;
    case 'oconner':
      selectedRM = oconner;
      break;
    case 'average':
    default:
      selectedRM = average;
      break;
  }

  const finalRM = roundStep ? roundToStep(selectedRM, roundStep) : Math.round(selectedRM * 10) / 10;

  const percentages: PercentageBreakdown[] = PERCENTAGE_ZONES.map((zone) => {
    const rawWeight = (finalRM * zone.percentage) / 100;
    const roundedWeight = roundStep
      ? roundToStep(rawWeight, roundStep)
      : Math.round(rawWeight * 10) / 10;
    return {
      percentage: zone.percentage,
      repsEstimate: zone.repsEstimate,
      intensityZone: zone.intensityZone,
      weight: roundedWeight,
    };
  });

  return {
    oneRepMax: finalRM,
    formulaResults: {
      epley: Math.round(epley * 10) / 10,
      brzycki: Math.round(brzycki * 10) / 10,
      lombardi: Math.round(lombardi * 10) / 10,
      oconner: Math.round(oconner * 10) / 10,
      average: Math.round(average * 10) / 10,
    },
    percentages,
  };
}

// ==========================================
// 2. CARGA DE DISCOS EN BARRA (PLATE LOADER)
// ==========================================

export interface PlateDefinition {
  weight: number;
  color: string;
  label: string;
  border?: string;
  textColor?: string;
}

export interface PlateCount {
  plate: PlateDefinition;
  countPerSide: number;
  totalCount: number;
}

export interface PlateLoaderParams {
  targetWeight: number;
  barWeight: number;
  collarsWeight?: number;
  unit?: 'kg' | 'lbs';
  availablePlateWeights?: number[];
}

export interface PlateLoaderResult {
  platesPerSide: PlateCount[];
  weightPerSide: number;
  totalPlatesWeight: number;
  barWeight: number;
  collarsWeight: number;
  actualTotalWeight: number;
  difference: number;
  isExact: boolean;
}

export const IWF_PLATES: PlateDefinition[] = [
  { weight: 25, color: '#EF4444', label: '25 kg', textColor: '#FFFFFF', border: '#DC2626' },
  { weight: 20, color: '#3B82F6', label: '20 kg', textColor: '#FFFFFF', border: '#2563EB' },
  { weight: 15, color: '#EAB308', label: '15 kg', textColor: '#000000', border: '#CA8A04' },
  { weight: 10, color: '#10B981', label: '10 kg', textColor: '#FFFFFF', border: '#059669' },
  { weight: 5, color: '#F3F4F6', label: '5 kg', textColor: '#1F2937', border: '#D1D5DB' },
  { weight: 2.5, color: '#374151', label: '2.5 kg', textColor: '#FFFFFF', border: '#1F2937' },
  { weight: 1.25, color: '#9CA3AF', label: '1.25 kg', textColor: '#111827', border: '#6B7280' },
  { weight: 0.5, color: '#D1D5DB', label: '0.5 kg', textColor: '#111827', border: '#9CA3AF' },
];

export const LBS_PLATES: PlateDefinition[] = [
  { weight: 45, color: '#3B82F6', label: '45 lbs', textColor: '#FFFFFF', border: '#2563EB' },
  { weight: 35, color: '#EAB308', label: '35 lbs', textColor: '#000000', border: '#CA8A04' },
  { weight: 25, color: '#10B981', label: '25 lbs', textColor: '#FFFFFF', border: '#059669' },
  { weight: 10, color: '#F3F4F6', label: '10 lbs', textColor: '#1F2937', border: '#D1D5DB' },
  { weight: 5, color: '#374151', label: '5 lbs', textColor: '#FFFFFF', border: '#1F2937' },
  { weight: 2.5, color: '#9CA3AF', label: '2.5 lbs', textColor: '#111827', border: '#6B7280' },
];

export function calculatePlateLoader(params: PlateLoaderParams): PlateLoaderResult {
  const { targetWeight, barWeight, collarsWeight = 0, unit = 'kg', availablePlateWeights } = params;

  const basePlateList = unit === 'lbs' ? LBS_PLATES : IWF_PLATES;
  const filteredPlates = availablePlateWeights
    ? basePlateList.filter((p) => availablePlateWeights.includes(p.weight))
    : basePlateList;

  // Orden descendente por peso
  const platesSorted = [...filteredPlates].sort((a, b) => b.weight - a.weight);

  const collarsTotal = collarsWeight * 2;
  const targetPlatesTotal = targetWeight - barWeight - collarsTotal;
  const targetPerSide = targetPlatesTotal / 2;

  if (targetPerSide <= 0) {
    const actual = barWeight + (targetWeight >= barWeight + collarsTotal ? collarsTotal : 0);
    const diff = Math.round((targetWeight - actual) * 100) / 100;
    return {
      platesPerSide: [],
      weightPerSide: 0,
      totalPlatesWeight: 0,
      barWeight,
      collarsWeight: targetWeight >= barWeight + collarsTotal ? collarsWeight : 0,
      actualTotalWeight: actual,
      difference: diff,
      isExact: Math.abs(diff) < 0.001,
    };
  }

  let remaining = targetPerSide;
  const platesPerSide: PlateCount[] = [];

  for (const plate of platesSorted) {
    if (remaining < plate.weight - 0.0001) continue;
    const count = Math.floor((remaining + 0.00001) / plate.weight);
    if (count > 0) {
      platesPerSide.push({
        plate,
        countPerSide: count,
        totalCount: count * 2,
      });
      remaining = Math.round((remaining - count * plate.weight) * 1000) / 1000;
    }
  }

  const weightPerSide = platesPerSide.reduce(
    (acc, curr) => acc + curr.countPerSide * curr.plate.weight,
    0,
  );
  const totalPlatesWeight = weightPerSide * 2;
  const actualTotalWeight = Math.round((barWeight + collarsTotal + totalPlatesWeight) * 100) / 100;
  const difference = Math.round((targetWeight - actualTotalWeight) * 100) / 100;
  const isExact = Math.abs(difference) < 0.001;

  return {
    platesPerSide,
    weightPerSide: Math.round(weightPerSide * 100) / 100,
    totalPlatesWeight: Math.round(totalPlatesWeight * 100) / 100,
    barWeight,
    collarsWeight,
    actualTotalWeight,
    difference,
    isExact,
  };
}

// ==========================================
// 3. TDEE, BMR Y GASTO BIOMECÁNICO (WEYAND)
// ==========================================

export type Sex = 'M' | 'F';
export type BmrFormulaType = 'mifflin' | 'katch' | 'harris';
export type CaloricGoal =
  | 'maintenance'
  | 'mild_deficit'
  | 'moderate_deficit'
  | 'aggressive_deficit'
  | 'lean_bulk'
  | 'moderate_bulk';

export interface TdeeParams {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityFactor: number;
  bodyFatPercentage?: number;
  formula?: BmrFormulaType;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  formulaUsed: BmrFormulaType;
  goals: Record<
    CaloricGoal,
    {
      label: string;
      kcal: number;
      difference: number;
      percentage: number;
    }
  >;
}

export function calculateBmr(
  params: Pick<
    TdeeParams,
    'sex' | 'weightKg' | 'heightCm' | 'age' | 'bodyFatPercentage' | 'formula'
  >,
): { bmr: number; formulaUsed: BmrFormulaType } {
  const { sex, weightKg, heightCm, age, bodyFatPercentage, formula = 'mifflin' } = params;

  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return { bmr: 0, formulaUsed: formula };
  }

  // Katch-McArdle si se solicita o si hay % grasa
  if (
    formula === 'katch' &&
    bodyFatPercentage !== undefined &&
    bodyFatPercentage > 0 &&
    bodyFatPercentage < 70
  ) {
    const lbm = weightKg * (1 - bodyFatPercentage / 100);
    const bmr = 370 + 21.6 * lbm;
    return { bmr: Math.round(bmr), formulaUsed: 'katch' };
  }

  // Harris-Benedict revisado
  if (formula === 'harris') {
    const bmr =
      sex === 'M'
        ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
        : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
    return { bmr: Math.round(bmr), formulaUsed: 'harris' };
  }

  // Mifflin-St Jeor (Default y estándar clínico)
  const bmr =
    sex === 'M'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  return { bmr: Math.round(bmr), formulaUsed: 'mifflin' };
}

export function calculateTdee(params: TdeeParams): TdeeResult {
  const { activityFactor } = params;
  const { bmr, formulaUsed } = calculateBmr(params);
  const factor = activityFactor > 0 ? activityFactor : 1.2;
  const tdee = Math.round(bmr * factor);

  const goals: Record<
    CaloricGoal,
    { label: string; kcal: number; difference: number; percentage: number }
  > = {
    maintenance: {
      label: 'Mantenimiento (0%)',
      kcal: tdee,
      difference: 0,
      percentage: 0,
    },
    mild_deficit: {
      label: 'Déficit Ligero (-10%)',
      kcal: Math.round(tdee * 0.9),
      difference: Math.round(tdee * -0.1),
      percentage: -10,
    },
    moderate_deficit: {
      label: 'Déficit Moderado (-20%)',
      kcal: Math.round(tdee * 0.8),
      difference: Math.round(tdee * -0.2),
      percentage: -20,
    },
    aggressive_deficit: {
      label: 'Déficit Agresivo (-25%)',
      kcal: Math.round(tdee * 0.75),
      difference: Math.round(tdee * -0.25),
      percentage: -25,
    },
    lean_bulk: {
      label: 'Superávit Limpio (+10%)',
      kcal: Math.round(tdee * 1.1),
      difference: Math.round(tdee * 0.1),
      percentage: 10,
    },
    moderate_bulk: {
      label: 'Superávit Volumen (+15%)',
      kcal: Math.round(tdee * 1.15),
      difference: Math.round(tdee * 0.15),
      percentage: 15,
    },
  };

  return { bmr, tdee, formulaUsed, goals };
}

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

// ==========================================
// 4. DISTRIBUCIÓN DE MACRONUTRIENTES
// ==========================================

export type MacroStrategy = 'bodyweight' | 'percentage';

export interface MacroDistributionParams {
  strategy: MacroStrategy;
  targetKcal: number;
  weightKg?: number;
  proteinGPerKg?: number;
  fatGPerKg?: number;
  proteinPercent?: number;
  carbsPercent?: number;
  fatPercent?: number;
  mealsCount?: number;
}

export interface MacroItem {
  grams: number;
  kcal: number;
  percentage: number;
}

export interface MacroDistributionResult {
  totalKcal: number;
  protein: MacroItem;
  carbs: MacroItem;
  fat: MacroItem;
  perMeal?: {
    mealCount: number;
    kcal: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  warnings?: string[];
}

export function calculateMacroDistribution(
  params: MacroDistributionParams,
): MacroDistributionResult {
  const {
    strategy,
    targetKcal,
    weightKg = 70,
    proteinGPerKg = 2.0,
    fatGPerKg = 0.9,
    proteinPercent = 30,
    carbsPercent = 40,
    fatPercent = 30,
    mealsCount,
  } = params;

  const warnings: string[] = [];

  if (targetKcal <= 0) {
    const emptyItem: MacroItem = { grams: 0, kcal: 0, percentage: 0 };
    return { totalKcal: 0, protein: emptyItem, carbs: emptyItem, fat: emptyItem };
  }

  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;

  if (strategy === 'bodyweight') {
    const effectiveWeight = weightKg > 0 ? weightKg : 70;
    proteinGrams = Math.round(effectiveWeight * proteinGPerKg);
    fatGrams = Math.round(effectiveWeight * fatGPerKg);

    const proteinKcal = proteinGrams * 4;
    const fatKcal = fatGrams * 9;
    const remainingKcal = targetKcal - (proteinKcal + fatKcal);

    if (remainingKcal < 0) {
      warnings.push(
        'Las proteínas y grasas asignadas superan las calorías totales objetivo. Reduce los gramos/kg.',
      );
      carbsGrams = 0;
    } else {
      carbsGrams = Math.round(remainingKcal / 4);
    }
  } else {
    // Percentage strategy
    const totalP = proteinPercent + carbsPercent + fatPercent;
    if (Math.abs(totalP - 100) > 0.1) {
      warnings.push(`La suma de porcentajes es ${totalP}%, debe sumar exactamente 100%.`);
    }

    const pKcal = (targetKcal * proteinPercent) / 100;
    const cKcal = (targetKcal * carbsPercent) / 100;
    const fKcal = (targetKcal * fatPercent) / 100;

    proteinGrams = Math.round(pKcal / 4);
    carbsGrams = Math.round(cKcal / 4);
    fatGrams = Math.round(fKcal / 9);
  }

  const actualProteinKcal = proteinGrams * 4;
  const actualCarbsKcal = carbsGrams * 4;
  const actualFatKcal = fatGrams * 9;
  const actualTotalKcal = actualProteinKcal + actualCarbsKcal + actualFatKcal;

  const proteinPct =
    actualTotalKcal > 0 ? Math.round((actualProteinKcal / actualTotalKcal) * 100) : 0;
  const carbsPct = actualTotalKcal > 0 ? Math.round((actualCarbsKcal / actualTotalKcal) * 100) : 0;
  const fatPct = actualTotalKcal > 0 ? Math.round((actualFatKcal / actualTotalKcal) * 100) : 0;

  const result: MacroDistributionResult = {
    totalKcal: actualTotalKcal,
    protein: {
      grams: proteinGrams,
      kcal: actualProteinKcal,
      percentage: proteinPct,
    },
    carbs: {
      grams: carbsGrams,
      kcal: actualCarbsKcal,
      percentage: carbsPct,
    },
    fat: {
      grams: fatGrams,
      kcal: actualFatKcal,
      percentage: fatPct,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  if (mealsCount && mealsCount >= 1) {
    result.perMeal = {
      mealCount: mealsCount,
      kcal: Math.round(actualTotalKcal / mealsCount),
      proteinGrams: Math.round((proteinGrams / mealsCount) * 10) / 10,
      carbsGrams: Math.round((carbsGrams / mealsCount) * 10) / 10,
      fatGrams: Math.round((fatGrams / mealsCount) * 10) / 10,
    };
  }

  return result;
}

// ==========================================
// 5. CONVERSOR DE UNIDADES FITNESS
// ==========================================

export interface HeightFtIn {
  feet: number;
  inches: number;
}

export interface WeightStLbs {
  stones: number;
  pounds: number;
}

export const LBS_PER_KG = 2.20462262185;
export const CM_PER_INCH = 2.54;
export const KM_PER_MILE = 1.609344;

export function kgToLbs(kg: number): number {
  if (kg < 0) return 0;
  return Math.round(kg * LBS_PER_KG * 100) / 100;
}

export function lbsToKg(lbs: number): number {
  if (lbs < 0) return 0;
  return Math.round((lbs / LBS_PER_KG) * 100) / 100;
}

export function kgToStoneLbs(kg: number): WeightStLbs {
  if (kg <= 0) return { stones: 0, pounds: 0 };
  const totalLbs = kg * LBS_PER_KG;
  const stones = Math.floor(totalLbs / 14);
  const pounds = Math.round((totalLbs % 14) * 10) / 10;
  return { stones, pounds };
}

export function stoneLbsToKg(stones: number, pounds: number): number {
  const totalLbs = Math.max(0, stones) * 14 + Math.max(0, pounds);
  return lbsToKg(totalLbs);
}

export function cmToInches(cm: number): number {
  if (cm < 0) return 0;
  return Math.round((cm / CM_PER_INCH) * 100) / 100;
}

export function inchesToCm(inches: number): number {
  if (inches < 0) return 0;
  return Math.round(inches * CM_PER_INCH * 100) / 100;
}

export function cmToFeetInches(cm: number): HeightFtIn {
  if (cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = cm / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches % 12) * 10) / 10;
  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = Math.max(0, feet) * 12 + Math.max(0, inches);
  return inchesToCm(totalInches);
}

export function kmToMiles(km: number): number {
  if (km < 0) return 0;
  return Math.round((km / KM_PER_MILE) * 100) / 100;
}

export function milesToKm(miles: number): number {
  if (miles < 0) return 0;
  return Math.round(miles * KM_PER_MILE * 100) / 100;
}

export function paceKmToPaceMiles(minKm: number): number {
  if (minKm <= 0) return 0;
  return Math.round(minKm * KM_PER_MILE * 100) / 100;
}

export function paceMilesToPaceKm(minMiles: number): number {
  if (minMiles <= 0) return 0;
  return Math.round((minMiles / KM_PER_MILE) * 100) / 100;
}

export function paceToSpeedKmh(paceMinKm: number): number {
  if (paceMinKm <= 0) return 0;
  return Math.round((60 / paceMinKm) * 100) / 100;
}

export function speedKmhToPace(speedKmh: number): number {
  if (speedKmh <= 0) return 0;
  return Math.round((60 / speedKmh) * 100) / 100;
}

export function kmhToMph(kmh: number): number {
  if (kmh < 0) return 0;
  return Math.round((kmh / KM_PER_MILE) * 100) / 100;
}

export function mphToKmh(mph: number): number {
  if (mph < 0) return 0;
  return Math.round(mph * KM_PER_MILE * 100) / 100;
}

export function formatPace(paceDecimal: number): string {
  if (paceDecimal <= 0) return '0:00';
  const minutes = Math.floor(paceDecimal);
  const seconds = Math.round((paceDecimal - minutes) * 60);
  const formattedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${formattedSec}`;
}

export function parsePace(minutes: number, seconds: number): number {
  const m = Math.max(0, minutes);
  const s = Math.max(0, seconds);
  return m + s / 60;
}
