import { expect, it, vi } from 'vitest';
import { applyTrackingChanges, parseTrackingInputs } from './trackingMutations';

it.each(['-1', '1.5', '10abc', '2147483648', 'Infinity'])(
  'rejects invalid steps %s before any write',
  (steps) => {
    expect(() => parseTrackingInputs('80', steps)).toThrow();
  },
);
it.each(['80abc', 'Infinity', '-1', '451'])('rejects invalid weight %s', (weight) => {
  expect(() => parseTrackingInputs(weight, '100')).toThrow();
});
it('accepts decimal comma and explicit empty values for deletion', () => {
  expect(parseTrackingInputs('80,25', '0')).toEqual({ weight: 80.25, steps: 0 });
  expect(parseTrackingInputs(' ', '')).toEqual({ weight: null, steps: null });
});
it.each(['save', 'delete'])(
  'reports the committed weight when the second %s fails',
  async (mode) => {
    const writer = {
      post: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('offline')),
      delete: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('offline')),
    };
    const applied = vi.fn();
    await expect(
      applyTrackingChanges(
        writer,
        '2026-10-31',
        { weight: 80, steps: 100 },
        mode === 'save' ? { weight: 81, steps: 200 } : { weight: null, steps: null },
        applied,
      ),
    ).rejects.toThrow('offline');
    expect(applied).toHaveBeenCalledExactlyOnceWith('weight', mode === 'save' ? 81 : null);
  },
);
