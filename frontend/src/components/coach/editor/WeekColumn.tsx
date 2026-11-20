import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Copy, MoreHorizontal, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '@/lib/coach/api';
import {
  MAX_EXERCISES_PER_DAY,
  useSaveProgram,
  type ProgramDay,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import type { Exercise } from '@/lib/workout/types';
import { ExerciseRow } from './ExerciseRow';
import { ExerciseSearch } from './ExerciseSearch';

export interface DropProps {
  'data-drop'?: string;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

/** One weekday of the week being prepared: a full session to edit, or a narrow rest column. */
export function WeekColumn({
  dayIndex,
  label,
  weekday,
  day,
  lastDay,
  others,
  drop,
  onChange,
  onAdd,
  onRemove,
  onRepeat,
  onSendDay,
  onSendExercise,
  onAddExercise,
  onRemoveExercise,
}: {
  dayIndex: number;
  /** "Lunes 16/11" */
  label: string;
  /** "lunes" */
  weekday: string;
  day?: ProgramDay;
  /** What the athlete had this same weekday the week before. */
  lastDay?: ProgramDay;
  others: { value: number; label: string; busy: boolean }[];
  drop: DropProps;
  onChange: (change: (day: ProgramDay) => ProgramDay) => void;
  onAdd: () => void;
  onRemove: () => void;
  onRepeat: () => void;
  onSendDay: (to: number, move: boolean, clash: 'replace' | 'merge') => void;
  onSendExercise: (index: number, to: number, move: boolean) => void;
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (index: number) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sendTo, setSendTo] = useState(others[0].value);
  const [clash, setClash] = useState<'replace' | 'merge'>('replace');
  const saveTemplate = useSaveProgram();
  const list = useRef<HTMLOListElement | null>(null);
  const focusNew = useRef(false);
  const count = day?.exercises.length ?? 0;
  // A picked exercise is ready to be prescribed: the cursor lands on its first cell.
  useEffect(() => {
    if (!focusNew.current) return;
    focusNew.current = false;
    list.current?.querySelector<HTMLElement>(':scope > li:last-of-type [data-cell="0:0"]')?.focus();
  }, [count]);

  if (!day)
    return (
      <Droppable droppableId={`day-${dayIndex}`}>
        {(zone) => (
          <section
            ref={zone.innerRef}
            {...zone.droppableProps}
            className="week-col week-col-rest"
            aria-label={`${label}, descanso`}
            {...drop}
          >
            <span className="week-col-date">{label}</span>
            <span className="week-col-rest-text">Descanso</span>
            <button
              type="button"
              className="week-col-icon"
              aria-label={`Añadir sesión el ${weekday}`}
              title={`Añadir sesión el ${weekday}`}
              onClick={() => {
                onAdd();
                setSearching(true);
              }}
            >
              <Plus size={18} aria-hidden />
            </button>
            {lastDay && (
              <button
                type="button"
                className="week-col-icon"
                aria-label={`Repetir «${lastDay.name || 'la sesión'}» de la semana pasada el ${weekday}`}
                title={`Repetir «${lastDay.name || 'la sesión'}» de la semana pasada`}
                onClick={onRepeat}
              >
                <Copy size={16} aria-hidden />
              </button>
            )}
            <span hidden>{zone.placeholder}</span>
          </section>
        )}
      </Droppable>
    );

  const sets = day.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  const target = others.find((other) => other.value === sendTo);
  const full = count >= MAX_EXERCISES_PER_DAY;
  return (
    <section className="week-col" aria-label={label} {...drop}>
      <header className="week-col-head">
        <div className="min-w-0">
          <span className="week-col-date">{label}</span>
          <small>
            {count} {count === 1 ? 'ejercicio' : 'ejercicios'} · {sets} series
          </small>
        </div>
        <button
          type="button"
          className="set-icon"
          aria-label={`Opciones del ${weekday}`}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </header>
      <input
        className="week-col-name"
        aria-label={`Nombre del día (${label})`}
        placeholder="Nombre de la sesión"
        maxLength={120}
        value={day.name}
        onChange={(e) => onChange((current) => ({ ...current, name: e.target.value }))}
      />
      {menu && (
        <div className="week-col-menu">
          <label>
            Notas del día
            <textarea
              className="form-input"
              rows={2}
              maxLength={2000}
              aria-label={`Notas del día (${label})`}
              value={day.notes ?? ''}
              onChange={(e) =>
                onChange((current) => ({ ...current, notes: e.target.value || null }))
              }
            />
          </label>
          <label>
            Enviar la sesión a
            <select
              className="form-input"
              value={sendTo}
              onChange={(e) => setSendTo(Number(e.target.value))}
            >
              {others.map((other) => (
                <option key={other.value} value={other.value}>
                  {other.label}
                  {other.busy ? ' (con sesión)' : ''}
                </option>
              ))}
            </select>
          </label>
          {target?.busy && (
            <label>
              Ese día ya tiene sesión
              <select
                className="form-input"
                value={clash}
                onChange={(e) => setClash(e.target.value as 'replace' | 'merge')}
              >
                <option value="replace">Sustituirla</option>
                <option value="merge">Añadir estos ejercicios al final</option>
              </select>
            </label>
          )}
          <div className="week-col-menu-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onSendDay(sendTo, false, clash)}
            >
              Copiar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onSendDay(sendTo, true, clash);
                setMenu(false);
              }}
            >
              Mover
            </button>
          </div>
          <div className="week-col-menu-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saveTemplate.isPending || !count}
              onClick={() =>
                saveTemplate.mutate(
                  {
                    id: null,
                    name: day.name || label,
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
              Guardar en la biblioteca
            </button>
            <button type="button" className="btn btn-secondary" onClick={onRemove}>
              Quitar sesión
            </button>
          </div>
        </div>
      )}
      <Droppable droppableId={`day-${dayIndex}`}>
        {(zone) => (
          <ol
            ref={(node) => {
              zone.innerRef(node);
              list.current = node;
            }}
            {...zone.droppableProps}
            className="week-col-list"
          >
            {day.exercises.map((exercise: ProgramExercise, i) => (
              <Draggable
                key={`${i}-${exercise.exerciseId}`}
                draggableId={`${dayIndex}:${i}:${exercise.exerciseId}`}
                index={i}
              >
                {(drag) => (
                  <ExerciseRow
                    drag={drag}
                    index={i}
                    exercise={exercise}
                    onChange={(next) =>
                      onChange((current) => ({
                        ...current,
                        exercises: current.exercises.map((e, j) => (j === i ? next : e)),
                      }))
                    }
                    onRemove={() => onRemoveExercise(i)}
                    send={{
                      days: others,
                      onSend: (to, move) => onSendExercise(i, to, move),
                    }}
                  />
                )}
              </Draggable>
            ))}
            {zone.placeholder}
          </ol>
        )}
      </Droppable>
      {!count && !searching && (
        <p className="week-col-empty">Sesión vacía. Añade el primer ejercicio.</p>
      )}
      {searching && !full ? (
        <div
          className="week-col-search"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSearching(false);
          }}
        >
          <ExerciseSearch
            autoFocus
            limit={6}
            onPick={(exercise) => {
              focusNew.current = true;
              setSearching(false);
              onAddExercise(exercise);
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={() => setSearching(false)}>
            Cerrar buscador
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="week-col-add"
          aria-label={`Añadir ejercicio el ${weekday}`}
          disabled={full}
          onClick={() => setSearching(true)}
        >
          <Plus size={16} aria-hidden /> Ejercicio
        </button>
      )}
    </section>
  );
}
