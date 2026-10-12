import { BasePortion, Portion } from '../types/nutrition';

export const getBasePortion = (portionsJson: string | null): BasePortion | null => {
  if (!portionsJson) return null;
  try {
    const portions: Portion[] = JSON.parse(portionsJson);
    if (!portions || !Array.isArray(portions) || portions.length === 0) return null;
    const base = portions.find(
      (p) =>
        typeof p.label === 'string' &&
        p.label.startsWith('1 ') &&
        typeof p.amount === 'number' &&
        p.amount > 0,
    );
    if (base) return { label: base.label.replace(/^1\s+/, ''), amount: base.amount };
    const first = portions.find(
      (p) => typeof p.label === 'string' && typeof p.amount === 'number' && p.amount > 0,
    );
    if (first) return { label: first.label, amount: first.amount };
    return null;
  } catch {
    return null;
  }
};
