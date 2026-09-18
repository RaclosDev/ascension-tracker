import React from 'react';
import { Sunrise, Utensils, Moon, Apple } from 'lucide-react';

interface MealSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFoods: Set<any>;
  savedFoods: any[];
  bulkQuantities: Record<string, number>;
  setBulkQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  mealSelectorDate: string;
  setMealSelectorDate: (date: string) => void;
  isAddingToMeal: boolean;
  handleBulkAddToMeal: (mealIndex: number) => void;
}

export default function MealSelectorModal({
  isOpen,
  onClose,
  selectedFoods,
  savedFoods,
  bulkQuantities,
  setBulkQuantities,
  mealSelectorDate,
  setMealSelectorDate,
  isAddingToMeal,
  handleBulkAddToMeal
}: MealSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}> Añadir al Diario</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}></button>
        </div>
        
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem' }}>Fecha</label>
          <input type="date" className="form-input" value={mealSelectorDate} onChange={e => setMealSelectorDate(e.target.value)} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <label className="form-label" style={{ marginBottom: '0.2rem' }}>Cantidades (g)</label>
          {Array.from(selectedFoods).map(id => {
            const food = savedFoods.find(f => f.id === id);
            if (!food) return null;
            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{food.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input 
                    type="number" 
                    inputMode="decimal" 
                    className="form-input" 
                    style={{ width: '70px', padding: '0.25rem', textAlign: 'right', fontSize: '0.85rem' }} 
                    value={bulkQuantities[id] === undefined ? 100 : bulkQuantities[id]} 
                    onChange={e => setBulkQuantities(prev => ({ ...prev, [id]: Number(e.target.value) }))} 
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="form-label">¿A qué comida?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => handleBulkAddToMeal(0)} disabled={isAddingToMeal} className="btn btn-secondary flex items-center justify-center gap-2"><Sunrise className="w-4 h-4" /> Desayuno</button>
            <button onClick={() => handleBulkAddToMeal(1)} disabled={isAddingToMeal} className="btn btn-secondary flex items-center justify-center gap-2"><Utensils className="w-4 h-4" /> Comida</button>
            <button onClick={() => handleBulkAddToMeal(2)} disabled={isAddingToMeal} className="btn btn-secondary flex items-center justify-center gap-2"><Moon className="w-4 h-4" /> Cena</button>
            <button onClick={() => handleBulkAddToMeal(3)} disabled={isAddingToMeal} className="btn btn-secondary flex items-center justify-center gap-2"><Apple className="w-4 h-4" /> Snack</button>
          </div>
        </div>
      </div>
    </div>
  );
}
