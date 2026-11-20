import { useContext, useId, useRef, useState, type KeyboardEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronDown,
  Dumbbell,
  GripVertical,
  MoreHorizontal,
  Plus,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import type { PrescribedLoad, ProgramExercise, SetTarget } from '@/lib/coach/coachPrograms';
import { effortOf, parseReps, repsText, rowsOf, withRows } from '@/lib/coach/prescription';
import { restLabel } from '@/lib/coach/today';
import type { WorkoutSet } from '@/lib/workout/types';
import type { EffortMethod } from '@/lib/coach/prescription';
import { AthleteHistory, usePrescribing } from './prescribing';
import { Select } from '@/components/ui/select';
import { GRIPS, MACHINES, VariantChip } from './VariantChip';
import { BASE_EXERCISES, useExerciseCatalog } from '@/lib/workout/exercises';

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

/** What the athlete did in one set, laid out in the same cells as the prescription beside it. */
function PastSet({
  set,
  effort,
  index,
}: {
  set?: WorkoutSet;
  effort: EffortMethod;
  index: number;
}) {
  const other = effort === 'RPE' ? set?.rir && `RIR ${set.rir}` : set?.rpe && `RPE ${set.rpe}`;
  const effortValue = effort === 'RPE' ? set?.rpe || other : set?.rir || other;
  const cells = [set?.reps, ...(effort === 'NONE' ? [] : [effortValue]), set?.weight];
  return (
    <span
      className="contents"
      role="group"
      aria-label={
        set
          ? `Última vez, serie ${index + 1}: ${[set.weight && `${set.weight} kg`, set.reps && `${set.reps} reps`, set.rpe && `RPE ${set.rpe}`, set.rir && `RIR ${set.rir}`].filter(Boolean).join(', ')}`
          : `Última vez, serie ${index + 1}: no la hizo`
      }
    >
      {cells.map((value, j) => (
        <span
          key={j}
          className="set-past"
          data-first={j === 0 ? '' : undefined}
          data-none={value ? undefined : ''}
          aria-hidden
        >
          {value || '–'}
        </span>
      ))}
    </span>
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
  // The same GIF the exercise shows everywhere else: quicker to spot than the name.
  const catalog = useExerciseCatalog().data;
  const gif = [...BASE_EXERCISES, ...(catalog ?? [])].find(
    (e) => e.id === exercise.exerciseId,
  )?.gifUrl;
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
  // Folded, the card reads as one line of figures: series, reps, effort and load, each named once.
  const spread = (values: (number | null | undefined)[]) => {
    const set = [...new Set(values.filter((v): v is number => v != null))];
    if (!set.length) return null;
    const lo = Math.min(...set);
    const hi = Math.max(...set);
    return lo === hi ? String(lo) : `${lo}–${hi}`;
  };
  const reps = [...new Set(rows.map((row) => repsText(row).replace('-', '–')).filter(Boolean))];
  type Part = { lead?: string; value: string | null; unit: string };
  const parts: (Part | false | 0)[] = [
    { value: String(rows.length), unit: rows.length === 1 ? 'serie' : 'series' },
    reps.length && {
      value:
        reps.length === 1
          ? reps[0]
          : rows.map((row) => repsText(row).replace('-', '–') || '–').join(' · '),
      unit: 'reps',
    },
    effort !== 'NONE' && {
      lead: effort,
      value: spread(rows.map((row) => (effort === 'RPE' ? row.rpe : row.rir))),
      unit: '',
    },
    {
      value: spread(rows.map((row) => row.load?.amount)),
      unit: loadHeader,
    },
  ];
  // Every card keeps the four slots so the figures line up in columns down the day.
  const slots = parts.map((part) =>
    part && part.value ? (part as Part & { value: string }) : null,
  );
  const summary = slots.filter((part): part is Part & { value: string } => !!part);
  const columns = `${effort === 'NONE' ? 'set-grid set-grid-2' : 'set-grid'}${versus ? ' set-grid-versus' : ''}`;
  const sides = effort === 'NONE' ? 2 : 3;
  const variant = [exercise.variantMachine, exercise.variantGrip].filter(Boolean).join(' · ');

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
      {/* The chevron is the keyboard path; a click anywhere else on the head that is not a control does the same. */}
      <div
        className="set-card-head"
        onClick={(e) => {
          if (!compact) return;
          if (
            (e.target as HTMLElement).closest(
              'button, input, select, a, .variant-chip, [data-rbd-drag-handle-draggable-id]',
            )
          )
            return;
          setOpen(!open);
        }}
      >
        <span {...drag.dragHandleProps} aria-label={`Arrastrar ${name}`} className="set-card-grip">
          <GripVertical size={16} aria-hidden />
        </span>
        <span className="set-card-media" aria-hidden="true">
          {gif ? <img src={gif} alt="" loading="lazy" /> : <Dumbbell size={16} />}
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
        {detail && !folded && (
          <span className="set-card-variants">
            <VariantChip
              label="Agarre"
              what={`Agarre de ${name}`}
              value={exercise.variantGrip}
              options={GRIPS}
              last={last?.variant?.grip}
              onChange={(variantGrip) => onChange({ ...exercise, variantGrip })}
            />
            <VariantChip
              label="Máquina o variante"
              what={`Máquina o variante de ${name}`}
              value={exercise.variantMachine}
              options={MACHINES}
              last={last?.variant?.machine}
              onChange={(variantMachine) => onChange({ ...exercise, variantMachine })}
            />
          </span>
        )}
        {folded && (
          <button
            type="button"
            className="set-sum"
            aria-label={`Abrir ${name}: ${summary.map((part) => [part.lead, part.value, part.unit].filter(Boolean).join(' ')).join(', ')}`}
            onClick={() => setOpen(true)}
          >
            {slots.map((part, i) =>
              part ? (
                <span key={i} className="set-sum-part" data-slot={i}>
                  {part.lead && <small>{part.lead}</small>}
                  <strong>{part.value}</strong>
                  <small>{part.unit}</small>
                </span>
              ) : (
                <span key={i} className="set-sum-part" data-slot={i} data-empty="" />
              ),
            )}
          </button>
        )}
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
            <Select
              className="form-input"
              value={mode === 'KG' ? 'KG' : lift}
              onChange={(e) => setLoadMode(e.target.value)}
            >
              <option value="KG">Kilos</option>
              <option value="squat">% del máximo de sentadilla</option>
              <option value="bench">% del máximo de banca</option>
              <option value="deadlift">% del máximo de peso muerto</option>
            </Select>
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
      <div role="group" aria-label={`Series de ${name}`} className="set-rows" hidden={folded}>
        {versus && (
          <div className={`${columns} set-grid-sides`} aria-hidden>
            <span />
            <span style={{ gridColumn: `span ${sides}` }}>Pauta</span>
            <span className="set-past-side" style={{ gridColumn: `span ${sides}` }}>
              Hizo el {format(last.date, 'd MMM', { locale: es })}
            </span>
            <span />
          </div>
        )}
        <div className={`${columns} set-grid-head`} aria-hidden>
          <span />
          <span>Reps</span>
          {effort !== 'NONE' && <span>{effort}</span>}
          <span>{loadHeader}</span>
          {versus && (
            <>
              <span className="set-past-side">Reps</span>
              {effort !== 'NONE' && <span>{effort}</span>}
              <span>kg</span>
            </>
          )}
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
                {versus && <PastSet set={last.sets[i]} effort={effort} index={i} />}
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
                  <Select
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
                  </Select>
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
    </li>
  );
}
