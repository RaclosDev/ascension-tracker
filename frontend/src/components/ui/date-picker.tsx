import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import './date-picker.css';

/*
 * Selector de fecha con el vocabulario de los desplegables propios (select.tsx): botón con la fecha
 * legible y una hoja en popover nativo con el mes, semanas de lunes a domingo y atajos. El valor es
 * siempre 'YYYY-MM-DD' (o '' sin fecha), igual que el <input type="date"> al que sustituye.
 */

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  /** Días que llevan un punto (p. ej. con entreno registrado). */
  marked?: readonly string[];
  /** Texto del botón sin fecha. */
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86400000;
const WEEKDAYS = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['X', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
] as const;

const toTime = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => toIso(toTime(iso) + days * DAY);
const addMonths = (iso: string, months: number) => {
  const d = new Date(toTime(iso));
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toIso(d.getTime());
};
const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
/** 0 = lunes … 6 = domingo. */
const weekday = (iso: string) => (new Date(toTime(iso)).getUTCDay() + 6) % 7;
const clamp = (iso: string, min?: string, max?: string) =>
  min && iso < min ? min : max && iso > max ? max : iso;

const shortFormat = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const longFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthFormat = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** «20 nov 2026», sin el punto que algunos navegadores ponen tras la abreviatura. */
export function formatShortDate(iso: string) {
  return ISO.test(iso) ? shortFormat.format(toTime(iso)).replace('.', '') : '';
}

export const todayIso = () => new Date().toLocaleDateString('sv-SE');

const GAP = 6;
const EDGE = 8;

export function DatePicker({
  value,
  onChange,
  min,
  max,
  marked,
  placeholder = 'Elegir fecha',
  id,
  name,
  className,
  style,
  disabled,
  required,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const autoId = useId();
  const triggerId = id ?? `${autoId}-trigger`;
  const sheetId = `${autoId}-sheet`;
  const headingId = `${autoId}-month`;
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = todayIso();
  const valid = ISO.test(value) ? value : '';
  const [cursor, setCursor] = useState(() => clamp(valid || today, min, max));
  const [moveFocus, setMoveFocus] = useState(false);
  const markedSet = new Set(marked);

  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    const p = pop.current;
    if (!b || !p) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = vh - b.bottom - GAP - EDGE;
    const up = p.offsetHeight > below && b.top > below;
    p.style.left = `${Math.max(EDGE, Math.min(b.left, vw - p.offsetWidth - EDGE))}px`;
    p.style.top = up ? `${Math.max(EDGE, b.top - GAP - p.offsetHeight)}px` : `${b.bottom + GAP}px`;
  }, []);

  useEffect(() => {
    if (!open) return;
    // Escape cierra solo el calendario, antes que el diálogo que lo contenga.
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      pop.current?.hidePopover?.();
      btn.current?.focus();
    };
    const onMove = () => place();
    window.addEventListener('keydown', onEscape, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('keydown', onEscape, true);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  // Con el teclado, el foco sigue al día activo aunque cambie de mes.
  useLayoutEffect(() => {
    if (!open || !moveFocus) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-date="${cursor}"]`)?.focus();
    setMoveFocus(false);
  }, [open, moveFocus, cursor]);

  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max);

  const close = () => {
    pop.current?.hidePopover?.();
    btn.current?.focus();
  };
  const pick = (iso: string) => {
    if (!allowed(iso)) return;
    close();
    if (iso !== value) onChange(iso);
  };
  const go = (iso: string) => {
    setCursor(clamp(iso, min, max));
    setMoveFocus(true);
  };

  const onDayKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(cursor, -1),
      ArrowRight: () => addDays(cursor, 1),
      ArrowUp: () => addDays(cursor, -7),
      ArrowDown: () => addDays(cursor, 7),
      Home: () => addDays(cursor, -weekday(cursor)),
      End: () => addDays(cursor, 6 - weekday(cursor)),
      PageUp: () => addMonths(cursor, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(cursor, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    go(move());
  };

  const onSheetKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    // El foco no se escapa de la hoja: Tab recorre mes, días y atajos.
    const focusable = [
      ...(pop.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
    ].filter((el) => el.tabIndex >= 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const first = monthStart(cursor);
  const gridStart = addDays(first, -weekday(first));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  // Sin sexta fila cuando el mes cabe en cinco.
  const weeks = days[35].slice(0, 7) === first.slice(0, 7) ? 6 : 5;
  const prevMonth = addMonths(first, -1);
  const nextMonth = addMonths(first, 1);
  const canPrev = !min || addDays(first, -1) >= min;
  const canNext = !max || nextMonth <= max;
  const yesterday = addDays(today, -1);

  return (
    <>
      <button
        ref={btn}
        id={triggerId}
        type="button"
        name={name}
        className={cn('ui-select ui-date', className)}
        style={style}
        disabled={disabled}
        title={title}
        popoverTarget={sheetId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={sheetId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // Con aria-label el nombre tapa el contenido: la fecha elegida se lee como descripción.
        aria-describedby={cn(ariaDescribedBy, ariaLabel && `${triggerId}-value`) || undefined}
        aria-invalid={ariaInvalid || undefined}
        aria-required={required || undefined}
        data-value={valid}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown') return;
          e.preventDefault();
          pop.current?.showPopover?.();
        }}
      >
        <CalendarDays className="ui-date-icon" size={16} aria-hidden="true" />
        <span
          id={`${triggerId}-value`}
          className={cn('ui-select-value', !valid && 'ui-date-placeholder')}
        >
          {valid ? formatShortDate(valid) : placeholder}
        </span>
      </button>
      {required && (
        // Mantiene la validación del formulario: sin fecha, el envío se para aquí.
        <input
          className="ui-date-proxy"
          tabIndex={-1}
          aria-hidden="true"
          required
          value={valid}
          onChange={() => {}}
          onFocus={() => btn.current?.focus()}
          onInvalid={(e) => e.currentTarget.setCustomValidity(valid ? '' : 'Elige una fecha.')}
        />
      )}
      <div
        ref={pop}
        id={sheetId}
        popover="auto"
        role="dialog"
        aria-labelledby={headingId}
        className="ui-date-sheet"
        onKeyDown={onSheetKey}
        // Elegir un día no es un clic en la fila o tarjeta que contiene el campo, y dentro de un
        // <label> un clic en el hueco de la hoja reabriría el botón: se anula.
        onClick={(e) => {
          e.stopPropagation();
          if (!(e.target as HTMLElement).closest('button')) e.preventDefault();
        }}
        onBeforeToggle={(e) => {
          const b = btn.current?.getBoundingClientRect();
          const p = pop.current;
          if ((e.nativeEvent as ToggleEvent).newState !== 'open' || !b || !p) return;
          p.style.left = `${Math.max(EDGE, b.left)}px`;
          p.style.top = `${b.bottom + GAP}px`;
          setCursor(clamp(valid || today, min, max));
        }}
        onToggle={(e) => {
          const isOpen = (e.nativeEvent as ToggleEvent).newState === 'open';
          setOpen(isOpen);
          if (!isOpen) return;
          place();
          setMoveFocus(true);
        }}
      >
        <div className="ui-date-head">
          <strong id={headingId} aria-live="polite">
            {monthFormat.format(toTime(first)).replace(' de ', ' ')}
          </strong>
          <span className="ui-date-nav">
            <button
              type="button"
              aria-label="Mes anterior"
              disabled={!canPrev}
              onClick={() => setCursor(clamp(prevMonth, min, max))}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              disabled={!canNext}
              onClick={() => setCursor(clamp(nextMonth, min, max))}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </span>
        </div>
        <div ref={grid} role="grid" aria-labelledby={headingId} className="ui-date-grid">
          <div role="row" className="ui-date-row">
            {WEEKDAYS.map(([short, long]) => (
              <span key={long} role="columnheader" aria-label={long} className="ui-date-wd">
                {short}
              </span>
            ))}
          </div>
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} role="row" className="ui-date-row">
              {days.slice(w * 7, w * 7 + 7).map((iso) => {
                const outside = iso.slice(0, 7) !== first.slice(0, 7);
                return (
                  <span key={iso} role="gridcell" aria-selected={iso === valid}>
                    <button
                      type="button"
                      data-date={iso}
                      tabIndex={iso === cursor ? 0 : -1}
                      disabled={!allowed(iso)}
                      aria-label={`${longFormat.format(toTime(iso))}${markedSet.has(iso) ? ', con entreno' : ''}`}
                      aria-current={iso === today ? 'date' : undefined}
                      className="ui-date-day"
                      data-outside={outside || undefined}
                      data-selected={iso === valid || undefined}
                      data-marked={markedSet.has(iso) || undefined}
                      onKeyDown={onDayKey}
                      onFocus={() => iso !== cursor && setCursor(iso)}
                      onClick={() => pick(iso)}
                    >
                      {+iso.slice(8)}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div className="ui-date-foot">
          <span className="ui-date-quick">
            {allowed(today) && (
              <button type="button" onClick={() => pick(today)}>
                Hoy
              </button>
            )}
            {allowed(yesterday) && (
              <button type="button" onClick={() => pick(yesterday)}>
                Ayer
              </button>
            )}
            {valid && !required && (
              <button
                type="button"
                onClick={() => {
                  close();
                  onChange('');
                }}
              >
                Borrar
              </button>
            )}
          </span>
          {marked && marked.length > 0 && (
            <small className="ui-date-legend">
              <i aria-hidden="true" />
              Día con entreno
            </small>
          )}
        </div>
      </div>
    </>
  );
}
