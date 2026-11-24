import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';
import { DAY_NAMES, formatBodyKg, getMondayStr } from '../../utils/trackingHelpers';
import type { DayData, WeekData } from '../../types/tracking';
import '../../styles/athlete-workout.css';
import '../../styles/athlete-overview.css';

export type TrackingMetric = 'weight' | 'steps' | 'calories';
type OpenDay = (d: { dateStr: string; dayName: string; dayData: DayData }) => void;

interface Props {
  weeks: WeekData[];
  /** Metrics shown, in display order. Never empty. */
  metrics: TrackingMetric[];
  onOpenDay: OpenDay;
}

const UNIT: Record<TrackingMetric, string> = { weight: 'kg', steps: 'pasos', calories: 'kcal' };
const LABEL: Record<TrackingMetric, string> = {
  weight: 'Peso medio',
  steps: 'Pasos al día',
  calories: 'Kcal al día',
};
const LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const count = (n: number) => Math.round(n).toLocaleString('es-ES');
const show = (m: TrackingMetric, v: number | null | undefined) =>
  v == null ? '—' : m === 'weight' ? formatBodyKg(v) : count(v);
/** Steps and calories shortened to fit a day column: 8.432 → 8,4k. */
const compact = (m: TrackingMetric, v: number) =>
  m === 'weight'
    ? formatBodyKg(v)
    : v >= 1000
      ? `${(v / 1000).toFixed(1).replace('.', ',')}k`
      : `${v}`;
const average = (m: TrackingMetric, w: WeekData) =>
  m === 'weight' ? w.averageWeight : m === 'steps' ? w.averageSteps : w.averageCalories;
const delta = (m: TrackingMetric, w: WeekData) =>
  m === 'weight' ? w.deltaWeight : m === 'steps' ? w.deltaSteps : w.deltaCalories;
const signed = (m: TrackingMetric, n: number) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${m === 'weight' ? Math.abs(n).toFixed(2) : count(Math.abs(n))}`;

/** The seven days of a week as tappable cells, one line per metric shown. */
function DayCells({ week, metrics, onOpenDay }: { week: WeekData } & Omit<Props, 'weeks'>) {
  const monday = new Date(week.weekStart + 'T00:00:00');
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    <div className="tv-days">
      {week.days.map((day, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isFuture = dateStr > today;
        const empty = metrics.every((m) => day[m] === null);
        const spoken = metrics
          .map((m) => (day[m] === null ? null : `${show(m, day[m])} ${UNIT[m]}`))
          .filter(Boolean)
          .join(', ');
        return (
          <button
            key={dateStr}
            type="button"
            className="tv-day"
            disabled={isFuture}
            data-today={dateStr === today || undefined}
            data-empty={empty || undefined}
            aria-label={`${format(date, "EEEE d 'de' MMMM", { locale: es })}: ${spoken || 'sin dato'}`}
            onClick={() => onOpenDay({ dateStr, dayName: DAY_NAMES[i], dayData: day })}
          >
            <span className="tv-day-name">
              {LETTERS[i]} {format(date, 'd')}
            </span>
            {isFuture ? (
              <span className="tv-day-value" />
            ) : empty ? (
              <span className="tv-day-value">+</span>
            ) : (
              metrics.map((m) => {
                const value = day[m];
                return (
                  <span key={m} className="tv-day-value tabular-nums" data-metric={m}>
                    {value === null ? '·' : compact(m, value)}
                  </span>
                );
              })
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Weekly averages one under another. The current week always shows its days; any other week
 * opens on tap.
 */
export function TrackingLadder({ weeks, metrics, onOpenDay }: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const currentMonday = getMondayStr();
  const ordered = [...weeks].reverse();
  const [lead, ...rest] = metrics;
  const single = metrics.length === 1;

  const averages = weeks.map((w) => average(lead, w)).filter((v) => v !== null);
  const max = Math.max(...averages, 1);
  const min = lead === 'weight' && averages.length ? Math.min(...averages) - 1.5 : 0;
  const latest = ordered.find((w) => average(lead, w) !== null);
  const first = weeks.find((w) => average(lead, w) !== null);
  const span =
    latest && first && latest !== first
      ? (average(lead, latest) as number) - (average(lead, first) as number)
      : null;
  const thisWeek = ordered.find((w) => w.weekStart === currentMonday) ?? latest;

  const toggle = (weekStart: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(weekStart)) next.add(weekStart);
      return next;
    });

  return (
    <section className="card wk-hero hv-stack" aria-label="Medias semanales">
      <div className="wk-hero-week">
        <h2 className="wk-eyebrow">
          {latest?.weekStart === currentMonday ? 'Media de esta semana' : 'Última media semanal'}
        </h2>
        <p className="wk-count">
          {show(lead, latest ? average(lead, latest) : null)}
          <span>{UNIT[lead]}</span>
        </p>
        {span !== null && (
          <p className="wk-compare tabular-nums">
            {signed(lead, span)} {UNIT[lead]} en {weeks.length} semanas
          </p>
        )}
      </div>
      {rest.length > 0 && thisWeek && (
        <dl className="wk-stats" data-cols={rest.length}>
          {rest.map((m) => (
            <div key={m}>
              <dt>{LABEL[m]}</dt>
              <dd className="tabular-nums">{show(m, average(m, thisWeek))}</dd>
            </div>
          ))}
        </dl>
      )}
      <ul className="tv-ladder" data-metrics={metrics.length}>
        {ordered.map((week) => {
          const monday = new Date(week.weekStart + 'T00:00:00');
          const current = week.weekStart === currentMonday;
          const expanded = current || open.has(week.weekStart);
          const leadAvg = average(lead, week);
          const row = (
            <>
              <span className="tv-step-when">
                {current ? 'Esta' : format(monday, 'd MMM', { locale: es })}
              </span>
              {single && (
                <span className="tv-step-track" aria-hidden="true">
                  <span
                    style={{
                      width: leadAvg === null ? 0 : `${((leadAvg - min) / (max - min)) * 100}%`,
                    }}
                  />
                </span>
              )}
              {metrics.map((m) => {
                const d = delta(m, week);
                return (
                  <span key={m} className="tv-step-figs tabular-nums">
                    <strong>
                      {show(m, average(m, week))}
                      {!single && <em>{UNIT[m]}</em>}
                    </strong>
                    <small>{d !== null && d !== undefined ? signed(m, d) : ' '}</small>
                  </span>
                );
              })}
            </>
          );
          return (
            <li key={week.weekStart} data-current={current || undefined}>
              {current ? (
                <div className="tv-step">{row}</div>
              ) : (
                <button
                  type="button"
                  className="tv-step"
                  aria-expanded={expanded}
                  onClick={() => toggle(week.weekStart)}
                >
                  {row}
                  <ChevronDown size={16} aria-hidden="true" className="tv-step-chevron" />
                </button>
              )}
              {expanded && <DayCells week={week} metrics={metrics} onOpenDay={onOpenDay} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
