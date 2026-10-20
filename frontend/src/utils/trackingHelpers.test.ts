import { describe, it, expect } from 'vitest';
import {
  mergeWeeksData,
  getMondayStr,
  DAY_NAMES,
  WEIGHT_DELTAS,
  STEPS_DELTAS,
} from './trackingHelpers';
import { WeeklyMetricResponse } from '../types/tracking';

describe('trackingHelpers', () => {
  it('exporta constantes esperadas', () => {
    expect(DAY_NAMES).toHaveLength(7);
    expect(WEIGHT_DELTAS).toEqual([-0.1, -0.05, 0.05, 0.1]);
    expect(STEPS_DELTAS).toEqual([-1000, -100, 100, 1000]);
  });

  describe('getMondayStr', () => {
    it('calcula correctamente el lunes para una fecha dada', () => {
      // 2026-10-14 es miércoles -> lunes es 2026-10-12
      const wednesday = new Date('2026-10-14T12:00:00');
      expect(getMondayStr(wednesday)).toBe('2026-10-12');

      // 2026-10-18 es domingo -> lunes es 2026-10-12
      const sunday = new Date('2026-10-18T12:00:00');
      expect(getMondayStr(sunday)).toBe('2026-10-12');

      // 2026-10-12 es lunes -> lunes es 2026-10-12
      const monday = new Date('2026-10-12T12:00:00');
      expect(getMondayStr(monday)).toBe('2026-10-12');
    });
  });

  describe('mergeWeeksData', () => {
    it('retorna array vacío si no se pasan datos', () => {
      expect(mergeWeeksData([], [], [])).toEqual([]);
    });

    it('combina correctamente pesos, pasos y calorías para una misma semana', () => {
      const weights: WeeklyMetricResponse[] = [
        {
          weekStart: '2026-10-05',
          average: 75.5,
          delta: -0.5,
          days: [76, 75.8, 75.5, null, null, null, null],
        },
      ];

      const steps: WeeklyMetricResponse[] = [
        {
          weekStart: '2026-10-05',
          average: 10000,
          delta: 500,
          days: [10000, 12000, 8000, null, null, null, null],
        },
      ];

      const calories: WeeklyMetricResponse[] = [
        {
          weekStart: '2026-10-05',
          average: 2400,
          delta: -100,
          days: [2500, 2300, 2400, null, null, null, null],
        },
      ];

      const result = mergeWeeksData(weights, steps, calories);
      expect(result).toHaveLength(1);
      const week = result[0];
      expect(week.weekStart).toBe('2026-10-05');
      expect(week.averageWeight).toBe(75.5);
      expect(week.averageSteps).toBe(10000);
      expect(week.averageCalories).toBe(2400);

      expect(week.days[0]).toEqual({ weight: 76, steps: 10000, calories: 2500 });
      expect(week.days[1]).toEqual({ weight: 75.8, steps: 12000, calories: 2300 });
      expect(week.days[3]).toEqual({ weight: null, steps: null, calories: null });
    });

    it('ordena las semanas cronológicamente de forma ascendente', () => {
      const weights: WeeklyMetricResponse[] = [
        { weekStart: '2026-10-12', average: 74, delta: -1, days: [] },
        { weekStart: '2026-09-28', average: 76, delta: 0, days: [] },
        { weekStart: '2026-10-05', average: 75, delta: -1, days: [] },
      ];

      const result = mergeWeeksData(weights, [], []);
      expect(result.map((w) => w.weekStart)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12']);
    });
  });
});
