import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useRetryingImport } from '../hooks/use-retrying-import';

it('stays empty while the import fails and loads it again when the network returns', async () => {
  const load = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module'))
    .mockResolvedValue('card');

  const { result } = renderHook(() => useRetryingImport(load));
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  expect(result.current).toBeNull();

  act(() => {
    window.dispatchEvent(new Event('online'));
  });
  await waitFor(() => expect(result.current).toBe('card'));
  expect(load).toHaveBeenCalledTimes(2);

  // Once loaded it does not ask again.
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
  expect(load).toHaveBeenCalledTimes(2);
});
