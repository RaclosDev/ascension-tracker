import { useState, useCallback, useEffect } from 'react';

export type RateMode = 'history' | 'goal' | 'custom';

export interface RatePreference {
  mode: RateMode;
  customRate: number; // kg/semana
}

const STORAGE_KEY = 'ascension:rate-preference';
const DEFAULT: RatePreference = { mode: 'history', customRate: 0.5 };

export function useRatePreference() {
  const [pref, setPref] = useState<RatePreference>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const value: unknown = JSON.parse(raw);
        if (
          value &&
          typeof value === 'object' &&
          'mode' in value &&
          'customRate' in value &&
          (value.mode === 'history' || value.mode === 'goal' || value.mode === 'custom') &&
          typeof value.customRate === 'number' &&
          Number.isFinite(value.customRate)
        ) {
          return { mode: value.mode, customRate: value.customRate };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT;
  });

  const update = useCallback((next: Partial<RatePreference>) => {
    setPref((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch {
      // The preference remains usable in memory when browser storage is unavailable.
    }
  }, [pref]);

  return { pref, update };
}

/** Recalculates estimated date locally given current weight, goal, and a weekly rate (kg/week) */
export function calcEstimatedDate(current: number, goal: number, weeklyRate: number): string {
  const remaining = current - goal;
  if (remaining <= 0) {
    return new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  const absRate = Math.abs(weeklyRate);
  if (absRate < 0.01) return '--';
  const days = Math.round((remaining / absRate) * 7);
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
