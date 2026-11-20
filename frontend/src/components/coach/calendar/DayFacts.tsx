import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Dumbbell, Footprints, MessageSquareText, Scale, Utensils } from 'lucide-react';
import type { CoachClient } from '@/lib/coach/api';
import type { CalendarDay } from '@/lib/coach/calendar';
import { SCORE_KEYS, SCORE_LABELS, needsReply } from '@/lib/coach/checkins';
import { useAthleteLinks } from '../AthleteShell';

const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const grams = (value: number) => `${number.format(Math.round(value))} g`;

/** What surrounds the session that day: what the athlete logged, the food target and the body records. */
export function DayFacts({ day, link }: { day: CalendarDay; link: CoachClient }) {
  const { sectionHref, recordHref } = useAthleteLinks(link.linkId);
  const { training, nutrition, body } = link.permissions;
  const upcoming = !day.past && !day.today;
  const noted = day.workouts.filter((workout) => workout.notes?.trim());
  const checkin = day.checkin;
  return (
    <div className="day-facts">
      {(checkin || day.updates.length > 0 || noted.length > 0 || day.comment) && (
        <section className="day-fact">
          <h4>
            <MessageSquareText size={15} aria-hidden /> Seguimiento y notas
          </h4>
          {checkin && (
            <div className="day-note">
              <strong>
                Envió el seguimiento de la semana
                {needsReply(checkin) ? ' · por responder' : ''}
              </strong>
              <span className="day-note-scores">
                {SCORE_KEYS.filter((key) => checkin[key] != null)
                  .map((key) => `${SCORE_LABELS[key]} ${checkin[key]}/5`)
                  .join(' · ')}
              </span>
              {checkin.notes && <q>{checkin.notes}</q>}
            </div>
          )}
          {day.updates.map((update, i) => (
            <div key={i} className="day-note">
              <strong>Añadió a su seguimiento</strong>
              <q>{update}</q>
            </div>
          ))}
          {noted.map((workout) => (
            <div key={workout.id} className="day-note">
              <strong>Nota en «{workout.name || 'Entreno'}»</strong>
              <q>{workout.notes}</q>
            </div>
          ))}
          {day.comment && (
            <div className="day-note" data-coach="">
              <strong>Tu comentario del día</strong>
              <q>{day.comment}</q>
            </div>
          )}
          <p className="day-fact-links">
            <Link to={sectionHref('revisiones')}>
              {checkin && needsReply(checkin) ? 'Responder el seguimiento' : 'Abrir seguimientos'}
            </Link>
          </p>
        </section>
      )}
      {training && !upcoming && (
        <section className="day-fact">
          <h4>
            <Dumbbell size={15} aria-hidden /> Entreno registrado
          </h4>
          {day.workouts.length ? (
            <ul>
              {day.workouts.map((workout) => (
                <li key={workout.id}>
                  <Link to={recordHref(`entrenos/${encodeURIComponent(workout.id)}`)}>
                    {workout.name || 'Entreno'}
                  </Link>
                  <small>
                    {format(new Date(workout.startedAt), 'HH:mm')} · {workout.exercises.length}{' '}
                    {workout.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {day.session
                ? day.today
                  ? 'Aún no ha registrado la sesión de hoy.'
                  : 'No registró la sesión pautada.'
                : 'Sin entreno registrado.'}
            </p>
          )}
        </section>
      )}
      {nutrition && (
        <section className="day-fact">
          <h4>
            <Utensils size={15} aria-hidden /> Nutrición
          </h4>
          {day.target && day.intake ? (
            <dl className="day-macros">
              {(
                [
                  ['kcal', 'Calorías', (v: number) => number.format(Math.round(v))],
                  ['protein', 'Proteína', grams],
                  ['carbs', 'Hidratos', grams],
                  ['fat', 'Grasas', grams],
                ] as const
              ).map(([key, label, show]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>
                    {show(day.intake![key])}
                    <small>/ {show(day.target![key])}</small>
                  </dd>
                </div>
              ))}
            </dl>
          ) : day.target ? (
            <p>
              {upcoming ? '' : 'Sin comidas registradas. '}Objetivo:{' '}
              {number.format(Math.round(day.target.kcal))} kcal · {grams(day.target.protein)} P ·{' '}
              {grams(day.target.carbs)} H · {grams(day.target.fat)} G
            </p>
          ) : day.intake ? (
            <p>{number.format(Math.round(day.intake.kcal))} kcal registradas, sin pauta ese día.</p>
          ) : (
            <p>{upcoming ? 'Sin pauta de nutrición.' : 'Sin comidas registradas.'}</p>
          )}
          <p className="day-fact-links">
            <Link to={sectionHref('nutricion')}>
              {day.target ? 'Cambiar la pauta' : 'Pautar nutrición'}
            </Link>
            {!upcoming && <Link to={recordHref(`comidas/${day.date}`)}>Ver comidas del día</Link>}
          </p>
          {upcoming && day.target && (
            <small className="day-fact-note">
              Objetivo de un día de {day.session ? 'entrenamiento' : 'descanso'} según su pauta.
            </small>
          )}
        </section>
      )}
      {body && !upcoming && (
        <section className="day-fact">
          <h4>
            <Scale size={15} aria-hidden /> Registros
          </h4>
          <p className="day-records">
            <span>
              <Scale size={14} aria-hidden />
              {day.weight != null ? `${number.format(day.weight)} kg` : 'Sin peso'}
            </span>
            <span>
              <Footprints size={14} aria-hidden />
              {day.steps != null
                ? `${new Intl.NumberFormat('es-ES').format(day.steps)} pasos`
                : 'Sin pasos'}
            </span>
          </p>
          <p className="day-fact-links">
            <Link to={recordHref('registro')}>Ver su registro</Link>
          </p>
        </section>
      )}
    </div>
  );
}
