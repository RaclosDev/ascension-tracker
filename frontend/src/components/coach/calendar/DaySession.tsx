import { useEffect, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Copy, MoreHorizontal, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '@/lib/coach/api';
import {
  MAX_EXERCISES_PER_DAY,
  useSaveProgram,
  type ProgramDay,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import { ExerciseRow } from '../editor/ExerciseRow';
import { usePrescribing } from '../editor/prescribing';
import { Select } from '@/components/ui/select';

/** The training of one day: every exercise on a line, with the details one click away. */
export function DaySession({
  label,
  weekday,
  day,
  lastDay,
  others,
  readOnly,
  wide,
  onSearch,
  onChange,
  onAdd,
  onRemove,
  onRepeat,
  onSendDay,
  onSendExercise,
  onRemoveExercise,
  onReorder,
}: {
  /** "Lunes 16/11" */
  label: string;
  /** "lunes" */
  weekday: string;
  day?: ProgramDay;
  /** What the athlete had this same weekday the week before. */
  lastDay?: ProgramDay;
  others: { value: number; label: string; busy: boolean }[];
  readOnly: boolean;
  /** The session has the screen: exercises open set by set, beside what the athlete last did. */
  wide: boolean;
  /** Opens the session wide and takes the cursor to the exercise search. */
  onSearch: () => void;
  onChange: (change: (day: ProgramDay) => ProgramDay) => void;
  onAdd: () => void;
  onRemove: () => void;
  onRepeat: () => void;
  onSendDay: (to: number, move: boolean, clash: 'replace' | 'merge') => void;
  onSendExercise: (index: number, to: number, move: boolean) => void;
  onRemoveExercise: (index: number) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [sendTo, setSendTo] = useState(others[0].value);
  const [clash, setClash] = useState<'replace' | 'merge'>('merge');
  const saveTemplate = useSaveProgram();
  const list = useRef<HTMLOListElement | null>(null);
  const before = useRef(day?.exercises.length ?? 0);
  const count = day?.exercises.length ?? 0;
  const prefs = usePrescribing();
  // The effort column is named after the method this day is prescribed with.
  const effort = day?.exercises.some((e) => e.targetRir != null)
    ? 'RIR'
    : day?.exercises.some((e) => e.targetRpe != null)
      ? 'RPE'
      : prefs.effort === 'NONE'
        ? null
        : prefs.effort;
  // A picked exercise is ready to be prescribed: the cursor lands on its first cell.
  useEffect(() => {
    const grew = count > before.current;
    before.current = count;
    if (grew && wide)
      list.current
        ?.querySelector<HTMLElement>(':scope > li:last-of-type [data-cell="0:0"]')
        ?.focus();
  }, [count, wide]);

  if (!day)
    return (
      <div className="day-empty">
        <p>{readOnly ? 'No había sesión pautada este día.' : 'Día de descanso: sin sesión.'}</p>
        {!readOnly && (
          <div className="day-empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              aria-label={`Añadir sesión el ${weekday}`}
              onClick={() => {
                onAdd();
                onSearch();
              }}
            >
              <Plus size={16} aria-hidden /> Añadir sesión
            </button>
            {lastDay && (
              <button
                type="button"
                className="btn btn-secondary"
                aria-label={`Repetir «${lastDay.name || 'la sesión'}» de la semana pasada el ${weekday}`}
                onClick={onRepeat}
              >
                <Copy size={15} aria-hidden /> Repetir «{lastDay.name || 'la sesión'}»
              </button>
            )}
          </div>
        )}
      </div>
    );

  const sets = day.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  const target = others.find((other) => other.value === sendTo);
  const full = count >= MAX_EXERCISES_PER_DAY;
  return (
    <div className="day-session">
      <div className="day-session-head">
        <input
          className="day-session-name"
          aria-label={`Nombre del día (${label})`}
          placeholder="Nombre de la sesión"
          maxLength={120}
          value={day.name}
          onChange={(e) => onChange((current) => ({ ...current, name: e.target.value }))}
        />
        <small>
          {count} {count === 1 ? 'ejercicio' : 'ejercicios'} · {sets} series
        </small>
        <button
          type="button"
          className="set-icon"
          aria-label={`Opciones del ${weekday}`}
          aria-expanded={menu}
          title="Notas, mover, copiar o quitar la sesión"
          onClick={() => setMenu(!menu)}
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>
      {day.notes && !menu && <p className="day-session-notes">{day.notes}</p>}
      {menu && (
        <div className="day-menu">
          <label className="day-menu-wide">
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
            <Select
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
            </Select>
          </label>
          {target?.busy && (
            <label>
              Ese día ya tiene sesión
              <Select
                className="form-input"
                value={clash}
                onChange={(e) => setClash(e.target.value as 'replace' | 'merge')}
              >
                <option value="merge">Añadir estos ejercicios al final</option>
                <option value="replace">Sustituirla (se pierde la que hay)</option>
              </Select>
            </label>
          )}
          <div className="day-menu-actions">
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
      <DragDropContext
        onDragEnd={({ source, destination }) => {
          if (destination && destination.index !== source.index)
            onReorder(source.index, destination.index);
        }}
      >
        {count > 0 && !wide && (
          <div className="day-cols" aria-hidden>
            <span className="day-cols-quick">
              <span>Series</span>
              <b>×</b>
              <span>Reps</span>
              {effort && <span>{effort}</span>}
              <span>Carga</span>
            </span>
            <span className="day-cols-pad" />
          </div>
        )}
        <Droppable droppableId="day">
          {(zone) => (
            <ol
              ref={(node) => {
                zone.innerRef(node);
                list.current = node;
              }}
              {...zone.droppableProps}
              className="day-list"
            >
              {day.exercises.map((exercise: ProgramExercise, i) => (
                <Draggable
                  key={`${wide}-${i}-${exercise.exerciseId}`}
                  draggableId={`${i}:${exercise.exerciseId}`}
                  index={i}
                  isDragDisabled={readOnly}
                >
                  {(drag) => (
                    <ExerciseRow
                      compact
                      detail={wide}
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
      </DragDropContext>
      {!count && (
        <p className="day-list-empty">
          {wide
            ? 'Sesión vacía. Busca un ejercicio o arrastra aquí los que ya entrena.'
            : 'Sesión vacía. Añade el primer ejercicio.'}
        </p>
      )}
      <button
        type="button"
        className="day-add"
        aria-label={`Añadir ejercicio el ${weekday}`}
        disabled={full}
        onClick={onSearch}
      >
        <Plus size={16} aria-hidden /> Ejercicio
      </button>
    </div>
  );
}
