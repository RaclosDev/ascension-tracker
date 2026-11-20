import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CoachClient } from '@/lib/coach/api';
import { useAthleteCalendar, type CalendarDay } from '@/lib/coach/calendar';
import { shiftWeek, weekDate } from '@/lib/coach/weeks';
import { DayFacts } from './calendar/DayFacts';
import { longDate, weekRange } from './calendar/AthleteCalendar';
import { WeekStrip } from './calendar/WeekStrip';
import '../../styles/coach-calendar.css';

const decimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('es-ES');

/** What a day says in the strip: whether it trained, then weight, steps and calories. */
const logged = (day: CalendarDay) => {
  const trained = day.workouts.length > 0;
  const records = [
    day.weight != null && `${decimal.format(day.weight)} kg`,
    day.steps != null && `${whole.format(day.steps)} pasos`,
    day.intake && `${whole.format(Math.round(day.intake.kcal))} kcal`,
  ].filter(Boolean);
  return {
    title: trained
      ? day.workouts[0].name || 'Entreno'
      : day.session && day.past
        ? 'Sin registrar'
        : day.session
          ? day.session.name || 'Sesión'
          : 'Descanso',
    detail: records.join(' · ') || (day.past || day.today ? 'Sin registros' : undefined),
    muted: !trained && records.length === 0,
  };
};

/** The athlete's week as Planificación shows it, but with what they logged: pick a day to read it whole. */
export function ProgressWeek({ link, registerHref }: { link: CoachClient; registerHref: string }) {
  const current = weekDate();
  const [week, setWeek] = useState(current);
  const [picked, setPicked] = useState<{ week: string; day: number } | null>(null);
  const calendar = useAthleteCalendar(link, week, 1).weeks[0];
  const today = calendar.days.find((day) => day.today)?.dayIndex ?? 1;
  const dayIndex = picked?.week === week ? picked.day : today;
  const day = calendar.days[dayIndex - 1];
  return (
    <section className="athlete-week progress-week" aria-label="Semana registrada">
      <div className="athlete-section-title">
        <div className="progress-week-nav">
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Semana anterior"
            onClick={() => setWeek(shiftWeek(week, -1))}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <h2>{week === current ? 'Esta semana' : `Semana del ${weekRange(week)}`}</h2>
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Semana siguiente"
            disabled={week >= current}
            onClick={() => setWeek(shiftWeek(week, 1))}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <Link className="btn btn-secondary" to={registerHref}>
          Abrir resumen diario <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>
      <div className="cal-body" data-panel="wide">
        <WeekStrip
          week={calendar}
          selected={dayIndex}
          onSelect={(index) => setPicked({ week, day: index })}
          fact={logged}
        />
        <div className="cal-panel">
          <div className="card week-panel">
            <header className="week-panel-head">
              <h2 className="week-review-title">{longDate(day.date)}</h2>
            </header>
            <div className="week-panel-body">
              <DayFacts day={day} link={link} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
