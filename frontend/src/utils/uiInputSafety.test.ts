import { afterEach, expect, it, vi } from 'vitest';
import { applyThemeColor, readThemeColor } from './colorHelper';
import { readWeightPlan } from './weightPlanPreferences';
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
it('keeps theme readable and usable when storage is denied', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  expect(readThemeColor()).toBe('#0085FF');
  expect(() => applyThemeColor('#abc')).not.toThrow();
  expect(document.documentElement.style.getPropertyValue('--accent-primary')).toBe('#aabbcc');
  expect(document.documentElement.style.getPropertyValue('--accent-primary-light')).not.toContain(
    'NaN',
  );
});
it.each(['null', '[]', 'false', '{"stepsPct":400}', '{"goalWeight":{}}'])(
  'ignores invalid saved plan %s',
  (value) => {
    localStorage.setItem('ascension_weight_loss_plan', value);
    const saved = readWeightPlan();
    expect(saved.goalWeight).toBeUndefined();
    expect(saved.stepsPct).toBeUndefined();
  },
);
