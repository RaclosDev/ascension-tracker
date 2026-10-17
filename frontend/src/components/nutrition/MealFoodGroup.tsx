import React, { useMemo } from 'react';
import { ChevronDown, Copy, Plus } from 'lucide-react';
import { MealIcon } from '../MealIcon';
import { FoodLog, Macros, Meal } from '../../types/api';
import { EditingLog } from '../../types/nutrition';
import { getBasePortion } from '../../utils/nutritionHelpers';
import { SegmentedControl } from '../ui/segmented-control';
import { SwipeableRow } from '../SwipeableRow';

interface MealFoodGroupProps {
  meal: Meal;
  mealIndex: number;
  logs: FoodLog[];
  isCollapsed: boolean;
  isDragOver: boolean;
  editingLog: EditingLog | null;
  editInputMode: 'grams' | 'portions';
  onToggleCollapse: (index: number, e?: React.MouseEvent | React.KeyboardEvent) => void;
  onCopyFromYesterday: (e: React.MouseEvent<HTMLButtonElement>, index: number) => void;
  onOpenAddFoodModal: (mealIndex: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, log: FoodLog) => void;
  onDrag: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onEditLog: (log: FoodLog) => void;
  onDeleteLog: (id: number | string) => void;
  onEditInputModeChange: (mode: 'grams' | 'portions') => void;
  onEditQuantityChange: (qty: number | string) => void;
  onUpdateLog: () => void;
  onCancelEdit: () => void;
}

export const MealFoodGroup: React.FC<MealFoodGroupProps> = ({
  meal,
  mealIndex,
  logs,
  isCollapsed,
  isDragOver,
  editingLog,
  editInputMode,
  onToggleCollapse,
  onCopyFromYesterday,
  onOpenAddFoodModal,
  onDragStart,
  onDrag,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditLog,
  onDeleteLog,
  onEditInputModeChange,
  onEditQuantityChange,
  onUpdateLog,
  onCancelEdit,
}) => {
  const mealSubtotal = useMemo(() => {
    return logs.reduce(
      (acc: Macros, log: FoodLog) => ({
        kcal: acc.kcal + (Number(log.kcal) || 0),
        protein: acc.protein + (Number(log.protein) || 0),
        carbs: acc.carbs + (Number(log.carbs) || 0),
        fat: acc.fat + (Number(log.fat) || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [logs]);

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        border: isDragOver ? '2px dashed var(--color-carbs)' : undefined,
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
      onDragOver={(e) => onDragOver(e, mealIndex)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, mealIndex)}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-label={`${meal.name}, ${logs.length} alimentos, ${Math.round(mealSubtotal.kcal)} kcal`}
          onClick={(e) => onToggleCollapse(mealIndex, e)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          <ChevronDown
            size={18}
            aria-hidden="true"
            style={{
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: 'var(--text-secondary)',
            }}
          />
          <span style={{ marginRight: 'var(--space-xs)' }}>
            <MealIcon
              iconString={meal.icon || meal.name}
              className="w-5 h-5 inline-block text-[var(--text-secondary)]"
            />
          </span>{' '}
          {meal.name}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{
              padding: '0.45rem',
              borderRadius: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Copiar comida de ayer"
            aria-label={`Copiar comida ${meal.name} de ayer`}
            onClick={(e) => onCopyFromYesterday(e, mealIndex)}
          >
            <Copy size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={`Añadir alimento a ${meal.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddFoodModal(mealIndex);
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="meal-subtotal-row" style={{ marginBottom: isCollapsed ? '0' : '0.75rem' }}>
          <span className="subtotal-val kcal">{Math.round(mealSubtotal.kcal)} kcal</span>
          <span className="subtotal-dot"></span>
          <span className="subtotal-val">P: {mealSubtotal.protein.toFixed(1)}g</span>
          <span className="subtotal-dot"></span>
          <span className="subtotal-val">C: {mealSubtotal.carbs.toFixed(1)}g</span>
          <span className="subtotal-dot"></span>
          <span className="subtotal-val">G: {mealSubtotal.fat.toFixed(1)}g</span>
        </div>
      )}

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs.length === 0 ? (
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontStyle: 'italic',
                marginTop: '0.25rem',
              }}
            >
              Sin registrar
            </div>
          ) : (
            logs.map((log: FoodLog) => (
              <div
                key={log.id}
                draggable
                onDragStart={(e) => onDragStart(e, log)}
                onDrag={(e) => onDrag(e)}
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'grab',
                }}
              >
                {editingLog && editingLog.id === log.id ? (
                  /* EDIT MODE */
                  <div
                    style={{
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 500,
                        marginBottom: '0.15rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{editingLog.product}</span>
                    </div>
                    {(() => {
                      const basePortion = getBasePortion(editingLog.portionsJson || null);
                      const hasPortions = !!basePortion && basePortion.amount > 0;
                      const multiplier =
                        hasPortions && editingLog.quantity
                          ? Number((editingLog.quantity / basePortion.amount).toFixed(2))
                          : 0;
                      const portionLabel = basePortion
                        ? basePortion.label.replace(/^1\s*/, '')
                        : 'ud';

                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {hasPortions && (
                            <div style={{ width: '100%' }}>
                              <SegmentedControl
                                options={[
                                  { label: 'Gramos', value: 'grams' },
                                  { label: 'Porción', value: 'portions' },
                                ]}
                                value={editInputMode}
                                onChange={(val: string) =>
                                  onEditInputModeChange(val as 'grams' | 'portions')
                                }
                              />
                            </div>
                          )}

                          {editInputMode === 'grams' || !hasPortions ? (
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <input
                                type="number"
                                inputMode="decimal"
                                className="form-input"
                                style={{
                                  fontSize: '1.2rem',
                                  padding: '0.5rem',
                                  fontWeight: 600,
                                  width: '100px',
                                  textAlign: 'center',
                                }}
                                aria-label="Cantidad en gramos"
                                value={editingLog.quantity === 0 ? '' : editingLog.quantity}
                                onChange={(e) => onEditQuantityChange(e.target.value)}
                                autoFocus
                              />
                              <span
                                style={{
                                  fontSize: '1.1rem',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                g
                              </span>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <button
                                type="button"
                                className="btn btn-secondary"
                                aria-label="Restar una porción"
                                onClick={() =>
                                  onEditQuantityChange(
                                    Math.max(0, (multiplier - 1) * basePortion.amount),
                                  )
                                }
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  fontSize: '1.2rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                inputMode="decimal"
                                className="form-input"
                                style={{
                                  fontSize: '1.2rem',
                                  padding: '0.5rem',
                                  fontWeight: 600,
                                  width: '80px',
                                  textAlign: 'center',
                                }}
                                aria-label="Número de porciones"
                                value={multiplier === 0 ? '' : multiplier}
                                onChange={(e) =>
                                  onEditQuantityChange(Number(e.target.value) * basePortion.amount)
                                }
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                aria-label="Sumar una porción"
                                onClick={() =>
                                  onEditQuantityChange((multiplier + 1) * basePortion.amount)
                                }
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  fontSize: '1.2rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                }}
                              >
                                +
                              </button>
                              <span
                                style={{
                                  fontSize: '1.1rem',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                x {portionLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {Math.round(editingLog.kcal)} kcal | P: {editingLog.protein.toFixed(1)}g | C:{' '}
                      {editingLog.carbs.toFixed(1)}g | G: {editingLog.fat.toFixed(1)}g
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.6rem' }}
                        onClick={onCancelEdit}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.3rem 0.6rem' }}
                        onClick={onUpdateLog}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <SwipeableRow
                    onEdit={() => onEditLog(log)}
                    onDelete={() => log.id !== undefined && onDeleteLog(log.id)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: '0.15rem' }}>
                          {log.product}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {(() => {
                              const basePortion = getBasePortion(log.portionsJson || null);
                              if (basePortion && basePortion.amount > 0) {
                                const count = Number(
                                  (log.quantity / basePortion.amount).toFixed(1),
                                );
                                return `${count}x ${basePortion.label} (${log.quantity}g)`;
                              }
                              return `${log.quantity}g`;
                            })()}
                          </span>
                          {' • '}
                          {Math.round(Number(log.kcal) || 0)} kcal | P:{' '}
                          {(Number(log.protein) || 0).toFixed(1)}g | C:{' '}
                          {(Number(log.carbs) || 0).toFixed(1)}g | G:{' '}
                          {(Number(log.fat) || 0).toFixed(1)}g
                        </div>
                      </div>
                    </div>
                  </SwipeableRow>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
