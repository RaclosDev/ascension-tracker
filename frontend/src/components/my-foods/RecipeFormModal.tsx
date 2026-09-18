import React from 'react';

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
  updateRecipeForm: (field: string, value: string) => void;
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
  handleDeleteRecipe
}: RecipeFormModalProps) {
  return (
    <form onSubmit={handleAddRecipe} style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.6rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={onToggle}>
        <h3 style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>{editingRecipeId ? '️ Editar Receta' : ' Añadir Nueva'}</h3>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
          <input className="form-input" placeholder="Nombre de receta" required value={recipeForm.name} onChange={e => updateRecipeForm('name', e.target.value)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
          <input className="form-input" placeholder="Descripción / Ingredientes" value={recipeForm.description} onChange={e => updateRecipeForm('description', e.target.value)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
            <input type="number" inputMode="decimal" step="0.1" className="form-input" placeholder="Prot / 100g" value={recipeForm.protein} onChange={e => updateRecipeForm('protein', e.target.value)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
            <input type="number" inputMode="decimal" step="0.1" className="form-input" placeholder="Carb / 100g" value={recipeForm.carbs} onChange={e => updateRecipeForm('carbs', e.target.value)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
            <input type="number" inputMode="decimal" step="0.1" className="form-input" placeholder="Grasa / 100g" value={recipeForm.fat} onChange={e => updateRecipeForm('fat', e.target.value)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
            <input type="number" inputMode="decimal" step="0.1" className="form-input" placeholder="Kcal / 100g" value={recipeForm.kcal} onChange={e => updateRecipeForm('kcal', e.target.value)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {editingRecipeId && (
              <>
                <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem', flex: 1, fontSize: '0.8rem' }} onClick={onCancelEdit}>Cancelar</button>
                <button type="button" style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-fat)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleDeleteRecipe(editingRecipeId)}>️</button>
              </>
            )}
            <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem', flex: 1, fontSize: '0.8rem' }}>{editingRecipeId ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </div>
      )}
    </form>
  );
}
