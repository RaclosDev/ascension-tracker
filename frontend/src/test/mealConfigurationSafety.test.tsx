import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import api from '../api/client';
import MealConfigurator from '../components/MealConfigurator';
vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it('does not recreate meals when the user intentionally has an empty configuration', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
  render(<MealConfigurator />);
  await screen.findByRole('button', { name: /Restablecer/ });
  expect(api.post).not.toHaveBeenCalled();
});
it('does not create duplicate meals as a fallback when reset fails', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
  vi.mocked(api.post).mockRejectedValueOnce(new Error('offline'));
  render(<MealConfigurator />);
  fireEvent.click(await screen.findByRole('button', { name: /Restablecer/ }));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  expect(api.post).toHaveBeenCalledWith('/nutrition/meals/reset');
});
