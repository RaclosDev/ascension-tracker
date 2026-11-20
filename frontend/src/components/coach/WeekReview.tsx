import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { formatCoachDate, useClientCustomExercises, type CoachClient } from '@/lib/coach/api';
import { useAthleteCalendar, type CalendarDay } from '@/lib/coach/calendar';
import { useClientCheckins, SCORE_LABELS, SCORE_KEYS } from '@/lib/coach/checkins';
import { useExerciseCatalog, getExerciseMap } from '@/lib/workout/exercises';
import { overlapsWeek } from '@/lib/coach/weeks';
import type { ProgramAssignment } from '@/lib/coach/coachPrograms';
import { DayFacts } from './calendar/DayFacts';
import { dayNotes, longDate, weekRange } from './calendar/AthleteCalendar';
import { WeekStrip } from './calendar/WeekStrip';
import { ProgramSessions } from './ProgramSessions';
import '../../styles/coach-calendar.css';

/** What a day of a reviewed week says in the column: what was planned and whether it was trained. */
const reviewed = (day: CalendarDay) => {
  const done = day.workouts.length > 0;
  const noted = day.checkin ? 'seguimiento' : dayNotes(day) ? 'con notas' : '';
  const state = done ? 'Registrado' : day.session && day.past ? 'Sin registrar' : '';
  return {
    title: day.session ? day.session.name || 'Sesión' : done ? day.workouts[0].name : 'Descanso',
    detail: [state, noted].filter(Boolean).join(' · ') || undefined,
    muted: !day.session && !done,
  };
};

/** A past week read the way it was planned: the days in a column, and beside them the week or the open day. */
export function WeekReview({
  link,
  week,
  assignments,
}: {
  link: CoachClient;
  week: string;
  assignments: ProgramAssignment[];
}) {
  const linkId = link.linkId;
  const [picked, setPicked] = useState<{ week: string; day: number } | null>(null);
  const calendar = useAthleteCalendar(link, week, 1).weeks[0];
  const checkins = useClientCheckins(linkId);
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exercises = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const exerciseName = (id: string) => exercises.get(id)?.name ?? 'Ejercicio';
  const relevant = assignments.filter((a) => overlapsWeek(a, week));
  const current = relevant.filter((a) => a.status !== 'ENDED');
  const previous = current.length ? relevant.filter((a) => a.status === 'ENDED') : [];
  const visible = current.length ? current : relevant;
  const checkin = checkins.data?.find((c) => c.weekStart === week);
  // The day belongs to the week it was picked in: moving to another week opens that week whole.
  const day = picked?.week === week ? calendar.days[picked.day - 1] : null;
  return (
    <section data-tour="week-review" className="cal-body" data-panel="wide">
      <WeekStrip
        week={calendar}
        selected={day?.dayIndex ?? null}
        onSelect={(dayIndex) => setPicked({ week, day: dayIndex })}
        whole={{ label: 'Semana completa', onSelect: () => setPicked(null) }}
        fact={reviewed}
      />
      <div className="cal-panel">
        <div className="card week-panel">
          <header className="week-panel-head">
            <h2 className="week-review-title">
              {day ? longDate(day.date) : `Semana del ${weekRange(week)}`}
            </h2>
          </header>
          {day ? (
            <div className="week-panel-body cal-day-body" data-wide="">
              <div className="cal-day-main">
                <h3 className="week-review-label">Pautado y registrado</h3>
                {visible.length === 0 && (
                  <p className="week-panel-hint">No hay programa para esta semana.</p>
                )}
                {visible.map((a) => (
                  <ProgramSessions
                    key={a.id}
                    linkId={linkId}
                    assignmentId={a.id}
                    weekStart={week}
                    date={day.date}
                    exerciseName={exerciseName}
                  />
                ))}
              </div>
              <DayFacts day={day} link={link} />
            </div>
          ) : (
            <div className="week-panel-body cal-day-body" data-wide="">
              <div className="cal-day-main">
                <h3 className="week-review-label">Pautado y registrado</h3>
                {relevant.length === 0 && (
                  <p className="week-panel-hint">No hay programa para esta semana.</p>
                )}
                {visible.map((a) => (
                  <div key={a.id}>
                    <h4>{a.programName}</h4>
                    <ProgramSessions
                      linkId={linkId}
                      assignmentId={a.id}
                      weekStart={week}
                      exerciseName={exerciseName}
                    />
                  </div>
                ))}
                {previous.length > 0 && (
                  <details className="border-t pt-3">
                    <summary className="cursor-pointer min-h-11">
                      Programas anteriores de esta semana ({previous.length})
                    </summary>
                    <div className="flex flex-col gap-4 pt-3">
                      {previous.map((a) => (
                        <div key={a.id}>
                          <h4>{a.programName}</h4>
                          <ProgramSessions
                            linkId={linkId}
                            assignmentId={a.id}
                            weekStart={week}
                            exerciseName={exerciseName}
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                <p className="day-fact-links">
                  <Link to={`/entrenador/atletas/${linkId}?seccion=entrenamiento`}>
                    Abrir historial completo y entrenos libres
                  </Link>
                </p>
              </div>
              <aside className="week-review-feedback">
                <h3 className="week-review-label">Feedback del atleta</h3>
                {checkins.isPending && <p role="status">Cargando feedback…</p>}
                {checkins.isError && (
                  <p role="alert">
                    No se pudo cargar el feedback.{' '}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => void checkins.refetch()}
                    >
                      Reintentar
                    </button>
                  </p>
                )}
                {checkin ? (
                  <>
                    <dl className="coach-review-scores">
                      {SCORE_KEYS.filter((k) => checkin[k] != null).map((k) => (
                        <div key={k}>
                          <dt>{SCORE_LABELS[k]}</dt>
                          <dd>{checkin[k]}/5</dd>
                        </div>
                      ))}
                    </dl>
                    {checkin.notes && <p className="whitespace-pre-wrap">{checkin.notes}</p>}
                    {(checkin.answers.some((answer) => answer.answer.trim()) ||
                      checkin.coachReply ||
                      checkin.updates?.some((update) => update.role === 'CLIENT')) && (
                      <details className="coach-review-conversation">
                        <summary>Respuestas y conversación</summary>
                        {checkin.answers
                          .filter((a) => a.answer.trim())
                          .map((a, i) => (
                            <div key={i}>
                              <strong>{a.question}</strong>
                              <p className="whitespace-pre-wrap">{a.answer}</p>
                            </div>
                          ))}
                        {checkin.coachReply && (
                          <blockquote className="border-l-2 pl-3">
                            <strong>Tu respuesta</strong>
                            <p className="whitespace-pre-wrap">{checkin.coachReply}</p>
                          </blockquote>
                        )}
                        {checkin.updates
                          ?.filter((update) => update.role === 'CLIENT')
                          .map((update, i) => (
                            <blockquote key={i} className="border-l-2 pl-3">
                              <strong>
                                Actualización del atleta · {formatCoachDate(update.createdAt)}
                              </strong>
                              <p className="whitespace-pre-wrap">{update.body}</p>
                            </blockquote>
                          ))}
                      </details>
                    )}
                  </>
                ) : (
                  !checkins.isPending &&
                  !checkins.isError && (
                    <p className="week-panel-hint">Sin seguimiento enviado para esta semana.</p>
                  )
                )}
                <p className="day-fact-links">
                  <Link to={`/entrenador/atletas/${linkId}?seccion=revisiones`}>
                    Abrir seguimientos y responder
                  </Link>
                </p>
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
