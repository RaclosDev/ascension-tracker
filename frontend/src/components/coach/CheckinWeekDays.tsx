import { useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage, useClientData, type CoachClient } from '../../lib/coach/api';
import { useSaveComment, useSaveDayComment, type DayComment } from '../../lib/coach/sessions';
import type { CompletedWorkout } from '../../lib/workout/types';
import type { WeekSummary } from '../../types/api';

const COMMENT_MAX = 1000;
const capital = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1);
const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

/**
 * The seven days of a week as the athlete lived them, each open to a comment: on its session when
 * there is one, on the day itself when there is none.
 */
export function CheckinWeekDays({ link, week }: { link: CoachClient; week: string }) {
  const linkId = link.linkId;
  const training = link.permissions.training && link.setup?.services.training !== false;
  const nutrition = link.permissions.nutrition && link.setup?.services.nutrition !== false;
  const body = link.permissions.body && link.setup?.services.progress !== false;
  const workouts = useClientData<CompletedWorkout[]>(
    linkId,
    `workouts/recent?since=${parseISO(week).getTime()}`,
    training,
  );
  const kcal = useClientData<WeekSummary[]>(linkId, 'nutrition/calories/weekly', nutrition);
  const weights = useClientData<WeekSummary[]>(linkId, 'weights/weekly', body);
  const notes = useClientData<DayComment[]>(
    linkId,
    `day-comments?from=${week}&to=${format(addDays(parseISO(week), 6), 'yyyy-MM-dd')}`,
    true,
  );
  if (!training && !nutrition && !body) return null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const eaten = kcal.data?.find((row) => row.weekStart === week)?.days;
  const weighed = weights.data?.find((row) => row.weekStart === week)?.days;
  const failed = [workouts, kcal, weights].filter((query) => query.isError);

  return (
    <section className="checkin-days" aria-label="Día a día">
      <h4>Día a día</h4>
      {failed.length > 0 && (
        <p role="alert">
          No se han podido cargar todos los registros.{' '}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => failed.forEach((query) => void query.refetch())}
          >
            Reintentar
          </button>
        </p>
      )}
      <div className="checkin-days-head" aria-hidden>
        <span />
        <span className="checkin-day-facts">
          {training && <span className="checkin-fact-workout">Entreno</span>}
          {nutrition && <span className="checkin-fact-number">Comida</span>}
          {body && <span className="checkin-fact-number">Peso</span>}
        </span>
        <span />
      </div>
      <ol>
        {Array.from({ length: 7 }, (_, index) => {
          const day = addDays(parseISO(week), index);
          const date = format(day, 'yyyy-MM-dd');
          const from = day.getTime();
          const to = addDays(day, 1).getTime();
          const done = (workouts.data ?? []).filter(
            (workout) => workout.startedAt >= from && workout.startedAt < to,
          );
          const kcalDay = eaten?.[index];
          const weightDay = weighed?.[index];
          return (
            <li key={date} data-future={date > today ? '' : undefined}>
              <p className="checkin-day-name">
                {capital(format(day, 'EEE', { locale: es })).replace('.', '')}{' '}
                <b>{format(day, 'd')}</b>
                {date === today && <i>Hoy</i>}
              </p>
              <dl className="checkin-day-facts">
                {training && (
                  <div className="checkin-fact-workout" data-empty={done.length ? undefined : ''}>
                    <dt className="sr-only">Entreno</dt>
                    <dd>
                      {done.length
                        ? done.map((workout) => (
                            <Link
                              key={workout.id}
                              to={`/entrenador/atletas/${linkId}/entrenos/${workout.id}`}
                            >
                              {workout.name || 'Entrenamiento'}
                            </Link>
                          ))
                        : workouts.isPending
                          ? '…'
                          : '—'}
                    </dd>
                  </div>
                )}
                {nutrition && (
                  <div
                    className="checkin-fact-number"
                    data-empty={kcalDay == null ? '' : undefined}
                  >
                    <dt className="sr-only">Comida</dt>
                    <dd>
                      {kcalDay == null
                        ? '—'
                        : `${Math.round(kcalDay).toLocaleString('es-ES')} kcal`}
                    </dd>
                  </div>
                )}
                {body && (
                  <div
                    className="checkin-fact-number"
                    data-empty={weightDay == null ? '' : undefined}
                  >
                    <dt className="sr-only">Peso</dt>
                    <dd>{weightDay == null ? '—' : `${kg.format(weightDay)} kg`}</dd>
                  </div>
                )}
              </dl>
              {done.map((workout) => (
                <WorkoutComment key={workout.id} linkId={linkId} workoutId={workout.id} />
              ))}
              {done.length === 0 && date <= today && notes.isSuccess && !workouts.isLoading && (
                <DayNote
                  linkId={linkId}
                  date={date}
                  saved={notes.data.find((note) => note.date === date)?.text ?? ''}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The coach's comment on the session of one day; the athlete reads it with that workout. */
function WorkoutComment({ linkId, workoutId }: { linkId: string; workoutId: string }) {
  const comment = useClientData<{ text: string }>(
    linkId,
    `workouts/${encodeURIComponent(workoutId)}/comment`,
    true,
  );
  const save = useSaveComment(linkId, 'history');
  if (!comment.isSuccess) return null;
  return (
    <CommentBox
      id={workoutId}
      saved={comment.data.text?.trim() ?? ''}
      pending={save.isPending}
      send={(text, options) => save.mutate({ workoutId, text }, options)}
    />
  );
}

/** The coach's comment on a day without a session; the athlete reads it in their weekly check-in. */
function DayNote({ linkId, date, saved }: { linkId: string; date: string; saved: string }) {
  const save = useSaveDayComment(linkId);
  return (
    <CommentBox
      id={date}
      saved={saved}
      pending={save.isPending}
      send={(text, options) => save.mutate({ date, text }, options)}
    />
  );
}

type SendOptions = { onSuccess: () => void; onError: (error: unknown) => void };

function CommentBox({
  id,
  saved,
  pending,
  send: mutate,
}: {
  id: string;
  saved: string;
  pending: boolean;
  send: (text: string | null, options: SendOptions) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const send = (text: string | null) =>
    mutate(text, {
      onSuccess: () => {
        setDraft(null);
        toast.success(text == null ? 'Comentario quitado' : 'Comentario guardado');
      },
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar el comentario')),
    });

  if (draft === null)
    return saved ? (
      <div className="checkin-day-comment">
        <p>{saved}</p>
        <button type="button" className="checkin-day-add" onClick={() => setDraft(saved)}>
          Editar
        </button>
      </div>
    ) : (
      <button type="button" className="checkin-day-add" onClick={() => setDraft('')}>
        <MessageSquarePlus size={15} aria-hidden /> Comentar el día
      </button>
    );

  return (
    <form
      className="checkin-day-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (draft.trim() && !pending) send(draft.trim());
      }}
    >
      <label htmlFor={`day-comment-${id}`}>Comentario del día</label>
      <textarea
        id={`day-comment-${id}`}
        className="form-input"
        rows={2}
        maxLength={COMMENT_MAX}
        autoFocus
        disabled={pending}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || !draft.trim() || draft.trim() === saved}
        >
          Guardar
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={pending}
          onClick={() => setDraft(null)}
        >
          Cancelar
        </button>
        {saved && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => send(null)}
          >
            Quitar
          </button>
        )}
      </div>
    </form>
  );
}
