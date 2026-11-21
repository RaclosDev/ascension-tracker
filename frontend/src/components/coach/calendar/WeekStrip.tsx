import type { ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Check } from 'lucide-react';
import type { CalendarDay, CalendarWeek } from '@/lib/coach/calendar';
import { WEEKDAY_LABELS } from '@/lib/coach/coachPrograms';
import { daySummary, weekRange, type DropProps } from './AthleteCalendar';

/** The open week folded to a column of days, so what is open beside it gets the room. */
export function WeekStrip({
  week,
  selected,
  onSelect,
  onClose,
  drop,
  dragType = '',
  editable = false,
  whole,
  fact,
}: {
  week: CalendarWeek;
  /** The open day, or none while the whole week is open. */
  selected: number | null;
  onSelect: (dayIndex: number) => void;
  /** Back to the whole calendar. */
  onClose?: () => void;
  drop?: (dayIndex: number) => DropProps;
  dragType?: string;
  editable?: boolean;
  /** Opens the week as a whole, where the screen has something to say about all of it. */
  whole?: { label: string; onSelect: () => void };
  /** What a day says under its date, where it is not the planned session. */
  fact?: (day: CalendarDay) => { title: string; detail?: ReactNode; muted?: boolean };
}) {
  return (
    <nav className="cal-strip" aria-label={`Días de la semana del ${weekRange(week.weekStart)}`}>
      {onClose && (
        <button type="button" className="cal-strip-back" onClick={onClose}>
          <CalendarDays size={15} aria-hidden /> Ver calendario
        </button>
      )}
      {whole && (
        <button
          type="button"
          className="cal-strip-whole"
          aria-current={selected === null ? 'true' : undefined}
          onClick={whole.onSelect}
        >
          {whole.label}
        </button>
      )}
      <ol>
        {week.days.map((day) => {
          const count = day.session?.exercises.length ?? 0;
          const movable = editable && !!day.session;
          const shown = fact?.(day) ?? {
            title: day.session ? day.session.name || 'Sesión' : 'Descanso',
            detail: day.session && `${count} ${count === 1 ? 'ejercicio' : 'ejercicios'}`,
            muted: !day.session,
          };
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
              {...drop?.(day.dayIndex)}
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
                <span className="cal-strip-plan" data-rest={shown.muted ? '' : undefined}>
                  <strong>{shown.title}</strong>
                  {shown.detail && <small>{shown.detail}</small>}
                </span>
                {!fact && day.workouts.length > 0 && (
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
