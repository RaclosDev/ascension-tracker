import { useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import {
  MAX_EXERCISES_PER_DAY,
  WEEKDAY_LABELS,
  moveItem,
  newExercise,
  type ProgramDay,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import { inputClass, inputStyle } from './fields';
import { ExerciseRow } from './ExerciseRow';
import { ExerciseSearch } from './ExerciseSearch';
import toast from 'react-hot-toast';
import { useSaveProgram } from '@/lib/coach/coachPrograms';
import { apiErrorMessage } from '@/lib/coach/api';
export function DayEditor({
  label,
  compact = false,
  day,
  weeks,
  onChange,
  onRemove,
  onCopy,
}: {
  label: string;
  compact?: boolean;
  day: ProgramDay;
  weeks: number;
  onChange: (change: (day: ProgramDay) => ProgramDay) => void;
  onRemove: () => void;
  onCopy: (to: { week: number; dayIndex: number }) => void;
}) {
  const [initiallyOpen] = useState(() => !compact || day.exercises.length === 0);
  const [searchInitiallyOpen] = useState(() => day.exercises.length === 0);
  const [copyWeekTarget, setCopyWeekTarget] = useState(day.week);
  const [copyDayTarget, setCopyDayTarget] = useState(day.dayIndex === 7 ? 1 : day.dayIndex + 1);
  const saveTemplate = useSaveProgram();
  const [templateName, setTemplateName] = useState(day.name);

  const setExercises = (change: (list: ProgramExercise[]) => ProgramExercise[]) =>
    onChange((d) => ({ ...d, exercises: change(d.exercises) }));

  return (
    <details className="card coach-day" open={initiallyOpen}>
      <summary className="coach-day-summary">
        <span>{label}</span>
        <strong>{day.name || 'Sesión sin nombre'}</strong>
        <span>
          {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} ·{' '}
          {day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} series
        </span>
      </summary>
      <section className="flex flex-col gap-4 pt-4" aria-label={`${label}: ${day.name}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-foreground w-24">{label}</span>
          <input
            aria-label={`Nombre del día (${label})`}
            className={`${inputClass} flex-1`}
            style={inputStyle}
            maxLength={120}
            value={day.name}
            onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
          />
          <button
            type="button"
            className="btn btn-secondary"
            aria-label={`Quitar el día ${label.toLowerCase()}`}
            onClick={onRemove}
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
        <textarea
          aria-label={`Notas del día (${label})`}
          placeholder="Notas del día (calentamiento, indicaciones…)"
          className={inputClass}
          style={inputStyle}
          rows={1}
          maxLength={2000}
          value={day.notes ?? ''}
          onChange={(e) => onChange((d) => ({ ...d, notes: e.target.value || null }))}
        />

        {day.exercises.length > 0 && (
          <DragDropContext
            onDragEnd={({ source, destination }) => {
              if (destination)
                setExercises((list) => moveItem(list, source.index, destination.index));
            }}
          >
            <Droppable droppableId={`day-${day.week}-${day.dayIndex}`}>
              {(drop) => (
                <ol className="flex flex-col gap-2" ref={drop.innerRef} {...drop.droppableProps}>
                  {day.exercises.map((exercise, i) => (
                    <Draggable
                      key={`${i}-${exercise.exerciseId}`}
                      draggableId={`${i}-${exercise.exerciseId}`}
                      index={i}
                    >
                      {(drag) => (
                        <ExerciseRow
                          compact={compact}
                          drag={drag}
                          index={i}
                          count={day.exercises.length}
                          exercise={exercise}
                          onChange={(next) =>
                            setExercises((list) => list.map((e, j) => (j === i ? next : e)))
                          }
                          onMove={(to) => setExercises((list) => moveItem(list, i, to))}
                          onRemove={() => setExercises((list) => list.filter((_, j) => j !== i))}
                        />
                      )}
                    </Draggable>
                  ))}
                  {drop.placeholder}
                </ol>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {day.exercises.length < MAX_EXERCISES_PER_DAY && (
          <details open={searchInitiallyOpen} className="coach-add-exercise">
            <summary>Añadir ejercicio</summary>
            <ExerciseSearch
              onPick={(ex) => setExercises((list) => [...list, newExercise(ex.id, ex.name)])}
            />
          </details>
        )}

        <details>
          <summary className="cursor-pointer text-sm">Guardar esta sesión en la biblioteca</summary>
          <div className="flex flex-wrap gap-2 mt-2">
            <label>
              Nombre de la plantilla
              <input
                maxLength={120}
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!templateName.trim() || !day.exercises.length || saveTemplate.isPending}
              onClick={() =>
                saveTemplate.mutate(
                  {
                    id: null,
                    name: templateName,
                    notes: null,
                    weeks: 1,
                    days: [{ ...structuredClone(day), week: 1, dayIndex: 1 }],
                    status: 'READY',
                  },
                  {
                    onSuccess: () => toast.success('Sesión guardada en la biblioteca'),
                    onError: (error) =>
                      toast.error(apiErrorMessage(error, 'No se pudo guardar la sesión')),
                  },
                )
              }
            >
              Guardar sesión
            </button>
          </div>
        </details>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Copiar este día a</span>
          <select
            aria-label="Semana de destino"
            className={inputClass}
            style={inputStyle}
            value={copyWeekTarget}
            onChange={(e) => setCopyWeekTarget(Number(e.target.value))}
          >
            {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Semana {w}
              </option>
            ))}
          </select>
          <select
            aria-label="Día de destino"
            className={inputClass}
            style={inputStyle}
            value={copyDayTarget}
            onChange={(e) => setCopyDayTarget(Number(e.target.value))}
          >
            {WEEKDAY_LABELS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={copyWeekTarget === day.week && copyDayTarget === day.dayIndex}
            onClick={() => onCopy({ week: copyWeekTarget, dayIndex: copyDayTarget })}
          >
            <Copy size={16} aria-hidden /> Copiar
          </button>
        </div>
      </section>
    </details>
  );
}
