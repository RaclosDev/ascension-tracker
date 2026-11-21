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

/** Arrival date (yyyy-MM-dd) at a weekly rate (kg/week), whether the goal is to lose or gain. */
export function calcEstimatedDate(current: number, goal: number, weeklyRate: number): string {
  const remaining = Math.abs(current - goal);
  const absRate = Math.abs(weeklyRate);
  if (remaining < 0.05) return new Date().toISOString().slice(0, 10);
  if (absRate < 0.01) return '';
  const target = new Date();
  target.setDate(target.getDate() + Math.round((remaining / absRate) * 7));
  return target.toISOString().slice(0, 10);
}

/** «9 ene 2027» from a yyyy-MM-dd date; anything else is shown as it comes. */
export function formatEstimate(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '');
}
