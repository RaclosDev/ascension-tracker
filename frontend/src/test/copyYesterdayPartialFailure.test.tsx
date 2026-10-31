import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MouseEvent, ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import api from '../api/client';
import { useNutritionDiary } from '../hooks/nutrition/useNutritionDiary';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
});

it('refreshes partial copies and does not duplicate confirmed successes on retry', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const yesterdayLogs = [
    { product: 'Rice', mealIndex: 0 },
    { product: 'Egg', mealIndex: 0 },
  ];
  const saved: typeof yesterdayLogs = [];
  let failEgg = true;
  const today = new Date().toLocaleDateString('en-CA');
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: url.includes('/logs?')
      ? url.endsWith(today)
        ? saved.slice()
        : yesterdayLogs
      : url.includes('/meals')
        ? []
        : {},
  }));
  vi.mocked(api.post).mockImplementation(async (_url, body: unknown) => {
    const item = body as { product: string; mealIndex: number };
    if (item.product === 'Egg' && failEgg) throw new Error('temporary');
    saved.push(item);
    return { data: item };
  });
  const { result } = renderHook(() => useNutritionDiary(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  const event = { stopPropagation: vi.fn() } as unknown as MouseEvent<HTMLButtonElement>;
  await act(async () => {
    await result.current.handleCopyFromYesterday(event, 0);
  });
  await waitFor(() => expect(result.current.foodLogs).toHaveLength(1));
  failEgg = false;
  await act(async () => {
    await result.current.handleCopyFromYesterday(event, 0);
  });
  expect(saved.map((item) => item.product)).toEqual(['Rice', 'Egg']);
});

it('copies by stable meal identity after meals have been reordered', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const today = new Date().toLocaleDateString('en-CA');
  vi.mocked(api.get).mockImplementation(async (url) => ({
    data: url.includes('/logs?')
      ? url.endsWith(today)
        ? []
        : [{ product: 'Rice', mealIndex: 0, mealKey: 'breakfast' }]
      : url.includes('/meals')
        ? [
            { name: 'Dinner', mealKey: 'dinner' },
            { name: 'Breakfast', mealKey: 'breakfast' },
          ]
        : {},
  }));
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNutritionDiary(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  const event = { stopPropagation: vi.fn() } as unknown as MouseEvent<HTMLButtonElement>;
  await act(async () => {
    await result.current.handleCopyFromYesterday(event, 1);
  });
  expect(api.post).toHaveBeenCalledWith(
    '/nutrition/logs',
    expect.objectContaining({ mealKey: 'breakfast', mealIndex: 1, product: 'Rice' }),
  );
});
