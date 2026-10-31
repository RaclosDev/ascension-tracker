import { ModalFrame } from '../ui/ModalFrame';
import { QueryErrorNotice } from '../QueryErrorNotice';
import React, { useMemo } from 'react';
import { Utensils, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Meal, SavedFood } from '../../types/api';

interface MealSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFoods: Set<number>;
  savedFoods: SavedFood[];
  bulkQuantities: Record<string, number>;
  setBulkQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  mealSelectorDate: string;
  setMealSelectorDate: (date: string) => void;
  isAddingToMeal: boolean;
  handleBulkAddToMeal: (mealIndex: number, mealKey?: string) => void;
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
  handleBulkAddToMeal,
}: MealSelectorModalProps) {
  const foodMap = useMemo(() => new Map(savedFoods.map((f) => [f.id, f])), [savedFoods]);

  const {
    data: userMeals = [],
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Meal[]>({
    queryKey: ['userMeals'],
    queryFn: async () => {
      const res = await api.get('/nutrition/meals');
      return (res.data || []).sort((a: Meal, b: Meal) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <ModalFrame
      open={isOpen}
      onClose={onClose}
      title="Añadir al Diario"
      pending={isAddingToMeal}
      className="card"
      style={{
        maxWidth: '400px',
        width: '100%',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3
          id="meal-selector-modal-title"
          style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}
        >
          {' '}
          Añadir al Diario
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {isError && <QueryErrorNotice retry={refetch} pending={isFetching} />}
      {isLoading && <p role="status">Cargando comidas...</p>}
      {!isLoading && !isError && userMeals.length === 0 && (
        <p>No hay comidas configuradas. Crea una en Ajustes para continuar.</p>
      )}
      <div>
        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
          Fecha
        </label>
        <input
          type="date"
          className="form-input"
          value={mealSelectorDate}
          onChange={(e) => setMealSelectorDate(e.target.value)}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          maxHeight: '220px',
          overflowY: 'auto',
          paddingRight: '0.5rem',
        }}
      >
        <label className="form-label" style={{ marginBottom: '0.2rem' }}>
          Cantidades (g)
        </label>
        {Array.from(selectedFoods).map((id) => {
          const food = foodMap.get(id);
          if (!food) return null;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '60%',
                }}
              >
                {food.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  aria-label={`Cantidad en gramos para ${food.name}`}
                  style={{
                    width: '70px',
                    padding: '0.25rem',
                    textAlign: 'right',
                    fontSize: '0.85rem',
                  }}
                  value={bulkQuantities[id] === undefined ? 100 : bulkQuantities[id]}
                  onChange={(e) =>
                    setBulkQuantities((prev) => ({ ...prev, [id]: Number(e.target.value) }))
                  }
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
          {userMeals.map((m, idx) => (
            <button
              key={m.id || idx}
              onClick={() => handleBulkAddToMeal(idx, m.mealKey)}
              disabled={isAddingToMeal}
              className="btn btn-secondary flex items-center justify-center gap-2"
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <Utensils className="w-4 h-4 shrink-0" />
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      </div>
    </ModalFrame>
  );
}
