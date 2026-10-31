import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RecipeFormModal, { type RecipeForm } from '../components/my-foods/RecipeFormModal';

vi.mock('../components/FoodSearchModal', () => ({ default: () => null }));

const oats = { product: 'Avena', quantity: 50, kcal: 180, protein: 7, carbs: 30, fat: 3 };
const form: RecipeForm = {
  name: 'Desayuno',
  description: JSON.stringify([oats]),
  kcal: '180',
  protein: '7',
  carbs: '30',
  fat: '3',
};

describe('recipe ingredients', () => {
  it('clears persisted ingredients and totals when removing the last ingredient of an existing recipe', () => {
    const update = vi.fn();
    render(
      <RecipeFormModal
        isOpen
        editingRecipeId={1}
        recipeForm={form}
        updateRecipeForm={update}
        onToggle={vi.fn()}
        handleAddRecipe={vi.fn()}
        onCancelEdit={vi.fn()}
        handleDeleteRecipe={vi.fn()}
      />,
    );
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar ingrediente Avena' }));
    expect(update).toHaveBeenCalledExactlyOnceWith({
      description: '[]',
      kcal: '0',
      protein: '0',
      carbs: '0',
      fat: '0',
    });
  });
});
