import { format, parseISO } from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';
import type { CalendarWeek } from '@/lib/coach/calendar';
import { WEEKDAY_LABELS } from '@/lib/coach/coachPrograms';
import { daySummary, weekRange, type DropProps } from './AthleteCalendar';

/** The open week folded to a column of days, so the session being written gets the room. */
export function WeekStrip({
  week,
  selected,
  onSelect,
  onClose,
  drop,
  dragType,
  editable,
}: {
  week: CalendarWeek;
  selected: number;
  onSelect: (dayIndex: number) => void;
  /** Back to the whole calendar. */
  onClose: () => void;
  drop: (dayIndex: number) => DropProps;
  dragType: string;
  editable: boolean;
}) {
  return (
    <nav className="cal-strip" aria-label={`Días de la semana del ${weekRange(week.weekStart)}`}>
      <button type="button" className="cal-strip-back" onClick={onClose}>
        <CalendarDays size={15} aria-hidden /> Ver calendario
      </button>
      <ol>
        {week.days.map((day) => {
          const count = day.session?.exercises.length ?? 0;
          const movable = editable && !!day.session;
          return (
            <li
              key={day.date}
              className="cal-strip-day"
              data-selected={selected === day.dayIndex ? '' : undefined}
              data-today={day.today ? '' : undefined}
              draggable={movable || undefined}
              onDragStart={
                movable
                  ? (e) => {
                      e.dataTransfer.setData(
                        dragType,
                        JSON.stringify({ kind: 'move', dayIndex: day.dayIndex }),
                      );
                      e.dataTransfer.effectAllowed = 'copyMove';
                    }
                  : undefined
              }
              {...drop(day.dayIndex)}
            >
              <button
                type="button"
                aria-label={daySummary(day)}
                aria-current={selected === day.dayIndex ? 'true' : undefined}
                onClick={() => onSelect(day.dayIndex)}
              >
                <span className="cal-strip-date">
                  {WEEKDAY_LABELS[day.dayIndex - 1].slice(0, 3)}
                  <b>{format(parseISO(day.date), 'd')}</b>
                </span>
                <span className="cal-strip-plan" data-rest={day.session ? undefined : ''}>
                  <strong>{day.session ? day.session.name || 'Sesión' : 'Descanso'}</strong>
                  {day.session && (
                    <small>
                      {count} {count === 1 ? 'ejercicio' : 'ejercicios'}
                    </small>
                  )}
                </span>
                {day.workouts.length > 0 && (
                  <Check className="cal-strip-done" size={14} aria-label="Entreno registrado" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
