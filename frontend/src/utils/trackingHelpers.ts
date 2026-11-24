import { WeekData, WeeklyMetricResponse } from '../types/tracking';

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEIGHT_DELTAS = [-0.5, -0.1, 0.1, 0.5];
export const STEPS_DELTAS = [-1000, -100, 100, 1000];

/**
 * Body weight with one decimal, or two when the scale gave a second one (80,6, 80,65). Decimal
 * comma, so it never reads like the thousands dot of steps and kcal (9.230).
 */
export const formatBodyKg = (w: number) =>
  (Math.round(w * 100) % 10 ? w.toFixed(2) : w.toFixed(1)).replace('.', ',');

export function getMondayStr(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
}

export function mergeWeeksData(
  weightsData: WeeklyMetricResponse[] = [],
  stepsData: WeeklyMetricResponse[] = [],
  caloriesData: WeeklyMetricResponse[] = [],
): WeekData[] {
  const weeksMap = new Map<string, WeekData>();

  const mergeIntoWeeks = (
    resData: WeeklyMetricResponse[],
    type: 'weight' | 'steps' | 'calories',
  ) => {
    if (!resData || !Array.isArray(resData)) return;
    resData.forEach((week) => {
      if (!week || !week.weekStart) return;
      if (!weeksMap.has(week.weekStart)) {
        weeksMap.set(week.weekStart, {
          weekStart: week.weekStart,
          averageWeight: null,
          deltaWeight: null,
          averageSteps: null,
          deltaSteps: null,
          averageCalories: null,
          deltaCalories: null,
          days: Array(7)
            .fill(null)
            .map(() => ({ weight: null, steps: null, calories: null })),
        });
      }
      const w = weeksMap.get(week.weekStart)!;

      if (type === 'weight') {
        w.averageWeight = week.average;
        w.deltaWeight = week.delta;
        if (Array.isArray(week.days)) {
          week.days.forEach((val: number | null, i: number) => {
            if (w.days[i]) w.days[i].weight = val;
          });
        }
      }
      if (type === 'steps') {
        w.averageSteps = week.average;
        w.deltaSteps = week.delta;
        if (Array.isArray(week.days)) {
          week.days.forEach((val: number | null, i: number) => {
            if (w.days[i]) w.days[i].steps = val;
          });
        }
      }
      if (type === 'calories') {
        w.averageCalories = week.average;
        w.deltaCalories = week.delta;
        if (Array.isArray(week.days)) {
          week.days.forEach((val: number | null, i: number) => {
            if (w.days[i]) w.days[i].calories = val;
          });
        }
      }
    });
  };

  mergeIntoWeeks(weightsData, 'weight');
  mergeIntoWeeks(stepsData, 'steps');
  mergeIntoWeeks(caloriesData, 'calories');

  return Array.from(weeksMap.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
