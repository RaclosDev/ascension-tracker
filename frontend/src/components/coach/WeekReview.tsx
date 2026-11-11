import { Link } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { formatCoachDate, useClientCustomExercises } from '@/lib/coach/api';
import { useClientCheckins, SCORE_LABELS, SCORE_KEYS } from '@/lib/coach/checkins';
import { useExerciseCatalog, getExerciseMap } from '@/lib/workout/exercises';
import { overlapsWeek } from '@/lib/coach/weeks';
import type { ProgramAssignment } from '@/lib/coach/coachPrograms';
import { ProgramSessions } from './ProgramSessions';

export function WeekReview({
  linkId,
  week,
  assignments,
}: {
  linkId: string;
  week: string;
  assignments: ProgramAssignment[];
}) {
  const checkins = useClientCheckins(linkId);
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exercises = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const relevant = assignments.filter((a) => overlapsWeek(a, week));
  const current = relevant.filter((a) => a.status !== 'ENDED');
  const previous = current.length ? relevant.filter((a) => a.status === 'ENDED') : [];
  const visible = current.length ? current : relevant;
  const checkin = checkins.data?.find((c) => c.weekStart === week);
  return (
    <section data-tour="week-review" className="card min-w-0 flex flex-col gap-4">
      <h2>Revisión · {formatCoachDate(week)}</h2>
      <p className="text-sm">
        Hasta el {formatCoachDate(format(addDays(parseISO(week), 6), 'yyyy-MM-dd'))}
      </p>
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
        <div className="flex flex-col gap-2">
          <h3 className="font-bold">Feedback del alumno</h3>
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
                    <strong>Actualización del alumno · {formatCoachDate(update.createdAt)}</strong>
                    <p className="whitespace-pre-wrap">{update.body}</p>
                  </blockquote>
                ))}
            </details>
          )}
        </div>
      ) : (
        !checkins.isPending && !checkins.isError && <p>Sin revisión enviada para esta semana.</p>
      )}
      <Link className="btn btn-secondary" to={`/entrenador/alumnos/${linkId}?seccion=revisiones`}>
        Abrir revisiones y responder
      </Link>
      <h3 className="font-bold">Pautado y registrado</h3>
      {relevant.length === 0 && <p>No hay programa para esta semana.</p>}
      {visible.map((a) => (
        <div key={a.id}>
          <h4>{a.programName}</h4>
          <ProgramSessions
            linkId={linkId}
            assignmentId={a.id}
            weekStart={week}
            exerciseName={(id) => exercises.get(id)?.name ?? 'Ejercicio'}
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
                  exerciseName={(id) => exercises.get(id)?.name ?? 'Ejercicio'}
                />
              </div>
            ))}
          </div>
        </details>
      )}
      <Link
        className="btn btn-secondary"
        to={`/entrenador/alumnos/${linkId}?seccion=entrenamiento`}
      >
        Abrir historial completo y entrenos libres
      </Link>
    </section>
  );
}
