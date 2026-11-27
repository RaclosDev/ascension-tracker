import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useNutritionDiary } from '../hooks/nutrition/useNutritionDiary';
import { invalidateDiary } from '../lib/nutrition/invalidateDiary';
import type { FoodLog } from '../types/api';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));
const mockedApi = vi.mocked(api, true);

const logFor = (date: string): FoodLog =>
  ({
    id: 7,
    date,
    mealIndex: 0,
    mealKey: 'm0',
    mealName: 'Desayuno',
    product: `Avena ${date}`,
    quantity: 100,
    kcal: 300,
    protein: 10,
    carbs: 50,
    fat: 5,
  }) as FoodLog;

function setup() {
  mockedApi.get.mockImplementation(async (url: string) => {
    const date = /date=([\d-]+)/.exec(url)?.[1] ?? '';
    if (url.startsWith('/nutrition/logs')) {
      // Slow response for any other day, so the previous day would be visible in the meantime.
      if (date !== new Date().toISOString().slice(0, 10)) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return { data: [logFor(date)] };
    }
    return { data: [] };
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useNutritionDiary(), { wrapper }) };
}

beforeEach(() => vi.clearAllMocks());

it('does not save a blank or zero quantity when editing a log', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.handleEditLog(result.current.foodLogs[0]));
  act(() => result.current.handleEditQuantityChange('0'));
  act(() => result.current.handleUpdateLog());
  expect(mockedApi.put).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith('Indica una cantidad mayor que 0');
});

it('does not show the previous day logs while a new date loads', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.loading).toBe(false));
  const firstDay = result.current.selectedDate;
  act(() => result.current.setSelectedDate('2020-01-01'));
  expect(result.current.foodLogs.some((l: FoodLog) => l.product.includes(firstDay))).toBe(false);
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.foodLogs[0].product).toContain('2020-01-01');
});

it('invalidateDiary refreshes every query that depends on the diary', async () => {
  const client = new QueryClient();
  const spy = vi.spyOn(client, 'invalidateQueries');
  await invalidateDiary(client);
  const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey[0]);
  expect(keys).toEqual(
    expect.arrayContaining([
      'nutritionData',
      'nutrition',
      'dashboard',
      'weekSummaries',
      'trackingWeeks',
    ]),
  );
});
