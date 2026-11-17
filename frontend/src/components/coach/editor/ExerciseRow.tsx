import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { GripVertical, MoreHorizontal, Plus, X } from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import type { PrescribedLoad, ProgramExercise, SetTarget } from '@/lib/coach/coachPrograms';
import {
  effortOf,
  parseReps,
  protocolText,
  repsText,
  rowsOf,
  withRows,
} from '@/lib/coach/prescription';
import { usePrescribing } from './prescribing';

const MAX_SETS = 20;
const KINDS: { value: SetTarget['kind']; label: string; tag: string }[] = [
  { value: 'WORK', label: 'Serie de trabajo', tag: '' },
  { value: 'WARMUP', label: 'Calentamiento', tag: 'Cal.' },
  { value: 'TOP', label: 'Top set', tag: 'Top' },
  { value: 'BACKOFF', label: 'Back-off', tag: 'Back' },
];
const LIFTS = { squat: 'sentadilla', bench: 'banca', deadlift: 'peso muerto' } as const;
type Lift = keyof typeof LIFTS;

/** Parses a cell; `undefined` means "not a valid value yet", so the row keeps what it had. */
const numberIn = (min: number, max: number, step: number) => (text: string) => {
  const value = text.trim().replace(',', '.');
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return Math.abs(number / step - Math.round(number / step)) < 1e-9 ? number : undefined;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function Cell<T>({
  label,
  text,
  parse,
  onCommit,
  onKeyDown,
  numeric,
  cell,
}: {
  label: string;
  text: string;
  parse: (text: string) => T | undefined;
  onCommit: (value: T) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  numeric?: boolean;
  cell: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      className="set-cell"
      aria-label={label}
      aria-invalid={draft != null && parse(draft) === undefined ? true : undefined}
      data-cell={cell}
      inputMode={numeric ? 'decimal' : 'text'}
      autoComplete="off"
      value={draft ?? text}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        setDraft(event.target.value);
        const value = parse(event.target.value);
        if (value !== undefined) onCommit(value);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={onKeyDown}
    />
  );
}

export function ExerciseRow({
  drag,
  index,
  exercise,
  onChange,
  onRemove,
}: {
  drag: DraggableProvided;
  index: number;
  exercise: ProgramExercise;
  onChange: (next: ProgramExercise) => void;
  onRemove: () => void;
}) {
  const name = exercise.exerciseName || exercise.exerciseId;
  const prefs = usePrescribing();
  const card = useRef<HTMLLIElement | null>(null);
  const optionsId = useId();
  const [options, setOptions] = useState(false);
  const [openSet, setOpenSet] = useState<number | null>(null);
  const [pending, setPending] = useState<Pick<PrescribedLoad, 'mode' | 'lift' | 'increment'>>();

  const rows = rowsOf(exercise);
  const effort = effortOf(rows, prefs.effort);
  const shape = rows.find((row) => row.load)?.load ?? null;
  const mode = pending?.mode ?? shape?.mode ?? 'KG';
  const lift = (pending?.lift ?? shape?.lift ?? 'squat') as Lift;
  const increment = pending?.increment ?? shape?.increment ?? 2.5;
  const unit = shape?.unit ?? prefs.unitOf(exercise.exerciseId);
  const loadOf = (amount: number): PrescribedLoad =>
    mode === 'KG'
      ? { mode, amount, unit }
      : { mode, amount, unit, lift, increment, resolvedKg: null, referenceKg: null };

  const commit = (next: SetTarget[]) => onChange(withRows(exercise, next));
  /** Later sets that still matched this one follow the edit, so equal sets are typed once. */
  const edit = (i: number, patch: Partial<SetTarget>, fill = true) => {
    const keys = Object.keys(patch) as (keyof SetTarget)[];
    const before = rows[i];
    commit(
      rows.map((row, j) =>
        j === i || (fill && j > i && keys.every((key) => same(row[key], before[key])))
          ? { ...row, ...patch }
          : row,
      ),
    );
  };
  const focus = (row: number, column: number) =>
    requestAnimationFrame(() =>
      card.current?.querySelector<HTMLInputElement>(`[data-cell="${row}:${column}"]`)?.focus(),
    );
  const addAfter = (i: number, column = 0) => {
    if (rows.length >= MAX_SETS) return;
    commit([...rows.slice(0, i + 1), { ...rows[i], notes: null }, ...rows.slice(i + 1)]);
    focus(i + 1, column);
  };
  const keys = (i: number, column: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addAfter(i, column);
    } else if (event.key === 'ArrowDown' && i < rows.length - 1) {
      event.preventDefault();
      focus(i + 1, column);
    } else if (event.key === 'ArrowUp' && i > 0) {
      event.preventDefault();
      focus(i - 1, column);
    }
  };
  const setLoadMode = (value: string) => {
    const next =
      value === 'KG'
        ? { mode: 'KG' as const }
        : { mode: 'PERCENT_TM' as const, lift: value as Lift, increment };
    setPending(next);
    if (shape)
      commit(
        rows.map((row) =>
          row.load
            ? {
                ...row,
                load:
                  next.mode === 'KG'
                    ? { mode: 'KG', amount: row.load.amount, unit }
                    : {
                        ...next,
                        amount: Math.min(row.load.amount, 200),
                        unit,
                        resolvedKg: null,
                        referenceKg: null,
                      },
              }
            : row,
        ),
      );
  };

  const loadHeader = mode === 'KG' ? (unit === 'EACH' ? 'kg/manc.' : 'kg') : `% ${LIFTS[lift]}`;
  const extras = [
    exercise.restSeconds != null && `Descanso ${exercise.restSeconds} s`,
    exercise.supersetGroup != null && `Superserie ${exercise.supersetGroup}`,
  ].filter(Boolean);
  const columns = effort === 'NONE' ? 'set-grid set-grid-2' : 'set-grid';

  return (
    <li
      data-tour="exercise-prescription"
      ref={(node) => {
        card.current = node;
        drag.innerRef(node);
      }}
      {...drag.draggableProps}
      className="set-card"
      style={drag.draggableProps.style}
    >
      <div className="set-card-head">
        <span {...drag.dragHandleProps} aria-label={`Arrastrar ${name}`} className="set-card-grip">
          <GripVertical size={16} aria-hidden />
        </span>
        <span className="set-card-name">
          {index + 1}. {name}
        </span>
        <button
          type="button"
          className="set-icon"
          aria-label={`Más opciones de ${name}`}
          aria-expanded={options}
          aria-controls={optionsId}
          title="Descanso, superserie y tipo de carga"
          onClick={() => setOptions((open) => !open)}
        >
          <MoreHorizontal size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="set-icon"
          aria-label={`Quitar ${name}`}
          title="Quitar ejercicio"
          onClick={onRemove}
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      {options && (
        <div id={optionsId} className="set-options">
          <label>
            Descanso (s)
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              min={0}
              max={900}
              step={15}
              value={exercise.restSeconds ?? ''}
              onChange={(e) =>
                onChange({
                  ...exercise,
                  restSeconds: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            Superserie n.º
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={exercise.supersetGroup ?? ''}
              onChange={(e) =>
                onChange({
                  ...exercise,
                  supersetGroup: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            La carga se pauta en
            <select
              className="form-input"
              value={mode === 'KG' ? 'KG' : lift}
              onChange={(e) => setLoadMode(e.target.value)}
            >
              <option value="KG">Kilos</option>
              <option value="squat">% del máximo de sentadilla</option>
              <option value="bench">% del máximo de banca</option>
              <option value="deadlift">% del máximo de peso muerto</option>
            </select>
          </label>
          {mode === 'KG' && !shape && (
            <label>
              Carga en texto
              <input
                className="form-input"
                maxLength={60}
                placeholder="p. ej. goma roja"
                value={exercise.loadHint ?? ''}
                onChange={(e) => onChange({ ...exercise, loadHint: e.target.value || null })}
              />
            </label>
          )}
          <p className="set-options-hint">
            Dos ejercicios con el mismo número de superserie se hacen seguidos.
            {mode !== 'KG' &&
              ' El porcentaje se convierte a kilos al publicar, con el máximo guardado en Powerlifting.'}
          </p>
        </div>
      )}

      <div role="group" aria-label={`Series de ${name}`} className="set-rows">
        <div className={`${columns} set-grid-head`} aria-hidden>
          <span />
          <span>Reps</span>
          {effort !== 'NONE' && <span>{effort}</span>}
          <span>{loadHeader}</span>
          <span />
        </div>
        {rows.map((row, i) => {
          const kind = KINDS.find((item) => item.value === row.kind) ?? KINDS[0];
          return (
            <div key={i} className="contents">
              <div className={columns}>
                <button
                  type="button"
                  className="set-number"
                  aria-label={`Serie ${i + 1}${kind.tag ? `, ${kind.label.toLowerCase()}` : ''}: tipo y nota`}
                  aria-expanded={openSet === i}
                  title="Tipo de serie y nota"
                  data-kind={row.kind}
                  data-note={row.notes ? '' : undefined}
                  onClick={() => setOpenSet(openSet === i ? null : i)}
                >
                  {kind.tag || i + 1}
                </button>
                <Cell
                  cell={`${i}:0`}
                  label={`Repeticiones de la serie ${i + 1}`}
                  text={repsText(row)}
                  parse={parseReps}
                  onCommit={(value) => edit(i, value)}
                  onKeyDown={keys(i, 0)}
                />
                {effort !== 'NONE' && (
                  <Cell
                    cell={`${i}:1`}
                    numeric
                    label={`${effort} de la serie ${i + 1}`}
                    text={String((effort === 'RPE' ? row.rpe : row.rir) ?? '')}
                    parse={effort === 'RPE' ? numberIn(1, 10, 0.5) : numberIn(0, 10, 1)}
                    onCommit={(value) =>
                      edit(
                        i,
                        effort === 'RPE' ? { rpe: value, rir: null } : { rir: value, rpe: null },
                      )
                    }
                    onKeyDown={keys(i, 1)}
                  />
                )}
                <Cell
                  cell={`${i}:2`}
                  numeric
                  label={`Carga de la serie ${i + 1} (${loadHeader})`}
                  text={String(row.load?.amount ?? '')}
                  parse={numberIn(0, mode === 'KG' ? 2000 : 200, 0.25)}
                  onCommit={(value) => edit(i, { load: value == null ? null : loadOf(value) })}
                  onKeyDown={keys(i, 2)}
                />
                <button
                  type="button"
                  className="set-icon"
                  aria-label={`Quitar la serie ${i + 1}`}
                  title="Quitar serie"
                  disabled={rows.length === 1}
                  onClick={() => {
                    setOpenSet(null);
                    commit(rows.filter((_, j) => j !== i));
                  }}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
              {openSet === i ? (
                <div className="set-detail">
                  <select
                    className="form-input"
                    aria-label={`Tipo de la serie ${i + 1}`}
                    value={row.kind}
                    onChange={(e) => edit(i, { kind: e.target.value as SetTarget['kind'] }, false)}
                  >
                    {KINDS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-input"
                    aria-label={`Nota de la serie ${i + 1}`}
                    placeholder="Nota de esta serie"
                    maxLength={500}
                    value={row.notes ?? ''}
                    onChange={(e) => edit(i, { notes: e.target.value || null }, false)}
                  />
                </div>
              ) : (
                row.notes && <p className="set-note">{row.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="set-add"
        disabled={rows.length >= MAX_SETS}
        onClick={() => addAfter(rows.length - 1)}
      >
        <Plus size={14} aria-hidden /> Serie
      </button>

      <input
        className="set-exercise-note"
        aria-label={`Nota de ${name}`}
        placeholder="Nota para el atleta (técnica, tempo, sensaciones)"
        maxLength={500}
        value={exercise.notes ?? ''}
        onChange={(e) => onChange({ ...exercise, notes: e.target.value || null })}
      />

      <p className="set-protocol">
        <span>El atleta lee</span> {protocolText(exercise)}
        {extras.length > 0 && ` · ${extras.join(' · ')}`}
      </p>
    </li>
  );
}
