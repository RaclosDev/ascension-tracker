import React from 'react';
import { normalizeString } from '../../lib/workout/format';
import { GENERIC_FOODS } from '../../lib/nutrition/generic-foods';
import { getSanitizedKcal } from '../../utils/portionHelper';
import { FoodLog } from '../../types/api';

export type SavedFoodExtended = {
  id?: number | string;
  name: string;
  brand?: string;
  kcalPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  servingSize?: number;
  servingLabel?: string;
  isRecipe?: boolean;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

interface FoodSearchResultsListProps {
  query: string;
  savedFoods: SavedFoodExtended[];
  recentLogs: FoodLog[];
  offResults: Array<Record<string, unknown>>;
  onSelectRecent: (log: FoodLog) => void;
  onSelectSaved: (food: SavedFoodExtended) => void;
  onSelectOff: (product: Record<string, unknown>) => void;
  onOpenManual: () => void;
}

export function FoodSearchResultsList({
  query,
  savedFoods,
  recentLogs,
  offResults,
  onSelectRecent,
  onSelectSaved,
  onSelectOff,
  onOpenManual,
}: FoodSearchResultsListProps) {
  const qLower = normalizeString(query.trim());

  const filteredSaved = savedFoods.filter(
    (f: SavedFoodExtended) =>
      !qLower ||
      normalizeString(f.name || '').includes(qLower) ||
      (f.brand && normalizeString(f.brand).includes(qLower)),
  );

  const filteredRecent = recentLogs.filter(
    (l: FoodLog) => !qLower || normalizeString(l.product).includes(qLower),
  );

  const filteredGeneric = GENERIC_FOODS.filter(
    (f: { name: string; brand?: string }) =>
      qLower.length > 0 &&
      (normalizeString(f.name).includes(qLower) ||
        (f.brand && normalizeString(f.brand).includes(qLower))),
  );

  return (
    <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '2rem' }}>
      <div style={{ marginTop: 0 }}>
        {filteredRecent.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Últimos Alimentos Añadidos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filteredRecent.map((log: FoodLog) => {
                const q = Number(log.quantity) || 100;
                const kcal100 = Math.round((Number(log.kcal) || 0) * (100 / q));
                return (
                  <div
                    key={log.id}
                    className="card"
                    style={{
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => onSelectRecent(log)}
                  >
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{log.product}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {kcal100} kcal / 100g
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredSaved.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Mis Alimentos Guardados
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filteredSaved.map((food: SavedFoodExtended) => (
                <div
                  key={food.id}
                  className="card"
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--accent-glow, rgba(59, 130, 246, 0.05))',
                    border: '1px solid var(--border-medium)',
                  }}
                  onClick={() => onSelectSaved(food)}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                      {food.name}{' '}
                      {food.brand && (
                        <span style={{ opacity: 0.7, fontSize: '0.85rem' }}>({food.brand})</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {food.kcalPer100g ?? food.kcal ?? 0} kcal / 100g
                      {food.servingSize && food.servingSize > 0 && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            color: 'var(--color-success)',
                          }}
                        >
                          [{food.servingSize}g / {food.servingLabel || 'ud'}]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {qLower.length > 0 && filteredGeneric.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              Alimentos Básicos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filteredGeneric.map((food: SavedFoodExtended & { image?: string }) => (
                <div
                  key={food.id}
                  className="card"
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(34, 197, 94, 0.05)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}
                  onClick={() => onSelectSaved(food)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>{food.image}</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{food.name}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {food.kcal} kcal | P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
                        <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                          [{food.servingSize}
                          {food.servingLabel}]
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* External API search results */}
      {offResults.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--color-carbs)',
              marginBottom: '0.5rem',
              marginTop: '1.5rem',
            }}
          >
            Resultados de Búsqueda
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {offResults.map((p, idx) => {
              const name = (p.product_name || p.product_name_es || 'Producto') as string;
              const brand = (p.brands || '') as string;
              const rawNut = (p.nutriments || {}) as Record<string, unknown>;
              const kcal = getSanitizedKcal(rawNut);
              const prot = (
                Number(rawNut['proteins_100g'] ?? rawNut['proteins'] ?? 0) || 0
              ).toFixed(1);
              const carb = (
                Number(rawNut['carbohydrates_100g'] ?? rawNut['carbohydrates'] ?? 0) || 0
              ).toFixed(1);
              const fat = (Number(rawNut['fat_100g'] ?? rawNut['fat'] ?? 0) || 0).toFixed(1);

              return (
                <div
                  key={(p.code as string) || idx}
                  className="card"
                  style={{
                    padding: '0.65rem 0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid var(--color-carbs)',
                  }}
                  onClick={() => onSelectOff(p)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {name}{' '}
                      {brand && (
                        <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>
                          - {brand}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      100g: <strong>{kcal} kcal</strong> | P: {prot}g | C: {carb}g | G: {fat}g
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual create fallback */}
      {(query.trim().length > 0 || offResults.length === 0) && (
        <div
          style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            marginTop: '1.5rem',
          }}
        >
          <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)' }}>
            ¿No encuentras el producto exacto?
          </p>
          <button className="btn btn-primary btn-sm" onClick={onOpenManual}>
            Crear {query ? `"${query}"` : 'alimento'} manualmente
          </button>
        </div>
      )}
    </div>
  );
}
