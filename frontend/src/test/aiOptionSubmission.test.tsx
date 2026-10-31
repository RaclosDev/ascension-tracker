import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import api from '../api/client';
import { useAiNutritionChef } from '../hooks/utilities/useAiNutritionChef';

vi.mock('../api/client', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn() },
}));
vi.mock('../hooks/useSpeechToText', () => ({
  useSpeechToText: () => ({ stopListening: vi.fn() }),
}));

it('submits an assistant option once while pending and invalidates the diary after success', async () => {
  let release: (() => void) | undefined;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ data: {} });
      }),
  );
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useAiNutritionChef(), { wrapper });
  const option = { suggestedFoods: [{ foodName: 'Arroz' }], mealIndex: 0 };
  let first: Promise<void>;
  let second: Promise<void>;
  act(() => {
    first = result.current.handleApplyOption(option, 'option-1');
    second = result.current.handleApplyOption(option, 'option-1');
  });
  expect(api.post).toHaveBeenCalledTimes(1);
  await act(async () => {
    release?.();
    await Promise.all([first, second]);
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['nutritionData'] });
  await act(async () => {
    await result.current.handleApplyOption(option, 'option-1');
  });
  expect(api.post).toHaveBeenCalledTimes(1);
});
