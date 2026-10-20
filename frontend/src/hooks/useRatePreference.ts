import { useState, useCallback } from 'react';

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
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return DEFAULT;
  });

  const update = useCallback((next: Partial<RatePreference>) => {
    setPref((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

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
