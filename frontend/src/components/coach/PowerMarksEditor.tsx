import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  MAX_KEYS,
  POWER_LABELS,
  POWER_LIFTS,
  type PowerLift,
  type PowerMark,
  type PowerProfile,
} from '../../lib/coach/powerlifting';
import { DatePicker, formatShortDate, todayIso } from '@/components/ui/date-picker';

const PAGE = 8;
const MAX_MARKS = 200;
const kg = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
const signed = (n: number) => (n > 0 ? `+${kg(n)}` : n < 0 ? `−${kg(-n)}` : '=');
const contextLabel = (m: PowerMark) => (m.context === 'COMPETITION' ? 'competición' : 'entreno');

/** El mejor peso de un levantamiento; a igualdad, el primero que lo levantó. */
export function bestMark(marks: PowerMark[], lift: PowerLift, until?: string) {
  return marks
    .filter((m) => m.lift === lift && m.kg > 0 && (!until || m.date <= until))
    .sort((a, b) => b.kg - a.kg || a.date.localeCompare(b.date))[0];
}

type Draft = { id: string | null; lift: PowerLift } & Omit<PowerMark, 'id' | 'lift'>;

/** Un tablero por levantamiento: récord y TM arriba, historial debajo y el formulario dentro. */
export function PowerMarksEditor({
  marks,
  trainingMax,
  onChange,
  readOnly,
}: {
  marks: PowerMark[];
  trainingMax: PowerProfile['trainingMax'];
  onChange: (marks: PowerMark[]) => void;
  readOnly: boolean;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const today = todayIso();
  const save = (d: Draft) => {
    const mark: PowerMark = {
      id: d.id ?? crypto.randomUUID(),
      lift: d.lift,
      kg: d.kg,
      date: d.date,
      context: d.context,
      reference: d.reference.trim(),
    };
    onChange(d.id ? marks.map((m) => (m.id === d.id ? mark : m)) : [...marks, mark]);
    setDraft(null);
  };
  return (
    <div className="pw-board">
      {POWER_LIFTS.map((lift) => (
        <LiftColumn
          key={lift}
          lift={lift}
          marks={marks.filter((m) => m.lift === lift)}
          all={marks}
          tm={trainingMax[MAX_KEYS[lift]]}
          today={today}
          readOnly={readOnly}
          full={marks.length >= MAX_MARKS}
          draft={draft?.lift === lift ? draft : null}
          setDraft={setDraft}
          onSave={save}
          onRemove={(id) => {
            onChange(marks.filter((m) => m.id !== id));
            setDraft(null);
          }}
        />
      ))}
      <p className="pw-hint pw-board-hint">
        Levantamientos de una repetición anotados por ti; no son resultados certificados ni forman
        un total de competición. Los cambios se guardan con el botón de abajo.
      </p>
    </div>
  );
}

function LiftColumn({
  lift,
  marks,
  all,
  tm,
  today,
  readOnly,
  full,
  draft,
  setDraft,
  onSave,
  onRemove,
}: {
  lift: PowerLift;
  marks: PowerMark[];
  all: PowerMark[];
  tm: number | null;
  today: string;
  readOnly: boolean;
  full: boolean;
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  onSave: (d: Draft) => void;
  onRemove: (id: string) => void;
}) {
  const [limit, setLimit] = useState(PAGE);
  const label = POWER_LABELS[lift];
  const best = bestMark(all, lift);
  const before = bestMark(all, lift, addDaysIso(today, -84));
  const gain = best && before ? best.kg - before.kg : null;
  // Cronológico para calcular la subida respecto a la marca anterior; se pinta al revés.
  const chrono = [...marks].sort(
    (a, b) => a.date.localeCompare(b.date) || all.indexOf(a) - all.indexOf(b),
  );
  const rows = chrono
    .map((m, i) => ({ mark: m, delta: i > 0 && m.kg > 0 ? m.kg - chrono[i - 1].kg : null }))
    .reverse();
  const titleId = `pw-col-${lift}`;
  const open = (mark: PowerMark | null) =>
    setDraft(
      mark
        ? { ...mark }
        : { id: null, lift, kg: 0, date: today, context: 'TRAINING', reference: '' },
    );
  return (
    <section className="pw-col" aria-labelledby={titleId}>
      <header className="pw-col-head">
        <h3 id={titleId}>{label}</h3>
        <p className="pw-col-best">
          {best ? (
            <>
              <strong>
                {kg(best.kg)}
                <small>kg</small>
              </strong>
              <span>
                {formatShortDate(best.date)} · {contextLabel(best)}
              </span>
            </>
          ) : (
            <span>Sin marcas todavía</span>
          )}
        </p>
        <p className="pw-col-meta">
          <span>
            TM <b>{tm ? `${kg(tm)} kg` : '—'}</b>
          </span>
          {gain !== null && (
            <span>
              <b>{gain > 0 ? `+${kg(gain)} kg` : gain === 0 ? 'Sin cambios' : `${kg(gain)} kg`}</b>{' '}
              en 12 semanas
            </span>
          )}
        </p>
      </header>
      {draft && draft.id === null && (
        <MarkForm
          draft={draft}
          today={today}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={onSave}
        />
      )}
      {rows.length === 0 ? (
        <p className="pw-empty pw-col-empty">No hay marcas de {label.toLowerCase()}.</p>
      ) : (
        <ul className="pw-col-list">
          {rows.slice(0, limit).map(({ mark, delta }) =>
            draft?.id === mark.id ? (
              <li key={mark.id}>
                <MarkForm
                  draft={draft}
                  today={today}
                  onChange={setDraft}
                  onCancel={() => setDraft(null)}
                  onSave={onSave}
                  onRemove={() => onRemove(mark.id)}
                />
              </li>
            ) : (
              <li key={mark.id}>
                <button
                  type="button"
                  className="pw-mark"
                  disabled={readOnly}
                  aria-label={`${label}, ${kg(mark.kg)} kg, ${formatShortDate(mark.date)}${readOnly ? '' : '. Editar'}`}
                  onClick={() => open(mark)}
                >
                  <span className="pw-mark-kg">
                    {mark.kg > 0 ? kg(mark.kg) : '—'}
                    <small>kg</small>
                  </span>
                  <span className="pw-mark-info">
                    <span className="pw-mark-ref">
                      {mark.reference ||
                        (mark.context === 'COMPETITION' ? 'Competición' : 'Entreno')}
                    </span>
                    <span>
                      {formatShortDate(mark.date)}
                      {mark.reference ? ` · ${contextLabel(mark)}` : ''}
                    </span>
                  </span>
                  <span
                    className="pw-mark-delta"
                    data-flat={delta === null || delta === 0 || undefined}
                  >
                    {mark.id === best?.id ? (
                      <span className="pw-tag">Récord</span>
                    ) : delta === null ? (
                      '—'
                    ) : (
                      signed(delta)
                    )}
                  </span>
                </button>
              </li>
            ),
          )}
        </ul>
      )}
      {rows.length > limit && (
        <button type="button" className="pw-col-more" onClick={() => setLimit((n) => n + PAGE * 2)}>
          Ver {Math.min(rows.length - limit, PAGE * 2)} más de {rows.length - limit}
        </button>
      )}
      {!readOnly && !draft && (
        <div className="pw-col-add">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={full}
            onClick={() => open(null)}
          >
            <Plus size={16} aria-hidden /> Añadir {label.toLowerCase()}
          </button>
          {full && <p className="pw-hint">Has llegado al máximo de {MAX_MARKS} marcas.</p>}
        </div>
      )}
    </section>
  );
}

function MarkForm({
  draft,
  today,
  onChange,
  onCancel,
  onSave,
  onRemove,
}: {
  draft: Draft;
  today: string;
  onChange: (d: Draft) => void;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  onRemove?: () => void;
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  const label = POWER_LABELS[draft.lift].toLowerCase();
  const kgError = !(draft.kg >= 0.01 && draft.kg <= 1500)
    ? 'Indica un peso entre 0,01 y 1500 kg.'
    : null;
  const dateError = !draft.date || draft.date > today ? 'La fecha no puede ser futura.' : null;
  const error = kgError ?? dateError;
  const errorId = `pw-mark-error-${draft.id ?? draft.lift}`;
  return (
    <div
      className="pw-mark-form"
      role="group"
      aria-label={draft.id ? `Editar marca de ${label}` : `Nueva marca de ${label}`}
      onKeyDown={(e) => {
        // Enter guarda la marca sin enviar el formulario del perfil.
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
          e.preventDefault();
          if (!error) onSave(draft);
        }
      }}
    >
      <div className="pw-mark-form-row">
        <label className="pw-field">
          Fecha
          <DatePicker
            className="form-input"
            value={draft.date}
            max={today}
            required
            onChange={(date) => set({ date })}
          />
        </label>
        <label className="pw-field">
          Peso
          <span className="pw-kg-input">
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              max="1500"
              step="0.01"
              placeholder="0"
              autoFocus
              aria-invalid={kgError && draft.kg ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              value={draft.kg || ''}
              onChange={(e) => set({ kg: Number(e.target.value) })}
            />
            <span aria-hidden="true">kg</span>
          </span>
        </label>
      </div>
      <div className="pw-field">
        <span id={`${errorId}-ctx`}>Contexto</span>
        <span className="pw-seg" role="group" aria-labelledby={`${errorId}-ctx`}>
          {(
            [
              ['TRAINING', 'Entreno'],
              ['COMPETITION', 'Competición'],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={draft.context === value}
              onClick={() => set({ context: value })}
            >
              {text}
            </button>
          ))}
        </span>
      </div>
      <label className="pw-field">
        Referencia
        <input
          className="form-input"
          maxLength={200}
          placeholder="Sesión o competición"
          value={draft.reference}
          onChange={(e) => set({ reference: e.target.value })}
        />
      </label>
      {error && draft.kg !== 0 && (
        <p id={errorId} className="pw-mark-error" role="alert">
          {error}
        </p>
      )}
      <div className="pw-mark-form-actions">
        {onRemove && (
          <button type="button" className="pw-mark-remove" onClick={onRemove}>
            <Trash2 size={15} aria-hidden /> Quitar
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!!error}
          onClick={() => onSave(draft)}
        >
          {draft.id ? 'Aplicar' : 'Añadir'}
        </button>
      </div>
    </div>
  );
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
