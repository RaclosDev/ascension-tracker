import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { WeekSummary, WeightEntry } from '../types/api';

const shortDay = (isoDate: string) =>
  format(new Date(isoDate + 'T00:00:00'), 'd MMM', { locale: es });

/** Points for the weight evolution chart, shared by the dashboard and the coach's client view. */
export const toWeightChartData = (weights: WeightEntry[]) =>
  weights.map((w) => ({ date: w.date, weight: w.weight, label: shortDay(w.date) }));

/** Weekly change bars: green when the average went down, red when it went up. */
export const toWeeklyDeltaData = (weeks: WeekSummary[]) =>
  weeks
    .filter((w): w is WeekSummary & { delta: number } => w.delta !== null)
    .map((w) => ({
      week: shortDay(w.weekStart),
      delta: w.delta,
      fill:
        w.delta <= 0
          ? 'var(--color-success-strong, rgba(52, 211, 153, 0.8))'
          : 'var(--color-fat-strong, rgba(248, 113, 113, 0.8))',
    }));
