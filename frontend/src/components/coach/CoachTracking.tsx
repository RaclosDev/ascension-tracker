import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientData } from '../../lib/coach/api';
import type { WeekSummary } from '../../types/api';
import type { WeeklyMetricResponse } from '../../types/tracking';
import { DAY_NAMES, getMondayStr, mergeWeeksData } from '../../utils/trackingHelpers';
import { TrackingWeeklyStats } from '../tracking/TrackingWeeklyStats';
import { QueryState } from './ClientSection';

const PAGE = 6;
const asMetric = (weeks?: WeekSummary[]) => (weeks ?? []) as unknown as WeeklyMetricResponse[];

function Cell({ value, unit }: { value: string | null; unit: string }) {
  return (
    <div className="coach-tracking-cell">
      {value == null ? (
        <span aria-hidden="true">-</span>
      ) : (
        <>
          {value}
          <small> {unit}</small>
        </>
      )}
    </div>
  );
}

/** The athlete's own weekly tracking, read-only: a card per week with weight, steps and calories per day. */
export function CoachTracking({
  linkId,
  weights,
  steps,
  calories,
  weekHref,
}: {
  linkId: string;
  /** Which metrics the coach can read and has chosen to show. */
  weights: boolean;
  steps: boolean;
  calories: boolean;
  weekHref: (week: string) => string;
}) {
  const w = useClientData<WeekSummary[]>(linkId, 'weights/weekly', weights);
  const s = useClientData<WeekSummary[]>(linkId, 'steps/weekly', steps);
  const k = useClientData<WeekSummary[]>(linkId, 'nutrition/calories/weekly', calories);
  const [shown, setShown] = useState(PAGE);
  const weeks = useMemo(
    () =>
      mergeWeeksData(
        weights ? asMetric(w.data) : [],
        steps ? asMetric(s.data) : [],
        calories ? asMetric(k.data) : [],
      ).reverse(),
    [w.data, s.data, k.data, weights, steps, calories],
  );
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonday = getMondayStr();
  const loading = (weights && w.isLoading) || (steps && s.isLoading) || (calories && k.isLoading);
  const failed = (weights && w.isError) || (steps && s.isError) || (calories && k.isError);

  return (
    <div className="calendar-container coach-tracking">
      <QueryState isLoading={loading} isError={failed} />
      {weeks.slice(0, shown).map((week) => (
        <section
          key={week.weekStart}
          className="calendar-week"
          aria-label={`Semana del ${week.weekStart}`}
        >
          <div className="calendar-week-header">
            <Link className="calendar-week-title" to={weekHref(week.weekStart)}>
              {format(new Date(week.weekStart + 'T00:00:00'), 'd MMM', { locale: es })}
              {week.weekStart === currentMonday && (
                <span className="current-week-label"> ACTUAL</span>
              )}
            </Link>
            <TrackingWeeklyStats
              week={week}
              showWeight={weights}
              showSteps={steps}
              showCalories={calories}
            />
          </div>
          <div className="calendar-grid">
            {week.days.map((day, i) => {
              const date = new Date(week.weekStart + 'T00:00:00');
              date.setDate(date.getDate() + i);
              const dateStr = format(date, 'yyyy-MM-dd');
              return (
                <div
                  key={dateStr}
                  className={`calendar-day ${dateStr === today ? 'is-today' : ''} ${dateStr > today ? 'is-future' : ''}`}
                >
                  <div className="calendar-day-name">{DAY_NAMES[i]}</div>
                  <div className="calendar-day-date">{format(date, 'd MMM', { locale: es })}</div>
                  <div className="coach-tracking-cells">
                    {weights && (
                      <Cell value={day.weight == null ? null : day.weight.toFixed(2)} unit="kg" />
                    )}
                    {steps && (
                      <Cell
                        value={day.steps == null ? null : String(Math.round(day.steps))}
                        unit="pas"
                      />
                    )}
                    {calories && (
                      <Cell
                        value={day.calories == null ? null : String(Math.round(day.calories))}
                        unit="kcal"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {!loading && !failed && weeks.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>Sin registros todavía.</p>
      )}
      {weeks.length > shown && (
        <button type="button" className="btn btn-secondary" onClick={() => setShown(shown + PAGE)}>
          Ver semanas anteriores
        </button>
      )}
    </div>
  );
}
