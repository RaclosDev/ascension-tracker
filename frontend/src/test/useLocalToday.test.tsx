import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useLocalToday } from '../hooks/use-local-today';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it('changes to the new day when the clock passes midnight', () => {
  vi.setSystemTime(new Date(2026, 10, 27, 23, 59, 50));
  const { result } = renderHook(() => useLocalToday());
  expect(result.current).toBe('2026-11-27');

  act(() => {
    vi.advanceTimersByTime(12_000);
  });
  expect(result.current).toBe('2026-11-28');
});

it('catches up when the tab becomes visible after sleeping through midnight', () => {
  vi.setSystemTime(new Date(2026, 10, 27, 23, 0, 0));
  const { result } = renderHook(() => useLocalToday());
  expect(result.current).toBe('2026-11-27');

  // The clock moves on without the timers running (a sleeping tab).
  vi.setSystemTime(new Date(2026, 10, 28, 8, 0, 0));
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(result.current).toBe('2026-11-28');
});
