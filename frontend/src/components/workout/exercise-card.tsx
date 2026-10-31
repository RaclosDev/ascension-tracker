import { ExerciseActionsMenu } from './ExerciseActionsMenu';
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus, Timer } from 'lucide-react';
import { getExerciseMap } from '@/lib/workout/exercises';
import { formatVariant, formatRestFriendly } from '@/lib/workout/format';
import { haptics } from '@/lib/haptics';
import { useWorkoutStore } from '@/lib/workout/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VariantSelector } from './variant-selector';
import {
  useRecentWorkouts,
  useCustomExercises,
  useWorkoutPreferencesActions,
} from '@/lib/workout/api';
import { MUSCLE_LABEL, type WorkoutExercise } from '@/lib/workout/types';

import { SwipeableSetRow, type SwipeableSetRowProps } from './swipeable-set-row';
export { SwipeableSetRow, type SwipeableSetRowProps };

export interface ExerciseCardProps {
  rowId?: string;
  row?: WorkoutExercise;
  index: number;
  total: number;
}

export const ExerciseCard = React.memo(function ExerciseCard({
  rowId,
  row: propRow,
  index,
  total,
}: ExerciseCardProps) {
  const targetId = rowId ?? propRow?.id;
  const storeRow = useWorkoutStore((s) => s.active?.exercises.find((e) => e.id === targetId));
  const row = storeRow ?? propRow;

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
  const { prefs, addGripOption, addMachineOption, setExerciseRestTimerPref } =
    useWorkoutPreferencesActions();
  const globalMachines = prefs?.globalMachines || [];
  const globalGrips = prefs?.globalGrips || [];
  const exerciseVariants = React.useMemo(
    () => prefs?.exerciseVariants || {},
    [prefs?.exerciseVariants],
  );
  const customGifs = prefs?.exerciseGifs || {};
  const [editingVariant, setEditingVariant] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const [activeStepper, setActiveStepper] = useState<{
    setId: string;
    field: 'weight' | 'reps';
  } | null>(null);

  const catalog = getExerciseMap(customExercises);
  const meta = row ? catalog.get(row.exerciseId) : undefined;
  const rowExerciseId = row?.exerciseId;

  const historicalMachines = React.useMemo(() => {
    if (!rowExerciseId) return [];
    const machines = new Set<string>();
    for (const w of recentWorkouts) {
      for (const ex of w.exercises) {
        if (ex.exerciseId === rowExerciseId && ex.variant?.machine) {
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
  }, [rowExerciseId, recentWorkouts, meta]);

  const historicalGrips = React.useMemo(() => {
    if (!rowExerciseId) return [];
    const grips = new Set<string>();
    for (const w of recentWorkouts) {
      for (const ex of w.exercises) {
        if (ex.exerciseId === rowExerciseId && ex.variant?.grip) {
          grips.add(ex.variant.grip);
        }
      }
    }
    return Array.from(grips).sort();
  }, [rowExerciseId, recentWorkouts]);

  const customGripsArray = React.useMemo(() => {
    return rowExerciseId ? exerciseVariants[rowExerciseId]?.grips || [] : [];
  }, [rowExerciseId, exerciseVariants]);

  const customMachinesArray = React.useMemo(() => {
    return rowExerciseId ? exerciseVariants[rowExerciseId]?.machines || [] : [];
  }, [rowExerciseId, exerciseVariants]);

  const finalHistoricalGrips = React.useMemo(() => {
    return Array.from(new Set([...historicalGrips, ...customGripsArray]));
  }, [historicalGrips, customGripsArray]);

  const finalHistoricalMachines = React.useMemo(() => {
    return Array.from(new Set([...historicalMachines, ...customMachinesArray]));
  }, [historicalMachines, customMachinesArray]);

  const settings = useWorkoutStore((s) => s.settings);
  const showRpe = settings?.showRpe ?? false;
  const isCardio = meta?.muscle === 'cardio';

  // Compact columns: set#(with prev below), kg, reps, [rpe], check
  const cols = showRpe
    ? '50px minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr) 44px'
    : '50px minmax(0,1fr) minmax(0,1fr) 44px';

  const [collapsed, setCollapsed] = useState(false);
  const allDone = Boolean(row && row.sets.length > 0 && row.sets.every((s) => s.completed));
  const doneCount = row ? row.sets.filter((s) => s.completed).length : 0;

  // Auto-collapse when all sets completed
  const prevAllDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !prevAllDone.current) {
      setCollapsed(true);
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  if (!row) return null;

  const handleAddGrip = (val: string) => {
    addGripOption(row.exerciseId, val);
  };
  const handleAddMachine = (val: string) => {
    addMachineOption(row.exerciseId, val);
  };

  return (
    <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingVariant(!editingVariant);
                }}
                className="exercise-card-variant-badge"
              >
                {row.variant && (row.variant.grip || row.variant.machine)
                  ? formatVariant(row.variant)
                  : '+ Variante'}
              </button>
            </h3>
            <div className="exercise-card-meta">
              <span>{meta ? MUSCLE_LABEL[meta.muscle] : ''}</span>
              <span className="exercise-card-meta-dot">•</span>
              <div
                className="exercise-card-rest-pill"
                onClick={(e) => e.stopPropagation()}
                title="Tiempo de descanso"
              >
                <Timer size={12} className="exercise-card-rest-icon" />
                <select
                  value={restTimers[row.exerciseId] ?? restPreset}
                  onChange={(e) => {
                    e.stopPropagation();
                    const val = Number(e.target.value);
                    setExerciseRestTimer(row.exerciseId, val);
                    setExerciseRestTimerPref(row.exerciseId, val);
                  }}
                  className="exercise-card-rest-select"
                  aria-label="Tiempo de descanso para este ejercicio"
                >
                  {[30, 60, 90, 120, 150, 180, 240, 300].map((s) => (
                    <option key={s} value={s}>
                      {formatRestFriendly(s)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={11} className="exercise-card-rest-chevron" />
              </div>
            </div>
          </div>
        </div>
        <div className="exercise-card-actions" onClick={(e) => e.stopPropagation()}>
          <ExerciseActionsMenu
            index={index}
            total={total}
            onMove={(delta) => moveExercise(row.id, delta)}
            onRemove={() => {
              if (row.sets.some((set) => set.completed)) setConfirmRemoveOpen(true);
              else {
                haptics.warning();
                removeExercise(row.id);
              }
            }}
          />
          <button
            type="button"
            aria-label={collapsed ? 'Expandir ejercicio' : 'Colapsar ejercicio'}
            onClick={() => {
              haptics.medium();
              setCollapsed(!collapsed);
            }}
            className="exercise-card-action-btn"
          >
            <ChevronDown
              size={18}
              style={{
                color: 'var(--text-muted)',
                transform: collapsed ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </div>
      </div>

      {collapsed ? (
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
                    setId={s.id}
                    rowId={row.id}
                    exerciseId={row.exerciseId}
                    variant={row.variant}
                    i={i}
                    workingIndex={normalCount}
                    showRpe={showRpe}
                    isCardio={isCardio}
                    cols={cols}
                    recentWorkouts={recentWorkouts}
                    activeStepper={activeStepper}
                    setActiveStepper={setActiveStepper}
                  />
                );
              })}
            </div>

            <button
              onClick={() => {
                haptics.light();
                addSet(row.id, recentWorkouts);
              }}
              className="add-set-btn btn-press"
            >
              <Plus size={16} />
              Añadir serie
            </button>
          </div>
        </>
      )}

      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent
          className="card"
          style={{
            maxWidth: '380px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              ¿Quitar {meta?.name || 'ejercicio'}?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Ya has completado series en este ejercicio. Si lo quitas ahora, esas series se
              descartarán de la sesión actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <AlertDialogCancel className="btn btn-secondary">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="btn btn-danger btn-press"
              style={{ color: 'var(--color-danger)' }}
              onClick={() => {
                haptics.warning();
                if (row) removeExercise(row.id);
              }}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
});
