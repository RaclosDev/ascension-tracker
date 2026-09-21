import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import api from '../api/client';
import { MealIcon } from './MealIcon';

import { Trash2 } from 'lucide-react';

const DEFAULT_MEALS = [
  { name: 'Desayuno', icon: '', sortOrder: 0 },
  { name: 'Comida', icon: '', sortOrder: 1 },
  { name: 'Cena', icon: '', sortOrder: 2 },
  { name: 'Snacks', icon: '', sortOrder: 3 }
];

export default function MealConfigurator({ onSaved }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      try {
        const res = await api.post('/nutrition/meals/reset');
        const sorted = (res.data || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setMeals(sorted);
        toast.success('Comidas por defecto restablecidas (Desayuno, Comida, Cena, Snacks)');
        if (onSaved) onSaved();
        return;
      } catch {
        // Fallback si el backend todavía no se ha reiniciado
        for (const m of DEFAULT_MEALS) {
          await api.post('/nutrition/meals', m);
        }
        const res = await api.get('/nutrition/meals');
        const sorted = (res.data || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setMeals(sorted);
        toast.success('Comidas por defecto restablecidas');
        if (onSaved) onSaved();
      }
    } catch {
      toast.error('Error al restablecer comidas');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/nutrition/meals');
      if (!res.data || res.data.length === 0) {
        await handleResetDefaults();
        return;
      }
      const sorted = res.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMeals(sorted);
    } catch {
      toast.error('Error al cargar comidas');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(meals);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setMeals(items);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = meals.filter(m => m.id).map((m, i) => ({
        ...m,
        sortOrder: i
      }));
      await api.put('/nutrition/meals', payload);
      toast.success('Comidas y macros actualizados');
      if (onSaved) onSaved();
    } catch {
      toast.error('Error al guardar comidas');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMeal = async () => {
    setSaving(true);
    try {
      await api.post('/nutrition/meals', { name: 'Nueva Comida', icon: '' });
      await fetchMeals();
    } catch {
      toast.error('Error al añadir comida');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm('¿Eliminar esta comida? Los registros de esta comida se perderán.')) return;
    setSaving(true);
    try {
      await api.delete(`/nutrition/meals/${id}`);
      await fetchMeals();
      if (onSaved) onSaved();
    } catch {
      toast.error('Error al eliminar comida');
    } finally {
      setSaving(false);
    }
  };

  const updateMeal = (index, field, value) => {
    const updated = [...meals];
    updated[index] = { ...updated[index], [field]: value };
    setMeals(updated);
  };



  if (loading) return <div className="spinner" style={{ margin: 'auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="mealsList">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
            >
              {meals.map((meal, index) => (
                <Draggable key={meal.id.toString()} draggableId={meal.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px', 
                        background: snapshot.isDragging ? 'var(--bg-glass-strong)' : 'var(--bg-glass)', 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)',
                        boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.3)' : 'none',
                        ...provided.draggableProps.style
                      }}
                    >
                      {/* Primera Fila: Reordenar, Nombre y Eliminar */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div 
                          {...provided.dragHandleProps} 
                          style={{ 
                            padding: '8px', 
                            cursor: 'grab', 
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'none'
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                        </div>

                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          value={meal.name || ''}
                          onChange={e => updateMeal(index, 'name', e.target.value)}
                          placeholder="Nombre"
                        />
                        <button
                          className="btn"
                          style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#ef4444' }}
                          onClick={() => handleDeleteMeal(meal.id)}
                          disabled={saving}
                          title="Eliminar comida"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Tercera Fila: Macros fijos */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-protein)', fontWeight: 600 }}>Proteínas (g)</span>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                            value={meal.fixedProtein ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateMeal(index, 'fixedProtein', val === '' ? null : parseFloat(val));
                            }}
                            placeholder="Auto"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-carbs)', fontWeight: 600 }}>Hidratos (g)</span>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                            value={meal.fixedCarbs ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateMeal(index, 'fixedCarbs', val === '' ? null : parseFloat(val));
                            }}
                            placeholder="Auto"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-fat)', fontWeight: 600 }}>Grasas (g)</span>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                            value={meal.fixedFat ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateMeal(index, 'fixedFat', val === '' ? null : parseFloat(val));
                            }}
                            placeholder="Auto"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {meals.length === 0 && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ margin: '0 0 12px 0' }}>No tienes comidas configuradas.</p>
          <button className="btn btn-secondary btn-sm" onClick={handleResetDefaults} disabled={saving}>
             Restablecer comidas por defecto
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, borderStyle: 'dashed' }}
          onClick={handleAddMeal}
          disabled={saving}
        >
           Añadir Comida
        </button>
        <button
          className="btn btn-secondary"
          style={{ borderStyle: 'dashed' }}
          onClick={handleResetDefaults}
          disabled={saving}
          title="Restablecer las 4 comidas por defecto (Desayuno, Comida, Cena, Snacks)"
        >
           Por Defecto
        </button>
      </div>

      <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving || loading || meals.length === 0}>
        {saving ? 'Guardando...' : 'Guardar Comidas y Macros'}
      </button>
    </div>
  );
}
