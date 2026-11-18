import { defaultItem, useLibraryItems, useSaveLibraryItem } from '@/lib/coach/library';
import { useState } from 'react';
import {
  useCoachPrograms,
  useCoachProgram,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import { WEEKDAY_LABELS } from '@/lib/coach/weekdays';

export function LibraryInsert({
  onInsert,
  onAddExercises,
}: {
  onInsert: (days: ProgramDay[]) => void;
  /** Adds loose exercises of a saved session to a day, keeping what the day already has. */
  onAddExercises: (dayIndex: number, exercises: ProgramExercise[]) => void;
}) {
  const library = useCoachPrograms();
  const [id, setId] = useState('');
  const source = useCoachProgram(id || null);
  const [day, setDay] = useState('0');
  const [target, setTarget] = useState(1);
  const [mode, setMode] = useState('session');
  const [picked, setPicked] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(false);
  const [maxMinutes, setMaxMinutes] = useState('');
  const items = useLibraryItems();
  const track = useSaveLibraryItem();
  const itemFor = (id: string) => items.data?.find((i) => i.type === 'PROGRAM' && i.id === id);
  const selected = source.data?.days[Number(day)];
  const insert = (program: Program) => {
    if (!selected) return;
    if (items.isSuccess)
      track.mutate({ ...defaultItem('PROGRAM', id), ...itemFor(id), used: true });
    if (mode === 'exercises') {
      onAddExercises(
        target,
        selected.exercises.filter((_, i) => picked.includes(i)),
      );
      setPicked([]);
      return;
    }
    const days =
      mode === 'week' ? program.days.filter((d) => d.week === selected.week) : [selected];
    onInsert(
      structuredClone(days).map((d) => ({
        ...d,
        week: 1,
        dayIndex: mode === 'week' ? d.dayIndex : target,
      })),
    );
  };
  return (
    <details data-tour="library-insert" className="card" open>
      <summary className="cursor-pointer font-bold">Añadir de tus plantillas</summary>
      <div className="library-insert-grid">
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={favorites}
            onChange={(e) => setFavorites(e.target.checked)}
          />
          Solo favoritos
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          Buscar nombre, etiqueta o material
          <input
            className="form-input min-h-11"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          Duración máxima (min)
          <input
            className="w-24 form-input min-h-11"
            type="number"
            min={1}
            max={300}
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          Plantilla
          <select
            className="form-input min-h-11"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setDay('0');
              setPicked([]);
            }}
          >
            <option value="">Selecciona una plantilla</option>
            {library.data
              ?.filter(
                (p) =>
                  p.status !== 'DRAFT' &&
                  (!maxMinutes ||
                    (itemFor(p.id)?.minutes != null &&
                      itemFor(p.id)!.minutes! <= Number(maxMinutes))) &&
                  [p.name, ...(itemFor(p.id)?.tags ?? []), itemFor(p.id)?.equipment ?? '']
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(query.toLocaleLowerCase()) &&
                  (!favorites || itemFor(p.id)?.favorite),
              )
              .sort(
                (a, b) =>
                  Number(!!itemFor(b.id)?.favorite) - Number(!!itemFor(a.id)?.favorite) ||
                  (itemFor(b.id)?.lastUsed ?? '').localeCompare(itemFor(a.id)?.lastUsed ?? ''),
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.dayCount} sesiones
                </option>
              ))}
          </select>
        </label>
        {library.isError && (
          <p role="alert">
            No se pudo cargar la biblioteca.{' '}
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void library.refetch()}
            >
              Reintentar
            </button>
          </p>
        )}
        {source.isFetching && <p role="status">Cargando plantilla…</p>}
        {source.isError && <p role="alert">No se pudo cargar la plantilla.</p>}
        {source.data && (
          <>
            <label className="flex flex-col gap-1 min-w-0">
              Contenido
              <select
                className="form-input min-h-11"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="session">Una sesión o bloque</option>
                <option value="week">Una semana completa</option>
                <option value="exercises">Ejercicios sueltos de una sesión</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-0">
              {mode === 'week' ? 'Semana de origen (elige una sesión)' : 'Sesión de origen'}
              <select
                className="form-input min-h-11"
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  setPicked([]);
                }}
              >
                {source.data.days.map((d, i) => (
                  <option key={i} value={i}>
                    S{d.week} · {d.name}
                  </option>
                ))}
              </select>
            </label>
            {mode !== 'week' && (
              <label className="flex flex-col gap-1 min-w-0">
                Día de destino
                <select
                  className="form-input min-h-11"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                >
                  {WEEKDAY_LABELS.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {selected && mode !== 'exercises' && (
              <p className="text-sm">
                {selected.exercises.map((e) => e.exerciseName ?? e.exerciseId).join(' · ')}
              </p>
            )}
            {selected && mode === 'exercises' && (
              <fieldset className="library-pick">
                <legend>Ejercicios que añadir</legend>
                {selected.exercises.map((e, i) => (
                  <label key={i}>
                    <input
                      type="checkbox"
                      checked={picked.includes(i)}
                      onChange={(event) =>
                        setPicked(
                          event.target.checked
                            ? [...picked, i].sort()
                            : picked.filter((n) => n !== i),
                        )
                      }
                    />
                    {e.exerciseName ?? e.exerciseId}
                  </label>
                ))}
              </fieldset>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!selected || source.isFetching || (mode === 'exercises' && !picked.length)}
              onClick={() => source.data && insert(source.data)}
            >
              {mode === 'exercises'
                ? 'Añadir ejercicios'
                : `Insertar ${mode === 'week' ? 'semana' : 'sesión'}`}
            </button>
          </>
        )}
      </div>
    </details>
  );
}
