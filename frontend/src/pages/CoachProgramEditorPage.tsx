import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Plus, Save, Trash2, X } from 'lucide-react';
import { apiErrorMessage } from '../lib/coach/api';
import {
  MAX_EXERCISES_PER_DAY,
  MAX_WEEKS,
  WEEKDAY_LABELS,
  addDay,
  copyDay,
  copyWeek,
  emptyProgram,
  findDay,
  moveItem,
  newExercise,
  programProblems,
  removeDay,
  setWeeks,
  updateDay,
  useCoachProgram,
  useSaveProgram,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from '../lib/coach/coachPrograms';
import { useExerciseCatalog } from '../lib/workout/catalog-query';
import { useCustomExercises } from '../lib/workout/api';
import { normalizeString } from '../lib/workout/format';
import type { Exercise } from '../lib/workout/types';

const NEW_ID = 'nuevo';
const inputClass = 'rounded-lg px-3 py-2 bg-black/20 border min-w-0';
const inputStyle = { borderColor: 'var(--border-subtle)' };

/** Builder for one library program: weeks, the days of each week and the prescribed exercises. */
export default function CoachProgramEditorPage() {
  const { programId = NEW_ID } = useParams();
  const isNew = programId === NEW_ID;
  const loaded = useCoachProgram(isNew ? null : programId);

  if (!isNew && loaded.isLoading) {
    return <Shell>{<p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}</Shell>;
  }
  if (!isNew && (loaded.isError || !loaded.data)) {
    return (
      <Shell>
        <p role="alert">{apiErrorMessage(loaded.error, 'No se encontró el programa.')}</p>
      </Shell>
    );
  }
  // Keyed so a different program (or a fresh save) starts from its own data.
  return <Editor key={programId} initial={isNew ? emptyProgram() : (loaded.data as Program)} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in max-w-6xl mx-auto px-4 pt-2 sm:pt-4">
      <Link to="/entrenador/programas" className="btn btn-secondary mb-4">
        <ArrowLeft size={16} aria-hidden /> Programas
      </Link>
      {children}
    </div>
  );
}

function Editor({ initial }: { initial: Program }) {
  const navigate = useNavigate();
  const save = useSaveProgram();
  const [program, setProgram] = useState<Program>(initial);
  const [week, setWeek] = useState(1);
  const [dirty, setDirty] = useState(false);
  const problems = useMemo(() => programProblems(program), [program]);

  const edit = (change: (p: Program) => Program) => {
    setProgram((p) => change(p));
    setDirty(true);
  };

  const onSave = () => {
    if (problems.length > 0) {
      toast.error(problems[0]);
      return;
    }
    save.mutate(program, {
      onSuccess: (saved) => {
        toast.success('Programa guardado');
        setDirty(false);
        if (!program.id && saved.id) {
          navigate(`/entrenador/programas/${saved.id}`, { replace: true });
        } else {
          setProgram(saved);
        }
      },
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar el programa')),
    });
  };

  const currentWeek = Math.min(week, program.weeks);

  return (
    <div className="fade-in max-w-6xl mx-auto px-4 pt-2 sm:pt-4 pb-16">
      <header className="mb-4 pb-2 border-b border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/entrenador/programas"
            aria-label="Volver a programas"
            className="btn btn-secondary"
            onClick={(e) => {
              if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir igualmente?'))
                e.preventDefault();
            }}
          >
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight truncate">
            {program.id ? 'Editar programa' : 'Nuevo programa'}
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={save.isPending || (!dirty && program.id != null)}
          onClick={onSave}
        >
          <Save size={16} aria-hidden /> Guardar
        </button>
      </header>

      <section className="card mb-4 grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nombre
          </span>
          <input
            className={inputClass}
            style={inputStyle}
            maxLength={120}
            value={program.name}
            onChange={(e) => edit((p) => ({ ...p, name: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Semanas
          </span>
          <input
            className={inputClass}
            style={inputStyle}
            type="number"
            min={1}
            max={MAX_WEEKS}
            value={program.weeks}
            onChange={(e) => {
              const weeks = Number(e.target.value);
              const dropped = program.days.filter((d) => d.week > weeks).length;
              if (
                dropped > 0 &&
                !window.confirm(`Se borrarán ${dropped} días de las semanas que quitas. ¿Seguir?`)
              )
                return;
              edit((p) => setWeeks(p, weeks));
            }}
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Notas para el alumno
          </span>
          <textarea
            className={inputClass}
            style={inputStyle}
            rows={2}
            maxLength={2000}
            value={program.notes ?? ''}
            onChange={(e) => edit((p) => ({ ...p, notes: e.target.value || null }))}
          />
        </label>
      </section>

      {problems.length > 0 && dirty && (
        <ul className="card mb-4 text-sm flex flex-col gap-1" aria-label="Problemas del programa">
          {problems.slice(0, 5).map((problem) => (
            <li key={problem} style={{ color: 'var(--danger, #f87171)' }}>
              {problem}
            </li>
          ))}
        </ul>
      )}

      <WeekBar
        weeks={program.weeks}
        current={currentWeek}
        onSelect={setWeek}
        onCopy={(to) => {
          if (
            program.days.some((d) => d.week === to) &&
            !window.confirm(`La semana ${to} ya tiene días y se sustituirán. ¿Seguir?`)
          )
            return;
          edit((p) => copyWeek(p, currentWeek, to));
          setWeek(to);
        }}
      />

      <div className="flex flex-col gap-3">
        {WEEKDAY_LABELS.map((label, i) => {
          const dayIndex = i + 1;
          const day = findDay(program, currentWeek, dayIndex);
          if (!day) {
            return (
              <div key={dayIndex} className="card flex items-center justify-between gap-3 py-3">
                <span style={{ color: 'var(--text-secondary)' }}>{label} · descanso</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Añadir entrenamiento el ${label.toLowerCase()}`}
                  onClick={() => edit((p) => addDay(p, currentWeek, dayIndex))}
                >
                  <Plus size={16} aria-hidden /> Añadir día
                </button>
              </div>
            );
          }
          return (
            <DayEditor
              key={dayIndex}
              label={label}
              day={day}
              weeks={program.weeks}
              onChange={(change) => edit((p) => updateDay(p, currentWeek, dayIndex, change))}
              onRemove={() => {
                if (
                  day.exercises.length > 0 &&
                  !window.confirm(`¿Quitar «${day.name}» y sus ${day.exercises.length} ejercicios?`)
                )
                  return;
                edit((p) => removeDay(p, currentWeek, dayIndex));
              }}
              onCopy={(to) => {
                if (
                  findDay(program, to.week, to.dayIndex) &&
                  !window.confirm('Ese día ya tiene entrenamiento y se sustituirá. ¿Seguir?')
                )
                  return;
                edit((p) => copyDay(p, { week: currentWeek, dayIndex }, to));
                toast.success(`Copiado a semana ${to.week}, ${WEEKDAY_LABELS[to.dayIndex - 1]}`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function WeekBar({
  weeks,
  current,
  onSelect,
  onCopy,
}: {
  weeks: number;
  current: number;
  onSelect: (week: number) => void;
  onCopy: (to: number) => void;
}) {
  const [target, setTarget] = useState('');
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="Semanas" className="flex flex-wrap gap-1">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
          <button
            key={w}
            type="button"
            role="tab"
            aria-selected={w === current}
            className={w === current ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onSelect(w)}
          >
            S{w}
          </button>
        ))}
      </div>
      {weeks > 1 && (
        <div className="flex items-center gap-2 ml-auto">
          <select
            aria-label={`Copiar la semana ${current} a`}
            className={inputClass}
            style={inputStyle}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">Copiar semana {current} a…</option>
            {Array.from({ length: weeks }, (_, i) => i + 1)
              .filter((w) => w !== current)
              .map((w) => (
                <option key={w} value={w}>
                  Semana {w}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            aria-label={`Copiar semana ${current}`}
            disabled={!target}
            onClick={() => {
              onCopy(Number(target));
              setTarget('');
            }}
          >
            <Copy size={16} aria-hidden /> Copiar
          </button>
        </div>
      )}
    </div>
  );
}

function DayEditor({
  label,
  day,
  weeks,
  onChange,
  onRemove,
  onCopy,
}: {
  label: string;
  day: ProgramDay;
  weeks: number;
  onChange: (change: (day: ProgramDay) => ProgramDay) => void;
  onRemove: () => void;
  onCopy: (to: { week: number; dayIndex: number }) => void;
}) {
  const [copyWeekTarget, setCopyWeekTarget] = useState(day.week);
  const [copyDayTarget, setCopyDayTarget] = useState(day.dayIndex === 7 ? 1 : day.dayIndex + 1);

  const setExercises = (change: (list: ProgramExercise[]) => ProgramExercise[]) =>
    onChange((d) => ({ ...d, exercises: change(d.exercises) }));

  return (
    <section className="card flex flex-col gap-3" aria-label={`${label}: ${day.name}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-white w-24">{label}</span>
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
        <ol className="flex flex-col gap-2">
          {day.exercises.map((exercise, i) => (
            <ExerciseRow
              key={`${i}-${exercise.exerciseId}`}
              index={i}
              count={day.exercises.length}
              exercise={exercise}
              onChange={(next) => setExercises((list) => list.map((e, j) => (j === i ? next : e)))}
              onMove={(to) => setExercises((list) => moveItem(list, i, to))}
              onRemove={() => setExercises((list) => list.filter((_, j) => j !== i))}
            />
          ))}
        </ol>
      )}

      {day.exercises.length < MAX_EXERCISES_PER_DAY && (
        <ExerciseSearch
          onPick={(ex) => setExercises((list) => [...list, newExercise(ex.id, ex.name)])}
        />
      )}

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
  );
}

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

function ExerciseRow({
  index,
  count,
  exercise,
  onChange,
  onMove,
  onRemove,
}: {
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
    <li className="rounded-lg border p-3 flex flex-col gap-2" style={inputStyle}>
      <div className="flex items-center gap-2">
        <span className="font-bold text-white flex-1 min-w-0 truncate">
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
      <div className="flex flex-wrap gap-2">
        <NumberField
          label="Series"
          value={exercise.sets}
          min={1}
          max={20}
          onChange={(v) => set('sets', v ?? 0)}
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
        <NumberField
          label="RPE"
          value={exercise.targetRpe}
          min={1}
          max={10}
          step={0.5}
          onChange={(v) => set('targetRpe', v)}
        />
        <NumberField
          label="RIR"
          value={exercise.targetRir}
          min={0}
          max={10}
          onChange={(v) => set('targetRir', v)}
        />
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
        <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Carga
          <input
            className={`${inputClass} w-28`}
            style={inputStyle}
            placeholder="75 %, 40 kg…"
            maxLength={60}
            value={exercise.loadHint ?? ''}
            onChange={(e) => set('loadHint', e.target.value || null)}
          />
        </label>
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
    </li>
  );
}

const MAX_RESULTS = 8;

/** Searches the shared catalog and the coach's own exercises. */
function ExerciseSearch({ onPick }: { onPick: (exercise: Exercise) => void }) {
  const { data: catalog = [] } = useExerciseCatalog();
  const { data: custom = [] } = useCustomExercises();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalizeString(query.trim());
    if (!q) return [];
    return [...custom, ...catalog]
      .filter((ex) => normalizeString(ex.name).includes(q))
      .slice(0, MAX_RESULTS);
  }, [query, catalog, custom]);

  return (
    <div className="flex flex-col gap-1">
      <input
        type="search"
        aria-label="Buscar ejercicio para añadir"
        placeholder="Añadir ejercicio: escribe para buscar"
        className={inputClass}
        style={inputStyle}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() !== '' && (
        <ul className="flex flex-col gap-1" aria-label="Resultados">
          {results.length === 0 && (
            <li className="text-sm px-1" style={{ color: 'var(--text-secondary)' }}>
              Nada coincide.
            </li>
          )}
          {results.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                className="btn btn-secondary w-full justify-start"
                onClick={() => {
                  onPick(ex);
                  setQuery('');
                }}
              >
                <Plus size={14} aria-hidden /> {ex.name}
                {ex.custom && (
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
                    propio
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
