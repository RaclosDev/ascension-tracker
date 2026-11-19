import { useContext, useId, useRef, useState, type KeyboardEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, GripVertical, MoreHorizontal, Plus, TriangleAlert, X } from 'lucide-react';
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
import { restLabel } from '@/lib/coach/today';
import { setText } from '@/lib/coach/exerciseHistory';
import { AthleteHistory, usePrescribing } from './prescribing';

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
/** Rest typed as seconds ("90"), minutes and seconds ("2:00") or minutes ("2 min"). */
const parseRest = (text: string) => {
  const value = text.trim().toLowerCase().replace(',', '.');
  if (!value) return null;
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(value);
  const minutes = /^(\d+(?:\.\d+)?)\s*(?:m|min|minutos?)$/.exec(value);
  const seconds = /^(\d+)\s*(?:s|seg|segundos?)?$/.exec(value);
  const total = clock
    ? Number(clock[1]) * 60 + Number(clock[2])
    : minutes
      ? Math.round(Number(minutes[1]) * 60)
      : seconds
        ? Number(seconds[1])
        : NaN;
  return Number.isFinite(total) && total <= 900 ? total : undefined;
};
const HINTS = {
  reps: 'Repeticiones: un número o un rango como 8-10, entre 1 y 100.',
  RIR: 'RIR: un número entero de 0 a 10.',
  RPE: 'RPE: de 1 a 10, con medios puntos (7,5).',
  KG: 'Carga: solo el número, por ejemplo 62,5.',
  PERCENT_TM: 'Porcentaje: solo el número, de 0 a 200.',
  rest: 'Descanso: segundos (90) o minutos (2:00), hasta 15 minutos.',
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
  hint,
  onProblem,
  className = 'set-cell',
  placeholder = '–',
}: {
  label: string;
  text: string;
  parse: (text: string) => T | undefined;
  onCommit: (value: T) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  numeric?: boolean;
  cell?: string;
  /** What a valid value looks like; shown while the typed text cannot be read. */
  hint: string;
  onProblem: (hint: string | null) => void;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      className={className}
      aria-label={label}
      placeholder={placeholder}
      aria-invalid={draft != null && parse(draft) === undefined ? true : undefined}
      data-cell={cell}
      inputMode={numeric ? 'decimal' : 'text'}
      autoComplete="off"
      value={draft ?? text}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        setDraft(event.target.value);
        const value = parse(event.target.value);
        onProblem(value === undefined ? hint : null);
        if (value !== undefined) onCommit(value);
      }}
      onBlur={() => {
        setDraft(null);
        onProblem(null);
      }}
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
  send,
  compact,
  detail,
}: {
  drag: DraggableProvided;
  index: number;
  exercise: ProgramExercise;
  onChange: (next: ProgramExercise) => void;
  onRemove: () => void;
  /** Week editor only: the other weekdays this exercise can be copied or moved to. */
  send?: { days: { value: number; label: string }[]; onSend: (to: number, move: boolean) => void };
  /** One line per exercise: equal sets are typed once and the set-by-set grid opens on demand. */
  compact?: boolean;
  /** With room to spare: set by set from the start, beside what the athlete did last time. */
  detail?: boolean;
}) {
  const name = exercise.exerciseName || exercise.exerciseId;
  const prefs = usePrescribing();
  const vetoed = prefs.avoidedOf(exercise.exerciseId);
  const card = useRef<HTMLLIElement | null>(null);
  const optionsId = useId();
  const [options, setOptions] = useState(false);
  const [open, setOpen] = useState(!compact || !!detail);
  const last = useContext(AthleteHistory).find(
    (use) => use.exerciseId === exercise.exerciseId,
  )?.last;
  const versus = !!detail && !!last;
  const folded = !!compact && !open;
  const [openSet, setOpenSet] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, setPending] = useState<Pick<PrescribedLoad, 'mode' | 'lift' | 'increment'>>();
  const [sendTo, setSendTo] = useState(send?.days[0]?.value ?? 1);

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
        j === i ||
        (fill &&
          j > i &&
          row.kind === before.kind &&
          keys.every((key) => same(row[key], before[key])))
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
      // Enter walks down the column like a spreadsheet; only the last row grows the exercise.
      event.preventDefault();
      if (i < rows.length - 1) focus(i + 1, column);
      else addAfter(i, column);
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
    if (!shape) return;
    // Kilos and percentages are different numbers: 62,5 kg must not turn into 62,5 %.
    const keep = next.mode !== 'KG' && shape.mode !== 'KG';
    commit(
      rows.map((row) =>
        row.load
          ? {
              ...row,
              load: keep ? { ...row.load, ...next, resolvedKg: null, referenceKg: null } : null,
            }
          : row,
      ),
    );
  };

  const loadHeader = mode === 'KG' ? (unit === 'EACH' ? 'kg/manc.' : 'kg') : `% ${LIFTS[lift]}`;
  const extras = [
    exercise.restSeconds != null && `Descanso ${restLabel(exercise.restSeconds)}`,
    exercise.supersetGroup != null && `Superserie ${exercise.supersetGroup}`,
  ].filter(Boolean);
  const columns = `${effort === 'NONE' ? 'set-grid set-grid-2' : 'set-grid'}${versus ? ' set-grid-versus' : ''}`;
  const variant = [exercise.variantMachine, exercise.variantGrip].filter(Boolean).join(' · ');
  // Sets that share everything are one line of numbers; anything else reads as its protocol.
  const uniform = rows.every(
    (row) =>
      row.kind === 'WORK' &&
      !row.notes &&
      same(
        [row.reps, row.repsMax, row.rpe, row.rir, row.load],
        [rows[0].reps, rows[0].repsMax, rows[0].rpe, rows[0].rir, rows[0].load],
      ),
  );
  const count = numberIn(1, MAX_SETS, 1);

  return (
    <li
      data-tour="exercise-prescription"
      ref={(node) => {
        card.current = node;
        drag.innerRef(node);
      }}
      {...drag.draggableProps}
      className="set-card"
      data-compact={compact ? '' : undefined}
      data-open={compact && open ? '' : undefined}
      style={drag.draggableProps.style}
    >
      <div className="set-card-head">
        <span {...drag.dragHandleProps} aria-label={`Arrastrar ${name}`} className="set-card-grip">
          <GripVertical size={16} aria-hidden />
        </span>
        <span className="set-card-name">
          {index + 1}. {name}
          {variant && folded && <span className="set-card-variant">{variant}</span>}
          {vetoed && (
            <span className="set-card-vetoed" role="status">
              <TriangleAlert size={13} aria-hidden /> Vetado para este atleta
              {vetoed.reason ? `: ${vetoed.reason}` : ''}
            </span>
          )}
        </span>
        {folded &&
          (uniform ? (
            <span className="set-quick" data-effort={effort === 'NONE' ? undefined : ''}>
              <Cell
                numeric
                label={`Número de series de ${name}`}
                hint="Series: un número entero de 1 a 20."
                onProblem={setProblem}
                text={String(rows.length)}
                parse={(text) => count(text) ?? undefined}
                onCommit={(total) =>
                  commit(Array.from({ length: total }, (_, i) => rows[i] ?? { ...rows[0] }))
                }
                onKeyDown={() => {}}
              />
              <span aria-hidden>×</span>
              <Cell
                cell="0:0"
                label={`Repeticiones de ${name}`}
                placeholder="reps"
                text={repsText(rows[0])}
                hint={HINTS.reps}
                onProblem={setProblem}
                parse={parseReps}
                onCommit={(value) => edit(0, value)}
                onKeyDown={() => {}}
              />
              {effort !== 'NONE' && (
                <Cell
                  numeric
                  label={`${effort} de ${name}`}
                  placeholder={effort}
                  hint={HINTS[effort]}
                  onProblem={setProblem}
                  text={String((effort === 'RPE' ? rows[0].rpe : rows[0].rir) ?? '')}
                  parse={effort === 'RPE' ? numberIn(1, 10, 0.5) : numberIn(0, 10, 1)}
                  onCommit={(value) =>
                    edit(
                      0,
                      effort === 'RPE' ? { rpe: value, rir: null } : { rir: value, rpe: null },
                    )
                  }
                  onKeyDown={() => {}}
                />
              )}
              <Cell
                numeric
                label={`Carga de ${name} (${loadHeader})`}
                placeholder={loadHeader}
                hint={HINTS[mode]}
                onProblem={setProblem}
                text={String(rows[0].load?.amount ?? '')}
                parse={numberIn(0, mode === 'KG' ? 2000 : 200, 0.25)}
                onCommit={(value) => edit(0, { load: value == null ? null : loadOf(value) })}
                onKeyDown={() => {}}
              />
            </span>
          ) : (
            <button
              type="button"
              className="set-quick set-quick-text"
              title="Las series son distintas: ábrelo para editarlas"
              onClick={() => setOpen(true)}
            >
              {protocolText(exercise)}
            </button>
          ))}
        {compact && (
          <button
            type="button"
            className="set-icon"
            aria-label={`${open ? 'Plegar' : 'Serie a serie y opciones de'} ${name}`}
            aria-expanded={open}
            title={open ? 'Plegar' : 'Serie a serie, descanso, nota y más'}
            data-flip={open ? '' : undefined}
            onClick={() => setOpen(!open)}
          >
            <ChevronDown size={16} aria-hidden />
          </button>
        )}
        {!folded && (
          <button
            type="button"
            className="set-icon"
            aria-label={`Más opciones de ${name}`}
            aria-expanded={options}
            aria-controls={optionsId}
            title="Descanso, superserie y tipo de carga"
            onClick={() => setOptions((shown) => !shown)}
          >
            <MoreHorizontal size={16} aria-hidden />
          </button>
        )}
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

      {options && !folded && (
        <div id={optionsId} className="set-options">
          <label>
            Descanso
            <Cell
              className="form-input"
              label={`Descanso de ${name}`}
              placeholder="90 o 2:00"
              hint={HINTS.rest}
              onProblem={setProblem}
              text={exercise.restSeconds == null ? '' : restLabel(exercise.restSeconds)}
              parse={parseRest}
              onCommit={(restSeconds) => onChange({ ...exercise, restSeconds })}
              onKeyDown={() => {}}
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
              onChange={(e) => {
                const group = Math.round(Number(e.target.value));
                onChange({
                  ...exercise,
                  supersetGroup: e.target.value === '' || group < 1 || group > 20 ? null : group,
                });
              }}
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
          {send && (
            <div className="set-send">
              <label>
                Enviar a otro día
                <select
                  className="form-input"
                  aria-label={`Día al que enviar ${name}`}
                  value={sendTo}
                  onChange={(e) => setSendTo(Number(e.target.value))}
                >
                  {send.days.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => send.onSend(sendTo, false)}
              >
                Copiar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => send.onSend(sendTo, true)}
              >
                Mover
              </button>
            </div>
          )}
          <p className="set-options-hint">
            Dos ejercicios con el mismo número de superserie se hacen seguidos.
            {mode !== 'KG' &&
              ' El porcentaje se convierte a kilos al publicar, con el máximo que el atleta tiene guardado en su sección Powerlifting. Al cambiar entre kilos y porcentaje las cargas se vacían.'}
          </p>
        </div>
      )}

      {folded && (exercise.notes || exercise.supersetGroup != null) && (
        <p className="set-fold-note">
          {[exercise.notes, extras.find((extra) => String(extra).startsWith('Superserie'))]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      {detail && !folded && (
        <div className="set-variant">
          <label>
            Agarre
            <input
              className="form-input"
              aria-label={`Agarre de ${name}`}
              placeholder={last?.variant?.grip || 'Sin indicar'}
              maxLength={255}
              value={exercise.variantGrip ?? ''}
              onChange={(e) => onChange({ ...exercise, variantGrip: e.target.value || null })}
            />
          </label>
          <label>
            Máquina o variante
            <input
              className="form-input"
              aria-label={`Máquina o variante de ${name}`}
              placeholder={last?.variant?.machine || 'Sin indicar'}
              maxLength={255}
              value={exercise.variantMachine ?? ''}
              onChange={(e) => onChange({ ...exercise, variantMachine: e.target.value || null })}
            />
          </label>
        </div>
      )}
      <div role="group" aria-label={`Series de ${name}`} className="set-rows" hidden={folded}>
        {versus && (
          <div className={`${columns} set-grid-sides`} aria-hidden>
            <span />
            <span style={{ gridColumn: `span ${effort === 'NONE' ? 2 : 3}` }}>Tu pauta</span>
            <span>Hizo el {format(last.date, 'd MMM', { locale: es })}</span>
            <span />
          </div>
        )}
        <div className={`${columns} set-grid-head`} aria-hidden>
          <span />
          <span>Reps</span>
          {effort !== 'NONE' && <span>{effort}</span>}
          <span>{loadHeader}</span>
          {versus && <span />}
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
                  hint={HINTS.reps}
                  onProblem={setProblem}
                  parse={parseReps}
                  onCommit={(value) => edit(i, value)}
                  onKeyDown={keys(i, 0)}
                />
                {effort !== 'NONE' && (
                  <Cell
                    cell={`${i}:1`}
                    numeric
                    label={`${effort} de la serie ${i + 1}`}
                    hint={HINTS[effort]}
                    onProblem={setProblem}
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
                  hint={HINTS[mode]}
                  onProblem={setProblem}
                  text={String(row.load?.amount ?? '')}
                  parse={numberIn(0, mode === 'KG' ? 2000 : 200, 0.25)}
                  onCommit={(value) => edit(i, { load: value == null ? null : loadOf(value) })}
                  onKeyDown={keys(i, 2)}
                />
                {versus && (
                  <span
                    className="set-last"
                    aria-label={`Última vez, serie ${i + 1}`}
                    data-none={last.sets[i] ? undefined : ''}
                  >
                    {last.sets[i] ? (
                      <>
                        {setText(last.sets[i])}
                        {last.sets[i].rir && <small>RIR {last.sets[i].rir}</small>}
                        {!last.sets[i].rir && last.sets[i].rpe && (
                          <small>RPE {last.sets[i].rpe}</small>
                        )}
                      </>
                    ) : (
                      'Sin serie'
                    )}
                  </span>
                )}
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

      {problem && (
        <p className="set-problem" role="status">
          {problem}
        </p>
      )}
      <button
        type="button"
        className="set-add"
        hidden={folded}
        disabled={rows.length >= MAX_SETS}
        onClick={() => addAfter(rows.length - 1)}
      >
        <Plus size={14} aria-hidden /> Serie
      </button>

      <input
        className="set-exercise-note"
        hidden={folded}
        aria-label={`Nota de ${name}`}
        placeholder="Nota para el atleta (técnica, tempo, sensaciones)"
        maxLength={500}
        value={exercise.notes ?? ''}
        onChange={(e) => onChange({ ...exercise, notes: e.target.value || null })}
      />

      <p className="set-protocol" hidden={folded}>
        <span>El atleta lee</span> {protocolText(exercise)}
        {extras.length > 0 && ` · ${extras.join(' · ')}`}
      </p>
    </li>
  );
}
