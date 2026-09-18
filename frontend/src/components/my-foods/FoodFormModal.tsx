import React from 'react';

interface FoodForm {
  name: string;
  brand: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
  servingSize: string;
  servingLabel: string;
}

interface FoodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodForm: FoodForm;
  updateFoodForm: (field: string, value: string) => void;
  handleAddSavedFood: (e: React.FormEvent) => void;
  editingFoodId: number | string | null;
}

export default function FoodFormModal({
  isOpen,
  onClose,
  foodForm,
  updateFoodForm,
  handleAddSavedFood,
  editingFoodId
}: FoodFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingFoodId ? '✏️ Editar Alimento' : '➕ Crear Alimento'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        
        <form onSubmit={handleAddSavedFood} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label className="form-label">Nombre *</label>
            <input className="form-input" required value={foodForm.name} onChange={e => updateFoodForm('name', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Marca</label>
            <input className="form-input" value={foodForm.brand} onChange={e => updateFoodForm('brand', e.target.value)} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label className="form-label">Prot / 100g</label>
              <input type="number" inputMode="decimal" step="0.1" className="form-input" value={foodForm.protein} onChange={e => updateFoodForm('protein', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Carb / 100g</label>
              <input type="number" inputMode="decimal" step="0.1" className="form-input" value={foodForm.carbs} onChange={e => updateFoodForm('carbs', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Grasa / 100g</label>
              <input type="number" inputMode="decimal" step="0.1" className="form-input" value={foodForm.fat} onChange={e => updateFoodForm('fat', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Kcal / 100g</label>
              <input type="number" inputMode="decimal" step="0.1" className="form-input" value={foodForm.kcal} onChange={e => updateFoodForm('kcal', e.target.value)} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label className="form-label">Ración (g)</label>
              <input type="number" inputMode="decimal" step="0.1" className="form-input" placeholder="Ej: 30" value={foodForm.servingSize} onChange={e => updateFoodForm('servingSize', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Etiqueta ración</label>
              <input className="form-input" placeholder="Ej: 1 cazo" value={foodForm.servingLabel} onChange={e => updateFoodForm('servingLabel', e.target.value)} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingFoodId ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
