import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import api from '../api/client';
import { MealIcon } from './MealIcon';

const DEFAULT_MEALS = [
  { name: 'Desayuno', icon: '', sortOrder: 0, startTime: '06:00', endTime: '11:00' },
  { name: 'Comida', icon: '', sortOrder: 1, startTime: '13:00', endTime: '17:00' },
  { name: 'Cena', icon: '', sortOrder: 2, startTime: '20:00', endTime: '05:59' },
  { name: 'Snacks', icon: '', sortOrder: 3, startTime: '11:00', endTime: '13:00', isDefault: true }
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
      await api.post('/nutrition/meals', { name: 'Nueva Comida', icon: '', startTime: '12:00', endTime: '13:00' });
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

  const handleTimeBlur = (index, field, val) => {
    if (!val) return;
    let clean = val.replace(/[^\d:]/g, '');
    let h, m;
    if (clean.includes(':')) {
      let parts = clean.split(':');
      h = parts[0].padStart(2, '0').slice(0, 2);
      m = (parts[1] || '00').padStart(2, '0').slice(0, 2);
    } else {
      if (clean.length <= 2) {
        h = clean.padStart(2, '0');
        m = '00';
      } else if (clean.length === 3) {
        h = clean.slice(0, 1).padStart(2, '0');
        m = clean.slice(1, 3);
      } else {
        h = clean.slice(0, 2);
        m = clean.slice(2, 4);
      }
    }
    
    // validate 24h
    if (parseInt(h) > 23) h = '23';
    if (parseInt(m) > 59) m = '59';
    
    updateMeal(index, field, `${h}:${m}`);
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
                      {/* Primera Fila: Reordenar, Icono, Nombre y Eliminar */}
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
                          style={{ width: '48px', textAlign: 'center', padding: '8px 4px' }}
                          value={meal.icon || ''}
                          onChange={e => updateMeal(index, 'icon', e.target.value)}
                          placeholder="Icono"
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          value={meal.name || ''}
                          onChange={e => updateMeal(index, 'name', e.target.value)}
                          placeholder="Nombre"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', marginRight: '4px' }}>
                          <input 
                            type="radio" 
                            name="defaultMeal"
                            checked={meal.isDefault || false}
                            onChange={() => {
                              const updated = meals.map((m, i) => ({ ...m, isDefault: i === index }));
                              setMeals(updated);
                            }}
                            title="Comida abierta por defecto"
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Fija</span>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleDeleteMeal(meal.id)}
                          disabled={saving}
                          title="Eliminar comida"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Fila intermedia: Horarios */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Hora Inicio</span>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                            value={meal.startTime || ''}
                            placeholder="Ej: 06:00"
                            onChange={e => updateMeal(index, 'startTime', e.target.value)}
                            onBlur={e => handleTimeBlur(index, 'startTime', e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Hora Fin</span>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '6px', fontSize: '0.85rem' }}
                            value={meal.endTime || ''}
                            placeholder="Ej: 11:00"
                            onChange={e => updateMeal(index, 'endTime', e.target.value)}
                            onBlur={e => handleTimeBlur(index, 'endTime', e.target.value)}
                          />
                        </div>
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
            🔄 Restablecer comidas por defecto
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
          ＋ Añadir Comida
        </button>
        <button
          className="btn btn-secondary"
          style={{ borderStyle: 'dashed' }}
          onClick={handleResetDefaults}
          disabled={saving}
          title="Restablecer las 4 comidas por defecto (Desayuno, Comida, Cena, Snacks)"
        >
          🔄 Por Defecto
        </button>
      </div>

      <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving || loading || meals.length === 0}>
        {saving ? 'Guardando...' : 'Guardar Comidas y Macros'}
      </button>
    </div>
  );
}
