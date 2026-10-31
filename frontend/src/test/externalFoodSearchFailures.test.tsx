import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useExternalFoodSearch } from '../hooks/food/useExternalFoodSearch';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { error: vi.fn() }) }));
afterEach(() => vi.resetAllMocks());

it('reports a service failure without replacing previous food results with an empty success', async () => {
  vi.mocked(api.get).mockRejectedValue(new Error('network unavailable'));
  const setResults = vi.fn();
  const { result } = renderHook(() => useExternalFoodSearch('arroz', setResults));
  await act(async () => {
    await result.current();
  });
  expect(toast.error).toHaveBeenCalled();
  expect(setResults).not.toHaveBeenCalled();
});

it('aborts pending search when the search UI unmounts', async () => {
  vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
  const { result, unmount } = renderHook(() => useExternalFoodSearch('arroz', vi.fn()));
  act(() => {
    void result.current();
  });
  const signal = vi.mocked(api.get).mock.calls[0][1]?.signal;
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});
