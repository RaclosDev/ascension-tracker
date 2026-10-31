import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { useNutritionDiary } from '../hooks/nutrition/useNutritionDiary';

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn().mockRejectedValue(new Error('offline')),
  },
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

it('reports a failed deletion even when the log is absent from the current list', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useNutritionDiary(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => {
    result.current.handleDeleteLog('not-loaded');
  });
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al eliminar alimento'));
});
