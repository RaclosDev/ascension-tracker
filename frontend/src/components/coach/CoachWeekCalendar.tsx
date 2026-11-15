import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { shiftWeek } from '../../lib/coach/weeks';
import { addDaysToDateString, getLocalDateString } from '../../utils/dateHelper';
import '../../styles/coach-quick-view.css';

export function CoachWeekNavigation({
  week,
  currentWeek,
  changeWeek,
  label,
}: {
  week: string;
  currentWeek: string;
  changeWeek: (week: string) => void;
  label: string;
}) {
  const monday = parseISO(week);
  return (
    <nav className="coach-weekly-workouts-nav" aria-label={label}>
      <div className="coach-workout-week-picker">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => changeWeek(shiftWeek(week, -1))}
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <div className="coach-workout-week-range" aria-live="polite">
          {format(monday, 'd MMM', { locale: es })} –{' '}
          {format(addDays(monday, 6), 'd MMM yyyy', { locale: es })}
        </div>
        <button
          type="button"
          aria-label="Semana siguiente"
          disabled={week === currentWeek}
          onClick={() => changeWeek(shiftWeek(week, 1))}
        >
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      {week !== currentWeek && (
        <button type="button" className="btn btn-secondary" onClick={() => changeWeek(currentWeek)}>
          Volver a esta semana
        </button>
      )}
    </nav>
  );
}

export function CoachWeekGrid({
  week,
  renderDay,
}: {
  week: string;
  renderDay: (date: string, index: number) => ReactNode;
}) {
  const today = getLocalDateString();
  return (
    <ol className="coach-workout-calendar">
      {Array.from({ length: 7 }, (_, index) => {
        const date = addDaysToDateString(week, index);
        return (
          <li key={date} className="coach-workout-calendar-day">
            <h2>
              <time dateTime={date}>{format(parseISO(date), 'EEEE d', { locale: es })}</time>
              {date === today && <span>Hoy</span>}
            </h2>
            {renderDay(date, index) ?? (
              <p className="coach-workout-calendar-empty">Sin registros</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
