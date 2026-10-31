import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ManualFoodForm from '../components/food/ManualFoodForm';
import api from '../api/client';
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../api/client', () => ({ default: { post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: toast }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const form = { name: 'Pan', brand: '', kcal: '200', protein: '10', carbs: '30', fat: '4' };
function setup(quantity = 100) {
  render(
    <ManualFoodForm
      manualForm={form}
      updateManualForm={vi.fn()}
      quantity={quantity}
      setQuantity={vi.fn()}
      ocrLoading={false}
      selectedMealIndex={0}
      selectedMealKey="stable-breakfast"
      date="2026-10-31"
      onClose={vi.fn()}
    />,
  );
  return screen.getByLabelText(/Nombre del alimento/).closest('form')!;
}
it('rejects a zero quantity instead of recording an implicit 100 grams', () => {
  fireEvent.submit(setup(0));
  expect(api.post).not.toHaveBeenCalled();
});
it('submits once while pending and reports catalog failure without pretending both writes succeeded', async () => {
  let resolve: ((value: { data: object }) => void) | undefined;
  vi.mocked(api.post)
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    )
    .mockRejectedValueOnce(new Error('offline'));
  const element = setup();
  fireEvent.submit(element);
  fireEvent.submit(element);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith(
    '/nutrition/logs',
    expect.objectContaining({ mealKey: 'stable-breakfast' }),
  );
  await act(async () => resolve?.({ data: {} }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(toast.success).not.toHaveBeenCalled();
});
