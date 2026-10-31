import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useRatePreference } from '../hooks/useRatePreference';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

it('keeps the selected rate usable when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  const { result } = renderHook(() => useRatePreference());
  act(() => {
    result.current.update({ mode: 'custom', customRate: 0.3 });
  });
  expect(result.current.pref).toEqual({ mode: 'custom', customRate: 0.3 });
});

it('ignores malformed stored preferences', () => {
  localStorage.setItem(
    'ascension:rate-preference',
    JSON.stringify({ mode: 'invalid', customRate: 'bad' }),
  );
  const { result } = renderHook(() => useRatePreference());
  expect(result.current.pref).toEqual({ mode: 'history', customRate: 0.5 });
});
