import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useFoodForms } from '../hooks/my-foods/useFoodForms';
import FoodFormModal from '../components/my-foods/FoodFormModal';

vi.mock('../api/client', () => ({ default: { post: vi.fn(), put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent;

describe('food forms of My foods', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends a double submit once', async () => {
    let release: () => void = () => undefined;
    vi.mocked(api.post).mockReturnValue(new Promise((r) => (release = () => r({ data: {} }))));
    const fetchData = vi.fn();
    const { result } = renderHook(() => useFoodForms(fetchData));
    act(() => {
      result.current.updateFoodForm('name', 'Avena');
      result.current.updateFoodForm('protein', '12');
    });
    await act(async () => {
      void result.current.handleAddSavedFood(submitEvent());
      void result.current.handleAddSavedFood(submitEvent());
    });
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);
    await act(async () => release());
    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(false);
  });

  it('does not turn text that is not a number into 0', async () => {
    const { result } = renderHook(() => useFoodForms(vi.fn()));
    act(() => {
      result.current.updateFoodForm('name', 'Avena');
      result.current.updateFoodForm('protein', 'abc');
    });
    await act(async () => {
      await result.current.handleAddSavedFood(submitEvent());
    });
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('accepts a decimal comma', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useFoodForms(vi.fn()));
    act(() => {
      result.current.updateFoodForm('name', 'Avena');
      result.current.updateFoodForm('protein', '12,5');
    });
    await act(async () => {
      await result.current.handleAddSavedFood(submitEvent());
    });
    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ proteinPer100g: 12.5 });
  });
});

describe('deleting a food from its form', () => {
  const props = {
    isOpen: true,
    foodForm: {
      name: 'Avena',
      brand: '',
      protein: '',
      carbs: '',
      fat: '',
      kcal: '',
      servingSize: '',
      servingLabel: '',
    },
    updateFoodForm: vi.fn(),
    handleAddSavedFood: vi.fn(),
    editingFoodId: 5,
  };

  it('keeps the form open if the user backs out of the confirmation', async () => {
    const onClose = vi.fn();
    const handleDeleteFood = vi.fn().mockResolvedValue(false);
    render(<FoodFormModal {...props} onClose={onClose} handleDeleteFood={handleDeleteFood} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar alimento' }));
    await waitFor(() => expect(handleDeleteFood).toHaveBeenCalledWith(5));
    await Promise.resolve();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes once the food is deleted', async () => {
    const onClose = vi.fn();
    render(
      <FoodFormModal
        {...props}
        onClose={onClose}
        handleDeleteFood={vi.fn().mockResolvedValue(true)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar alimento' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
