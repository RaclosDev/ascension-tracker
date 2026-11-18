import type { DragEvent } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Dumbbell, Footprints, Scale, Utensils } from 'lucide-react';
import { WEEK_STATE } from '@/lib/coach/blocks';
import type { CalendarDay, CalendarWeek } from '@/lib/coach/calendar';
import { WEEKDAY_LABELS } from '@/lib/coach/coachPrograms';
import '../../../styles/coach-calendar.css';

export interface DropProps {
  'data-drop'?: string;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const thousands = (value: number) =>
  value >= 1000 ? `${number.format(Math.round(value / 100) / 10)} k` : String(value);
const sets = (day: CalendarDay) =>
  day.session?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;
export const longDate = (date: string) =>
  format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });
const weekRange = (weekStart: string) => {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  return start.getMonth() === end.getMonth()
    ? `${format(start, 'd')}–${format(end, 'd MMM', { locale: es })}`
    : `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM', { locale: es })}`;
};

/** What a screen reader hears for the day, since the cell itself is all abbreviations. */
function summary(day: CalendarDay) {
  const parts = [longDate(day.date)];
  if (day.session)
    parts.push(
      `${day.session.name || 'Sesión'}, ${day.session.exercises.length} ${day.session.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}`,
    );
  else parts.push('sin sesión');
  if (day.workouts.length) parts.push('entreno registrado');
  if (day.intake) parts.push(`${Math.round(day.intake.kcal)} kcal registradas`);
  return parts.join(', ');
}

/** Several weeks at a glance. Each day opens beside the calendar to plan or review it. */
export function AthleteCalendar({
  weeks,
  focus,
  selected,
  loading,
  onSelect,
  drop,
  dragType,
  editable,
}: {
  weeks: CalendarWeek[];
  /** The week whose plan is open for editing. */
  focus: string;
  /** Day of the focused week shown in the side panel. */
  selected: number | null;
  loading?: boolean;
  onSelect: (weekStart: string, dayIndex: number | null) => void;
  /** Drop handlers for the days of the focused week. */
  drop?: (dayIndex: number) => DropProps;
  dragType?: string;
  /** The focused week accepts changes: its sessions can be dragged to another day. */
  editable?: boolean;
}) {
  return (
    <div className="cal" role="group" aria-label="Calendario del atleta" aria-busy={loading}>
      <div className="cal-head" aria-hidden>
        <span />
        {WEEKDAY_LABELS.map((weekday) => (
          <span key={weekday}>{weekday.slice(0, 3)}</span>
        ))}
      </div>
      {weeks.map((week) => {
        const focused = week.weekStart === focus;
        return (
          <section
            key={week.weekStart}
            className="cal-week"
            data-focus={focused ? '' : undefined}
            aria-label={`Semana del ${weekRange(week.weekStart)}`}
          >
            <button
              type="button"
              className="cal-week-head"
              aria-pressed={focused}
              title="Abrir esta semana"
              onClick={() => onSelect(week.weekStart, null)}
            >
              <strong>{weekRange(week.weekStart)}</strong>
              {week.state ? (
                <span className="cal-state" data-state={week.state}>
                  {WEEK_STATE[week.state]}
                </span>
              ) : (
                !week.days[6].past && (
                  <span className="cal-state" data-state="empty">
                    Sin preparar
                  </span>
                )
              )}
            </button>
            {week.days.map((day) => {
              const active = focused && selected === day.dayIndex;
              const done = day.workouts.length > 0;
              const missed = !!day.session && day.past && !done;
              const movable = focused && editable && !!day.session && !!dragType;
              return (
                <div
                  key={day.date}
                  className="cal-cell"
                  data-today={day.today ? '' : undefined}
                  data-past={day.past ? '' : undefined}
                  data-selected={active ? '' : undefined}
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
                  {...(focused && drop ? drop(day.dayIndex) : {})}
                >
                  <button
                    type="button"
                    className="cal-day"
                    aria-label={summary(day)}
                    aria-pressed={active}
                    onClick={() => onSelect(week.weekStart, day.dayIndex)}
                  >
                    <span className="cal-date">
                      <span className="cal-date-weekday">
                        {WEEKDAY_LABELS[day.dayIndex - 1].slice(0, 3)}
                      </span>
                      <span className="cal-date-number">{format(parseISO(day.date), 'd')}</span>
                      {(day.dayIndex === 1 || day.date.endsWith('-01')) && (
                        <span className="cal-date-month">
                          {format(parseISO(day.date), 'MMM', { locale: es })}
                        </span>
                      )}
                    </span>
                    <span className="cal-items">
                      {day.session ? (
                        <span
                          className="cal-session"
                          data-state={done ? 'done' : missed ? 'missed' : 'planned'}
                        >
                          <span className="cal-session-name">
                            {done ? (
                              <Check size={12} aria-hidden />
                            ) : (
                              <Dumbbell size={12} aria-hidden />
                            )}
                            {day.session.name || 'Sesión'}
                          </span>
                          <small>
                            {day.session.exercises.length} ej · {sets(day)} series
                            {missed ? ' · sin registrar' : ''}
                          </small>
                        </span>
                      ) : (
                        done && (
                          <span className="cal-session" data-state="free">
                            <span className="cal-session-name">
                              <Check size={12} aria-hidden />
                              {day.workouts[0].name || 'Entreno'}
                            </span>
                            <small>Entreno fuera del plan</small>
                          </span>
                        )
                      )}
                      {(day.intake || (day.target && day.past)) && (
                        <span
                          className="cal-fact"
                          data-ok={day.intake && day.onTarget ? '' : undefined}
                        >
                          <Utensils size={12} aria-hidden />
                          {day.intake ? (
                            <>
                              {number.format(Math.round(day.intake.kcal))}
                              {day.target && <small>/ {number.format(day.target.kcal)}</small>}
                            </>
                          ) : (
                            <small>sin comidas</small>
                          )}
                        </span>
                      )}
                      {day.weight != null && (
                        <span className="cal-fact">
                          <Scale size={12} aria-hidden />
                          {number.format(day.weight)} kg
                        </span>
                      )}
                      {day.steps != null && (
                        <span className="cal-fact">
                          <Footprints size={12} aria-hidden />
                          {thousands(day.steps)}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
