import React, { useState, useRef, useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { isPrSet, previousSetLabel, matchVariant } from '@/lib/workout/format';
import { initAudioAndNotifications } from '@/lib/workout/notifications';
import { haptics } from '@/lib/haptics';
import { useWorkoutStore } from '@/lib/workout/store';
import {
  SET_TYPE_LABEL,
  type WorkoutExercise,
  type WorkoutSet,
  type CompletedWorkout,
} from '@/lib/workout/types';
import { useSwipe } from '@/hooks/use-swipe';

export interface SwipeableSetRowProps {
  s?: WorkoutSet;
  setId?: string;
  rowId?: string;
  exerciseId?: string;
  variant?: WorkoutExercise['variant'];
  i: number;
  workingIndex: number;
  showRpe: boolean;
  isCardio: boolean;
  cols: string;
  recentWorkouts: CompletedWorkout[];
  activeStepper?: { setId: string; field: 'weight' | 'reps' } | null;
  setActiveStepper?: React.Dispatch<
    React.SetStateAction<{ setId: string; field: 'weight' | 'reps' } | null>
  >;
}

export const SwipeableSetRow = React.memo(
  function SwipeableSetRow({
    s: propSet,
    setId,
    rowId: propRowId,
    exerciseId: propExerciseId,
    variant: propVariant,
    i,
    workingIndex,
    showRpe,
    isCardio,
    cols,
    recentWorkouts,
    activeStepper,
    setActiveStepper,
  }: SwipeableSetRowProps) {
    const rowId = propRowId ?? '';
    const effectiveSetId = setId ?? propSet?.id ?? '';
    const exerciseId = propExerciseId ?? '';
    const variant = propVariant;

    // Consumo granular por fila/serie
    const storeSet = useWorkoutStore((state) =>
      state.active?.exercises
        .find((e) => e.id === rowId)
        ?.sets.find((set) => set.id === effectiveSetId),
    );
    const s = storeSet ?? propSet;

    const updateSet = useWorkoutStore((s) => s.updateSet);
    const cycleSetType = useWorkoutStore((s) => s.cycleSetType);
    const toggleSet = useWorkoutStore((s) => s.toggleSet);
    const removeSet = useWorkoutStore((s) => s.removeSet);

    const { offsetX, swiped, isDragging, closeSwipe, touchHandlers } = useSwipe();
    const [deleteFocused, setDeleteFocused] = useState(false);
    const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      };
    }, []);

    if (!s) return null;

    const prev = previousSetLabel(exerciseId, variant, i, recentWorkouts);
    const pr = s.completed && isPrSet(exerciseId, variant, s.weight, recentWorkouts);
    const typeLabel = SET_TYPE_LABEL[s.type] || String(workingIndex + 1);

    const isWeightStepperOpen =
      !isCardio &&
      !s.completed &&
      activeStepper?.setId === effectiveSetId &&
      activeStepper?.field === 'weight';
    const isRepsStepperOpen =
      !isCardio &&
      !s.completed &&
      activeStepper?.setId === effectiveSetId &&
      activeStepper?.field === 'reps';

    const adjustWeight = (delta: number) => {
      haptics.step();
      const currentStr = String(s.weight || '')
        .replace(',', '.')
        .trim();
      let baseNum = parseFloat(currentStr);
      if (Number.isNaN(baseNum) || !Number.isFinite(baseNum)) {
        const prevWeight = prev !== '' ? parseFloat(prev.split('×')[0]?.trim()) : 0;
        baseNum = !Number.isNaN(prevWeight) ? prevWeight : 0;
      }
      const nextVal = Math.max(0, Math.round((baseNum + delta) * 100) / 100);
      updateSet(rowId, s.id, { weight: nextVal.toString() });
    };

    const adjustReps = (delta: number) => {
      haptics.step();
      const currentStr = String(s.reps || '')
        .replace(/[^\d]/g, '')
        .trim();
      let baseNum = parseInt(currentStr, 10);
      if (Number.isNaN(baseNum)) {
        const prevReps =
          prev !== '' ? parseInt(prev.split('×')[1]?.replace(/[^\d]/g, '')?.trim() || '0', 10) : 0;
        baseNum = !Number.isNaN(prevReps) ? prevReps : 0;
      }
      const nextVal = Math.max(0, baseNum + delta);
      updateSet(rowId, s.id, { reps: nextVal.toString() });
    };

    return (
      <div className="set-row-wrapper" style={{ position: 'relative' }}>
        {/* Swipeable row; the trash button stays within the row height */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
          <div
            {...touchHandlers}
            onClick={swiped ? closeSwipe : undefined}
            className={`set-row ${s.completed ? 'completed' : ''}`}
            style={{
              gridTemplateColumns: cols,
              transform: `translateX(${offsetX}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.2s ease',
              background: s.completed
                ? 'rgba(var(--accent-primary-rgb, 0, 133, 255), 0.05)'
                : 'var(--bg-card)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Set number + previous info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.05rem',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cycleSetType(rowId, s.id);
                  haptics.light();
                }}
                title="Cambiar tipo de serie"
                className={`set-type-btn ${s.type === 'warmup' ? 'warmup' : s.type === 'failure' ? 'failure' : ''}`}
              >
                {typeLabel}
              </button>
              {prev !== '' && (
                <span
                  style={{
                    fontSize: '0.55rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    maxWidth: '48px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1,
                  }}
                >
                  {prev}
                </span>
              )}
              {pr && (
                <span
                  style={{
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary-light)',
                  }}
                >
                  PR
                </span>
              )}
            </div>

            <input
              inputMode="decimal"
              value={isCardio ? s.distance || '' : s.weight || ''}
              placeholder={prev === '' ? '0' : prev.split('×')[0]?.trim()}
              onFocus={(e) => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                if (!s.completed) {
                  setActiveStepper?.({ setId: effectiveSetId, field: 'weight' });
                }
                e.currentTarget.select();
              }}
              onClick={(e) => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                if (!s.completed) {
                  setActiveStepper?.({ setId: effectiveSetId, field: 'weight' });
                }
                e.currentTarget.select();
              }}
              onChange={(e) => {
                if (isCardio) {
                  updateSet(rowId, s.id, { distance: e.target.value.replace(',', '.') });
                } else {
                  updateSet(rowId, s.id, { weight: e.target.value.replace(',', '.') });
                }
              }}
              onBlur={(e) => {
                blurTimeoutRef.current = setTimeout(() => {
                  setActiveStepper?.((curr) => (curr?.setId === effectiveSetId ? null : curr));
                }, 300);
                const val = e.target.value.replace(',', '.').trim();
                if (val) {
                  const num = parseFloat(val);
                  if (!Number.isNaN(num) && Number.isFinite(num)) {
                    const rounded = (Math.round(num * 100) / 100).toString();
                    if (rounded !== val) {
                      if (isCardio) {
                        updateSet(rowId, s.id, { distance: rounded });
                      } else {
                        updateSet(rowId, s.id, { weight: rounded });
                      }
                    }
                  }
                }
              }}
              className={`set-input ${s.completed ? 'completed' : ''}`}
            />
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={isCardio ? s.duration || '' : s.reps || ''}
              placeholder={
                prev === '' ? '0' : prev.split('×')[1]?.replace(/[^\d]/g, '')?.trim() || '0'
              }
              onFocus={(e) => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                if (!s.completed) {
                  setActiveStepper?.({ setId: effectiveSetId, field: 'reps' });
                }
                e.currentTarget.select();
              }}
              onClick={(e) => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                if (!s.completed) {
                  setActiveStepper?.({ setId: effectiveSetId, field: 'reps' });
                }
                e.currentTarget.select();
              }}
              onChange={(e) => {
                if (isCardio) {
                  updateSet(rowId, s.id, { duration: e.target.value });
                } else {
                  updateSet(rowId, s.id, { reps: e.target.value.replace(/[^\d]/g, '') });
                }
              }}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => {
                  setActiveStepper?.((curr) => (curr?.setId === effectiveSetId ? null : curr));
                }, 300);
              }}
              className={`set-input ${s.completed ? 'completed' : ''}`}
            />

            {showRpe && (
              <input
                inputMode="decimal"
                value={s.rpe || ''}
                placeholder=""
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => updateSet(rowId, s.id, { rpe: e.target.value.replace(',', '.') })}
                className={`set-input ${s.completed ? 'completed' : ''}`}
              />
            )}

            <button
              type="button"
              className="desktop-row-delete-btn"
              title="Eliminar serie"
              aria-label={`Borrar serie ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                haptics.warning();
                setActiveStepper?.(null);
                removeSet(rowId, s.id);
              }}
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                initAudioAndNotifications();
                setActiveStepper?.(null);
                toggleSet(rowId, s.id);
                if (!s.completed) {
                  haptics.success();
                } else {
                  haptics.light();
                }
              }}
              aria-label={s.completed ? 'Desmarcar serie' : 'Completar serie'}
              className={`set-check-btn ${s.completed ? 'checked' : ''}`}
              style={
                s.completed
                  ? {
                      background: 'var(--accent-primary)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--accent-text, #ffffff)',
                    }
                  : undefined
              }
            >
              <Check size={16} strokeWidth={s.completed ? 3 : 2} />
            </button>
          </div>

          {/* Accessible delete button, pinned to the row height */}
          <button
            type="button"
            aria-label={`Eliminar serie ${i + 1}`}
            onFocus={() => setDeleteFocused(true)}
            onBlur={() => setDeleteFocused(false)}
            onClick={(e) => {
              e.stopPropagation();
              haptics.warning();
              setActiveStepper?.(null);
              removeSet(rowId, s.id);
            }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ef4444',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
              opacity: offsetX <= -40 || deleteFocused ? 1 : 0,
              pointerEvents: offsetX <= -40 || deleteFocused ? 'auto' : 'none',
              zIndex: deleteFocused ? 10 : 0,
              transition: 'opacity 0.15s ease',
              outline: deleteFocused ? '2px solid var(--accent-primary, #ffffff)' : 'none',
              outlineOffset: '-2px',
            }}
          >
            <Trash2 size={18} color="white" />
          </button>
        </div>

        {isWeightStepperOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            }}
            className="flex items-center justify-between gap-1 px-3 py-2 mt-1.5 bg-[#1C1C1E] border border-[var(--accent-primary)]/40 rounded-xl text-xs shadow-lg animate-fadeIn z-10 relative select-none"
          >
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[var(--accent-primary-light)] pr-1">
                Kg
              </span>
              {[-5, -2.5, -1.25].map((d) => (
                <button
                  key={d}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    adjustWeight(d);
                  }}
                  className="px-3 py-2 min-h-[40px] min-w-[42px] flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-white font-semibold tabular-nums text-xs transition select-none touch-manipulation"
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1">
              {[+1.25, +2.5, +5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    adjustWeight(d);
                  }}
                  className="px-3 py-2 min-h-[40px] min-w-[42px] flex items-center justify-center rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110 active:scale-95 font-bold tabular-nums text-xs transition shadow-sm select-none touch-manipulation"
                >
                  +{d}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRepsStepperOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            }}
            className="flex items-center justify-between gap-1 px-3 py-2 mt-1.5 bg-[#1C1C1E] border border-[var(--accent-primary)]/40 rounded-xl text-xs shadow-lg animate-fadeIn z-10 relative select-none"
          >
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-[var(--accent-primary-light)] pr-1">
                Reps
              </span>
              {[-2, -1].map((d) => (
                <button
                  key={d}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    adjustReps(d);
                  }}
                  className="px-3 py-2 min-h-[40px] min-w-[42px] flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 text-white font-semibold tabular-nums text-xs transition select-none touch-manipulation"
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-1">
              {[+1, +2, +5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    adjustReps(d);
                  }}
                  className="px-3 py-2 min-h-[40px] min-w-[42px] flex items-center justify-center rounded-xl bg-[var(--accent-primary)] text-white hover:brightness-110 active:scale-95 font-bold tabular-nums text-xs transition shadow-sm select-none touch-manipulation"
                >
                  +{d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    const prevActive =
      prev.activeStepper && prev.activeStepper.setId === prev.setId
        ? prev.activeStepper.field
        : null;
    const nextActive =
      next.activeStepper && next.activeStepper.setId === next.setId
        ? next.activeStepper.field
        : null;
    if (prevActive !== nextActive) return false;

    return (
      prev.setId === next.setId &&
      prev.rowId === next.rowId &&
      prev.i === next.i &&
      prev.workingIndex === next.workingIndex &&
      prev.showRpe === next.showRpe &&
      prev.isCardio === next.isCardio &&
      prev.cols === next.cols &&
      prev.exerciseId === next.exerciseId &&
      matchVariant(prev.variant, next.variant) &&
      prev.recentWorkouts === next.recentWorkouts
    );
  },
);
