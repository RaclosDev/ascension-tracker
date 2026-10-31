import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import api from '../api/client';
import { useMealSelection } from '../hooks/my-foods/useMealSelection';

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }));

it('keeps only failed foods selected after a partially successful add, preventing duplicate retries', async () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const foods = [1, 2].map((id) => ({
    id,
    name: `Food ${id}`,
    kcalPer100g: 100,
    proteinPer100g: 10,
    carbsPer100g: 10,
    fatPer100g: 2,
  }));
  const { result } = renderHook(() => useMealSelection(foods), { wrapper });
  act(() => {
    result.current.setSelectedFoods(new Set([1, 2]));
  });
  vi.mocked(api.post)
    .mockResolvedValueOnce({ data: {} })
    .mockRejectedValueOnce(new Error('offline'));
  await act(async () => {
    await result.current.handleBulkAddToMeal(0);
  });
  expect([...result.current.selectedFoods]).toEqual([2]);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['nutritionData'] });
  client.clear();
});
