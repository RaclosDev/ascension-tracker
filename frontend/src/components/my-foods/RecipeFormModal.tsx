/* eslint-disable */
import React, { useState, useEffect } from 'react';
import FoodSearchModal from '../FoodSearchModal';
import { Plus, Trash2 } from 'lucide-react';

interface RecipeForm {
  name: string;
  description: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
}

interface RecipeFormModalProps {
  isOpen: boolean;
  onToggle: () => void;
  recipeForm: RecipeForm;
  updateRecipeForm: (field: any, value?: any) => void;
  handleAddRecipe: (e: React.FormEvent) => void;
  editingRecipeId: number | string | null;
  onCancelEdit: () => void;
  handleDeleteRecipe: (id: number | string) => void;
}

export default function RecipeFormModal({
  isOpen,
  onToggle,
  recipeForm,
  updateRecipeForm,
  handleAddRecipe,
  editingRecipeId,
  onCancelEdit,
  handleDeleteRecipe,
}: RecipeFormModalProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [ingredients, setIngredients] = useState<any[]>([]);

  // Try to parse ingredients from description if we are editing
  useEffect(() => {
    if (isOpen && editingRecipeId && recipeForm.description) {
      try {
        const parsed = JSON.parse(recipeForm.description);
        if (Array.isArray(parsed)) {
          setIngredients(parsed);
        } else {
          setIngredients([]);
        }
      } catch (e: any) {
        setIngredients([]);
      }
    } else if (!isOpen) {
      setIngredients([]);
    }
  }, [isOpen, editingRecipeId]);

  // Update macros when ingredients change
  useEffect(() => {
    if (ingredients.length > 0) {
      const totals = ingredients.reduce(
        (acc, ing) => ({
          kcal: acc.kcal + (ing.kcal || 0),
          protein: acc.protein + (ing.protein || 0),
          carbs: acc.carbs + (ing.carbs || 0),
          fat: acc.fat + (ing.fat || 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      );

      updateRecipeForm(
        {
          kcal: Math.round(totals.kcal * 10) / 10 + '',
          protein: Math.round(totals.protein * 10) / 10 + '',
          carbs: Math.round(totals.carbs * 10) / 10 + '',
          fat: Math.round(totals.fat * 10) / 10 + '',
          description: JSON.stringify(ingredients),
        },
        null,
      );
    } else if (ingredients.length === 0 && isOpen && !editingRecipeId) {
      // Don't auto-clear if it's an old recipe that had text description
      if (recipeForm.description.startsWith('[')) {
        updateRecipeForm(
          {
            description: '',
            kcal: '',
            protein: '',
            carbs: '',
            fat: '',
          },
          null,
        );
      }
    }
  }, [ingredients]);

  const addIngredient = (food: any) => {
    setIngredients([
      ...ingredients,
      {
        product: food.product,
        quantity: food.quantity,
        kcal: food.kcal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    const newIngs = [...ingredients];
    newIngs.splice(index, 1);
    setIngredients(newIngs);
  };

  return (
    <form
      onSubmit={handleAddRecipe}
      style={{
        marginBottom: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.6rem',
        background: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <h3 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
          {editingRecipeId ? ' Editar Receta' : ' Crear Receta con Ingredientes'}
        </h3>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isOpen ? '' : '+'}
        </span>
      </div>
      {isOpen && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}
        >
          <input
            className="form-input"
            placeholder="Nombre de receta"
            required
            value={recipeForm.name}
            onChange={(e) => updateRecipeForm('name', e.target.value)}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', fontWeight: 600 }}
          />

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
            <h4
              style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
            >
              Ingredientes
            </h4>

            {ingredients.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  marginBottom: '0.5rem',
                }}
              >
                {ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      background: 'var(--bg-card)',
                      padding: '0.4rem',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{ing.product}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {ing.quantity}g â€¢ {ing.kcal} kcal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  margin: '0 0 0.5rem 0',
                }}
              >
                No hay ingredientes. ¡Añade algunos!
              </p>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchOpen(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
              }}
            >
              <Plus size={14} /> Añadir ingrediente
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.3rem',
              opacity: ingredients.length > 0 ? 0.7 : 1,
              pointerEvents: ingredients.length > 0 ? 'none' : 'auto',
            }}
          >
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="form-input"
              placeholder="Prot total"
              value={recipeForm.protein}
              onChange={(e) => updateRecipeForm('protein', e.target.value)}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="form-input"
              placeholder="Carb total"
              value={recipeForm.carbs}
              onChange={(e) => updateRecipeForm('carbs', e.target.value)}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="form-input"
              placeholder="Grasa total"
              value={recipeForm.fat}
              onChange={(e) => updateRecipeForm('fat', e.target.value)}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="form-input"
              placeholder="Kcal total"
              value={recipeForm.kcal}
              onChange={(e) => updateRecipeForm('kcal', e.target.value)}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {editingRecipeId && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem', flex: 1, fontSize: '0.85rem' }}
                  onClick={onCancelEdit}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.85rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: 'var(--color-danger)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDeleteRecipe(editingRecipeId)}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.4rem', flex: 2, fontSize: '0.85rem', fontWeight: 600 }}
            >
              {editingRecipeId ? 'Actualizar Receta' : 'Guardar Receta'}
            </button>
          </div>
        </div>
      )}
      <FoodSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onCustomAdd={addIngredient}
      />
    </form>
  );
}




