import { PrescriptionSummary } from '../PrescriptionSummary';
import { PrescriptionFields } from './PrescriptionFields';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import type { ProgramExercise } from '@/lib/coach/coachPrograms';
import { inputClass, inputStyle } from './fields';
const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
      {label}
      <input
        className={`${inputClass} w-20`}
        style={inputStyle}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
    </label>
  );
}

export function ExerciseRow({
  compact = false,
  drag,
  index,
  count,
  exercise,
  onChange,
  onMove,
  onRemove,
}: {
  compact?: boolean;
  drag: DraggableProvided;
  index: number;
  count: number;
  exercise: ProgramExercise;
  onChange: (next: ProgramExercise) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const name = exercise.exerciseName || exercise.exerciseId;
  const set = <K extends keyof ProgramExercise>(key: K, value: ProgramExercise[K]) =>
    onChange({ ...exercise, [key]: value });

  return (
    <li
      data-tour="exercise-prescription"
      ref={drag.innerRef}
      {...drag.draggableProps}
      className="coach-exercise rounded-lg border p-3 flex flex-col gap-3"
      style={{ ...inputStyle, ...drag.draggableProps.style }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          {...drag.dragHandleProps}
          aria-label={`Arrastrar ${name}`}
          className="cursor-grab touch-none"
          style={{ color: 'var(--text-secondary)' }}
        >
          <GripVertical size={18} aria-hidden />
        </span>
        <span className="font-bold text-foreground flex-1 min-w-32 break-words">
          {index + 1}. {name}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label={`Subir ${name}`}
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
        >
          <ArrowUp size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label={`Bajar ${name}`}
          disabled={index === count - 1}
          onClick={() => onMove(index + 1)}
        >
          <ArrowDown size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label={`Quitar ${name}`}
          onClick={onRemove}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      <div className="coach-prescription-summary">
        <PrescriptionSummary exercise={exercise} />
      </div>
      <details open={!compact} className="coach-exercise-fields">
        <summary>Editar pauta</summary>
        <div className="flex flex-wrap gap-3 pt-3">
          <NumberField
            label="Series"
            value={exercise.sets}
            min={1}
            max={20}
            onChange={(v) =>
              onChange({
                ...exercise,
                sets: v ?? 0,
                prescription: exercise.prescription?.sets?.length
                  ? {
                      ...exercise.prescription,
                      sets: Array.from(
                        { length: Math.min(20, Math.max(0, v ?? 0)) },
                        (_, i) =>
                          exercise.prescription?.sets?.[i] ?? {
                            kind: 'WORK',
                            reps: exercise.repsMin,
                            rpe: exercise.targetRpe,
                            rir: exercise.targetRir,
                            load: null,
                          },
                      ),
                    }
                  : exercise.prescription,
              })
            }
          />
          <NumberField
            label="Reps mín."
            value={exercise.repsMin}
            min={1}
            max={100}
            onChange={(v) => set('repsMin', v)}
          />
          <NumberField
            label="Reps máx."
            value={exercise.repsMax}
            min={1}
            max={100}
            onChange={(v) => set('repsMax', v)}
          />
          <label className="text-xs">
            Método de esfuerzo
            <select
              value={exercise.targetRir != null ? 'RIR' : 'RPE'}
              onChange={(e) =>
                onChange({
                  ...exercise,
                  targetRpe: e.target.value === 'RPE' ? 8 : null,
                  targetRir: e.target.value === 'RIR' ? 2 : null,
                })
              }
            >
              <option>RPE</option>
              <option>RIR</option>
            </select>
          </label>
          <NumberField
            label={exercise.targetRir != null ? 'RIR' : 'RPE'}
            value={exercise.targetRir ?? exercise.targetRpe}
            min={exercise.targetRir != null ? 0 : 1}
            max={10}
            step={exercise.targetRir != null ? 1 : 0.5}
            onChange={(v) => set(exercise.targetRir != null ? 'targetRir' : 'targetRpe', v)}
          />
        </div>
        <PrescriptionFields exercise={exercise} onChange={onChange} />
        <details>
          <summary className="cursor-pointer text-sm">Descanso, superseries y notas</summary>
          <div className="flex flex-wrap gap-2 mt-2">
            <NumberField
              label="Descanso (s)"
              value={exercise.restSeconds}
              min={0}
              max={900}
              step={15}
              onChange={(v) => set('restSeconds', v)}
            />
            <NumberField
              label="Superserie"
              value={exercise.supersetGroup}
              min={1}
              max={20}
              onChange={(v) => set('supersetGroup', v)}
            />
          </div>
          <input
            aria-label={`Notas de ${name}`}
            placeholder="Notas (técnica, tempo…)"
            className={inputClass}
            style={inputStyle}
            maxLength={500}
            value={exercise.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
          />
        </details>
      </details>
    </li>
  );
}
