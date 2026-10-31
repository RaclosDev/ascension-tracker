const STORAGE_KEY = 'ascension_weight_loss_plan';
interface Preferences {
  goalWeight?: string;
  weeks?: string;
  stepsPct?: number;
}

export function readWeightPlan(): Preferences {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const data = value as Record<string, unknown>;
    return {
      goalWeight: typeof data.goalWeight === 'string' ? data.goalWeight : undefined,
      weeks: typeof data.weeks === 'string' ? data.weeks : undefined,
      stepsPct:
        typeof data.stepsPct === 'number' &&
        Number.isFinite(data.stepsPct) &&
        data.stepsPct >= 0 &&
        data.stepsPct <= 100
          ? data.stepsPct
          : undefined,
    };
  } catch {
    return {};
  }
}

export function persistWeightPlan(updates: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readWeightPlan(), ...updates }));
  } catch {
    /* The calculator continues to work without persistence. */
  }
}
