import { useFoodSearchLists } from '../hooks/food/useFoodSearchLists';
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../api/client';
import { useMyFoodsData } from '../hooks/my-foods/useMyFoodsData';
import { useNutritionDiary } from '../hooks/nutrition/useNutritionDiary';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function useSearchLists() {
  return useFoodSearchLists(true);
}

describe('food query failures', () => {
  it.each([
    { name: 'search lists', hook: useSearchLists, key: ['foodLists'] },
    { name: 'saved foods', hook: useMyFoodsData, key: ['myFoodsData'] },
    { name: 'diary', hook: useNutritionDiary, key: ['nutritionData'] },
  ])(
    'does not cache a partial failure as an empty successful $name response',
    async ({ hook, key }) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      vi.mocked(api.get)
        .mockResolvedValue({ data: [] })
        .mockRejectedValueOnce(new Error('offline'));
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      renderHook(
        () => {
          hook();
        },
        { wrapper },
      );
      await waitFor(() =>
        expect(client.getQueryCache().find({ queryKey: key, exact: false })?.state.status).toBe(
          'error',
        ),
      );
      expect(
        client.getQueryCache().find({ queryKey: key, exact: false })?.state.data,
      ).toBeUndefined();
      vi.mocked(api.get).mockResolvedValue({ data: [] });
      await act(async () => {
        await client.refetchQueries({ queryKey: key });
      });
      await waitFor(() =>
        expect(client.getQueryCache().find({ queryKey: key, exact: false })?.state.status).toBe(
          'success',
        ),
      );
      const lastData = client.getQueryCache().find({ queryKey: key, exact: false })?.state.data;
      vi.mocked(api.get).mockRejectedValue(new Error('offline again'));
      await act(async () => {
        await client.refetchQueries({ queryKey: key });
      });
      expect(client.getQueryCache().find({ queryKey: key, exact: false })?.state.status).toBe(
        'error',
      );
      expect(client.getQueryCache().find({ queryKey: key, exact: false })?.state.data).toEqual(
        lastData,
      );
      client.clear();
    },
  );
});
