import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { getExerciseMap } from '@/lib/workout/exercises';
import { isPrSet, previousSetLabel, formatVariant } from '@/lib/workout/format';
import { initAudioAndNotifications } from '@/lib/workout/notifications';
import { useWorkoutStore } from '@/lib/workout/store';
import { VariantSelector } from './variant-selector';
import {
  useRecentWorkouts,
  useCustomExercises,
  useWorkoutPreferencesActions,
} from '@/lib/workout/api';
import {
  MUSCLE_LABEL,
  SET_TYPE_LABEL,
  type WorkoutExercise,
  type WorkoutSet,
  type CompletedWorkout,
} from '@/lib/workout/types';

import { useSwipe } from '@/hooks/use-swipe';

function SwipeableSetRow({
  s,
  i,
  row,
  showRpe,
  isCardio,
  cols,
  workingIndex,
  recentWorkouts,
}: {
  s: WorkoutSet;
  i: number;
  row: WorkoutExercise;
  showRpe: boolean;
  isCardio: boolean;
  cols: string;
  workingIndex: number;
  recentWorkouts: CompletedWorkout[];
}) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const cycleSetType = useWorkoutStore((s) => s.cycleSetType);
  const toggleSet = useWorkoutStore((s) => s.toggleSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);

  const prev = previousSetLabel(row.exerciseId, row.variant, i, recentWorkouts);
  const pr = s.completed && isPrSet(row.exerciseId, row.variant, s.weight, recentWorkouts);
  const typeLabel = SET_TYPE_LABEL[s.type] || String(workingIndex + 1);

  // Optimización Pro: Extraída la lógica táctil a un hook puro
  const { offsetX, swiped, isDragging, closeSwipe, touchHandlers } = useSwipe();

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
      {/* Delete button behind */}
      <div
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
          borderRadius: '0 8px 8px 0',
          cursor: 'pointer',
          opacity: offsetX < -10 ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}
        onClick={() => removeSet(row.id, s.id)}
      >
        <Trash2 size={18} color="white" />
      </div>

      {/* Swipeable row */}
      <div
        {...touchHandlers}
        onClick={swiped ? closeSwipe : undefined}
        className={`set-row ${s.completed ? 'completed' : ''}`}
        style={{
          gridTemplateColumns: cols,
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          background: s.completed ? 'rgba(0, 133, 255, 0.04)' : 'var(--bg-card)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Set number + previous info */}
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.05rem' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleSetType(row.id, s.id);
            }}
            title="Cambiar tipo de serie"
            className={`set-type-btn ${s.type === 'warmup' ? 'warmup' : s.type === 'failure' ? 'failure' : ''}`}
            style={{ width: '30px', height: '28px', fontSize: '0.7rem' }}
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
                textTransform: 'uppercase',
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
          onChange={(e) => {
            if (isCardio) {
              updateSet(row.id, s.id, { distance: e.target.value.replace(',', '.') });
            } else {
              updateSet(row.id, s.id, { weight: e.target.value.replace(',', '.') });
            }
          }}
          className={`set-input ${s.completed ? 'completed' : ''}`}
        />
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={isCardio ? s.duration || '' : s.reps || ''}
          placeholder="0"
          onChange={(e) => {
            if (isCardio) {
              updateSet(row.id, s.id, { duration: e.target.value });
            } else {
              updateSet(row.id, s.id, { reps: e.target.value.replace(/[^\d]/g, '') });
            }
          }}
          className={`set-input ${s.completed ? 'completed' : ''}`}
        />

        {showRpe && (
          <input
            inputMode="decimal"
            value={s.rpe || ''}
            placeholder=""
            onChange={(e) => updateSet(row.id, s.id, { rpe: e.target.value.replace(',', '.') })}
            className={`set-input ${s.completed ? 'completed' : ''}`}
          />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            initAudioAndNotifications();
            toggleSet(row.id, s.id);
          }}
          aria-label={s.completed ? 'Desmarcar serie' : 'Completar serie'}
          className={`set-check-btn ${s.completed ? 'checked' : ''}`}
        >
          <Check size={16} strokeWidth={s.completed ? 3 : 2} />
        </button>
      </div>
    </div>
  );
}

export const ExerciseCard = React.memo(function ExerciseCard({
  row,
  index,
  total,
}: {
  row: WorkoutExercise;
  index: number;
  total: number;
}) {
  const { data: customExercises = [] } = useCustomExercises();
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const setExerciseNotes = useWorkoutStore((s) => s.setExerciseNotes);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);
  const restTimers = useWorkoutStore((s) => s.restTimers);
  const restPreset = useWorkoutStore((s) => s.restPreset);
  const setExerciseRestTimer = useWorkoutStore((s) => s.setExerciseRestTimer);
  const updateExerciseVariant = useWorkoutStore((s) => s.updateExerciseVariant);
  const customGifs: Record<string, string> = {};
  const [editingVariant, setEditingVariant] = useState(false);

  const catalog = getExerciseMap(customExercises);
  const meta = catalog.get(row.exerciseId);
  const historicalMachines = React.useMemo(() => {
    const machines = new Set<string>();
    for (const w of recentWorkouts) {
      for (const ex of w.exercises) {
        if (ex.exerciseId === row.exerciseId && ex.variant?.machine) {
          machines.add(ex.variant.machine);
        }
      }
    }
    const arr = Array.from(machines).sort();
    if (
      arr.length === 0 &&
      (meta?.equipment === 'maquina' ||
        meta?.equipment === 'polea' ||
        meta?.equipment === 'multipower')
    ) {
      return ['Hammer Strength', 'Technogym', 'Technogym Discos'];
    }
    return arr;
  }, [row.exerciseId, recentWorkouts, meta]);

  const historicalGrips = React.useMemo(() => {
    const grips = new Set<string>();
    for (const w of recentWorkouts) {
      for (const ex of w.exercises) {
        if (ex.exerciseId === row.exerciseId && ex.variant?.grip) {
          grips.add(ex.variant.grip);
        }
      }
    }
    return Array.from(grips).sort();
  }, [row.exerciseId, recentWorkouts]);
  const { prefs, addGlobalMachine, addGlobalGrip, addExerciseVariant } =
    useWorkoutPreferencesActions();
  const globalMachines = prefs?.globalMachines || [];
  const globalGrips = prefs?.globalGrips || [];
  const exerciseVariants = prefs?.exerciseVariants || {};

  const customGripsArray = React.useMemo(() => {
    return exerciseVariants[row.exerciseId]?.grips || [];
  }, [row.exerciseId, exerciseVariants]);

  const customMachinesArray = React.useMemo(() => {
    return exerciseVariants[row.exerciseId]?.machines || [];
  }, [row.exerciseId, exerciseVariants]);

  const finalHistoricalGrips = React.useMemo(() => {
    return Array.from(new Set([...historicalGrips, ...customGripsArray]));
  }, [historicalGrips, customGripsArray]);

  const finalHistoricalMachines = React.useMemo(() => {
    return Array.from(new Set([...historicalMachines, ...customMachinesArray]));
  }, [historicalMachines, customMachinesArray]);

  const handleAddGrip = (val: string) => {
    addGlobalGrip(val);
    addExerciseVariant(row.exerciseId, 'grip', val);
  };
  const handleAddMachine = (val: string) => {
    addGlobalMachine(val);
    addExerciseVariant(row.exerciseId, 'machine', val);
  };

  const settings = useWorkoutStore((s) => s.settings);
  const showRpe = settings?.showRpe ?? false;
  const isCardio = meta?.muscle === 'cardio';

  // Compact columns: set#(with prev below), kg, reps, [rpe], check
  const cols = showRpe
    ? '50px minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr) 44px'
    : '50px minmax(0,1fr) minmax(0,1fr) 44px';

  // Collapsible sets
  const [collapsed, setCollapsed] = useState(false);
  const allDone = row.sets.length > 0 && row.sets.every((s) => s.completed);
  const doneCount = row.sets.filter((s) => s.completed).length;

  // Auto-collapse when all sets completed
  const prevAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      setCollapsed(true);
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  return (
    <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="exercise-card-header"
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
          {meta &&
            customGifs[meta.id] !== 'none' &&
            ((meta && customGifs[meta.id]) || meta?.gifUrl) && (
              <img
                src={meta ? customGifs[meta.id] || meta.gifUrl : undefined}
                alt=""
                className="exercise-card-thumb"
                loading="lazy"
              />
            )}
          <div style={{ minWidth: 0 }}>
            <h3
              className="exercise-card-name"
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>{meta?.name ?? 'Ejercicio'}</span>
              {
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingVariant(!editingVariant);
                  }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.1rem 0.5rem',
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {row.variant && (row.variant.grip || row.variant.machine)
                    ? formatVariant(row.variant)
                    : '+ Variante'}
                </button>
              }
            </h3>
            <div className="exercise-card-meta">
              <span>{meta ? MUSCLE_LABEL[meta.muscle] : ''}</span>
              <span style={{ color: 'var(--border-medium)' }}>|</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <select
                  value={restTimers[row.exerciseId] ?? restPreset}
                  onChange={(e) => {
                    e.stopPropagation();
                    setExerciseRestTimer(row.exerciseId, Number(e.target.value));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="exercise-card-rest-select"
                >
                  {[30, 60, 90, 120, 150, 180, 240, 300].map((s) => (
                    <option key={s} value={s}>
                      {s}s
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </div>
        </div>
        <div className="exercise-card-actions">
          <ChevronDown
            size={18}
            style={{
              color: 'var(--text-muted)',
              transform: collapsed ? 'rotate(-90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
          <button
            disabled={index === 0}
            aria-label="Subir"
            onClick={(e) => {
              e.stopPropagation();
              moveExercise(row.id, -1);
            }}
            className="exercise-card-action-btn"
          >
            <ChevronUp size={20} />
          </button>
          <button
            disabled={index === total - 1}
            aria-label="Bajar"
            onClick={(e) => {
              e.stopPropagation();
              moveExercise(row.id, 1);
            }}
            className="exercise-card-action-btn"
          >
            <ChevronDown size={20} />
          </button>
          <button
            aria-label="Quitar ejercicio"
            onClick={(e) => {
              e.stopPropagation();
              removeExercise(row.id);
            }}
            className="exercise-card-action-btn danger"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {collapsed ? (
        /* Collapsed summary */
        <div className="exercise-card-summary">
          <Check
            size={14}
            style={{ color: allDone ? 'var(--color-success, #10b981)' : 'var(--text-muted)' }}
          />
          <span>
            {doneCount}/{row.sets.length} series completadas
          </span>
        </div>
      ) : (
        <>
          {/* Variant Editor */}
          {editingVariant && (
            <div
              style={{
                background: 'var(--bg-elevated)',
                borderTop: '1px solid var(--border-subtle)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  AGARRE
                </div>
                <VariantSelector
                  type="grip"
                  value={row.variant?.grip}
                  onChange={(val) => updateExerciseVariant(row.id, { ...row.variant, grip: val })}
                  historicalOptions={finalHistoricalGrips}
                  globalOptions={globalGrips}
                  onAddOption={handleAddGrip}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  MÁQUINA / VARIANTE
                </div>
                <VariantSelector
                  type="machine"
                  value={row.variant?.machine}
                  onChange={(val) =>
                    updateExerciseVariant(row.id, { ...row.variant, machine: val })
                  }
                  historicalOptions={finalHistoricalMachines}
                  globalOptions={globalMachines}
                  onAddOption={handleAddMachine}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.4rem 1rem' }}>
            <input
              value={row.notes}
              onChange={(e) => setExerciseNotes(row.id, e.target.value)}
              placeholder="Notas de la serie, tempo, RIR"
              className="form-input"
              style={{
                width: '100%',
                padding: '0.35rem 0.5rem',
                fontSize: '0.8rem',
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
              }}
            />
          </div>

          {/* Sets */}
          <div style={{ padding: '0.25rem 0.5rem 0.75rem' }}>
            {/* Header */}
            <div className="set-grid-header" style={{ gridTemplateColumns: cols }}>
              <span>#</span>
              <span>{isCardio ? 'Km' : 'Kg'}</span>
              <span>{isCardio ? 'Tpo' : 'Reps'}</span>
              {showRpe && <span>RPE</span>}
              <span />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {row.sets.map((s, i) => {
                let normalCount = 0;
                for (let j = 0; j < i; j++) {
                  if (row.sets[j].type === 'normal') normalCount++;
                }
                return (
                  <SwipeableSetRow
                    key={s.id}
                    s={s}
                    i={i}
                    workingIndex={normalCount}
                    row={row}
                    showRpe={showRpe}
                    isCardio={isCardio}
                    cols={cols}
                    recentWorkouts={recentWorkouts}
                  />
                );
              })}
            </div>

            <button onClick={() => addSet(row.id, recentWorkouts)} className="add-set-btn">
              <Plus size={16} />
              Añadir serie
            </button>
          </div>
        </>
      )}
    </article>
  );
});
