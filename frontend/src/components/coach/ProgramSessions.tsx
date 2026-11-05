import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage, formatCoachDate, useClientData } from '@/lib/coach/api';
import { WEEKDAY_LABELS } from '@/lib/coach/weekdays';
import { localIsoDate, prescriptionText } from '@/lib/coach/today';
import {
  SESSION_STATUS_LABELS,
  sessionStatus,
  useProgramSessions,
  useSaveComment,
  type ProgramSession,
  type SessionStatus,
} from '@/lib/coach/sessions';
import { SET_TYPE_LABEL, type CompletedWorkout } from '@/lib/workout/types';

const STATUS_COLORS: Record<SessionStatus, string> = {
  DONE: 'var(--success, #22c55e)',
  MODIFIED: 'var(--warning, #f59e0b)',
  MISSED: 'var(--danger, #ef4444)',
  PENDING: 'var(--text-secondary)',
};

/** Prescribed versus done, day by day, for one assigned program. */
export function ProgramSessions({
  linkId,
  assignmentId,
  exerciseName,
}: {
  linkId: string;
  assignmentId: string;
  exerciseName: (id: string) => string;
}) {
  const sessions = useProgramSessions(linkId, assignmentId);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [today] = useState(() => localIsoDate());

  if (sessions.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (sessions.isError) return <p role="alert">No se pudieron cargar las sesiones.</p>;
  if (!sessions.data?.length)
    return <p style={{ color: 'var(--text-secondary)' }}>Este programa no tiene días.</p>;

  return (
    <ol className="flex flex-col gap-2 mt-2">
      {sessions.data.map((session) => {
        const status = sessionStatus(session, today);
        const open = openDay === session.dayId;
        return (
          <li
            key={session.dayId}
            className="border-t pt-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={open}
              onClick={() => setOpenDay(open ? null : session.dayId)}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-white truncate">{session.name}</span>
                <span className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Semana {session.week} · {WEEKDAY_LABELS[session.dayIndex - 1]}{' '}
                  {formatCoachDate(session.date)}
                </span>
              </span>
              <span
                className="text-xs font-semibold whitespace-nowrap"
                style={{ color: STATUS_COLORS[status] }}
              >
                {SESSION_STATUS_LABELS[status]}
                {session.comment ? ' · comentado' : ''}
              </span>
            </button>
            {open && (
              <SessionDetail
                linkId={linkId}
                assignmentId={assignmentId}
                session={session}
                exerciseName={exerciseName}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SessionDetail({
  linkId,
  assignmentId,
  session,
  exerciseName,
}: {
  linkId: string;
  assignmentId: string;
  session: ProgramSession;
  exerciseName: (id: string) => string;
}) {
  const workout = useClientData<CompletedWorkout>(
    linkId,
    `workouts/${encodeURIComponent(session.workoutId ?? '')}`,
    Boolean(session.workoutId),
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-3">
      <div>
        <h4 className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
          Pautado
        </h4>
        {session.notes && <p className="text-sm text-white mb-1">{session.notes}</p>}
        <ul className="flex flex-col gap-1">
          {session.exercises.map((e, i) => {
            const target = prescriptionText(e);
            return (
              <li key={i} className="text-sm">
                <span className="text-white">{e.exerciseName ?? exerciseName(e.exerciseId)}</span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {e.sets} × {target || 'series'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>
          Hecho
        </h4>
        {!session.workoutId && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sin entreno registrado para este día.
          </p>
        )}
        {workout.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
        {workout.isError && <p role="alert">No se pudo cargar el entreno.</p>}
        {workout.data && (
          <ul className="flex flex-col gap-1">
            {workout.data.exercises.map((ex) => {
              const done = ex.sets.filter((s) => s.completed);
              return (
                <li key={ex.id} className="text-sm">
                  <span className="text-white">{exerciseName(ex.exerciseId)}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {done.length === 0
                      ? 'sin series completadas'
                      : done
                          .map((s) =>
                            [
                              s.type !== 'normal' ? SET_TYPE_LABEL[s.type] : '',
                              s.weight ? `${s.weight} kg` : '',
                              s.reps ? `× ${s.reps}` : '',
                              s.rpe ? `@${s.rpe}` : '',
                            ]
                              .filter(Boolean)
                              .join(' '),
                          )
                          .join(', ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {session.workoutId && (
        <CommentBox
          key={session.workoutId}
          linkId={linkId}
          assignmentId={assignmentId}
          workoutId={session.workoutId}
          saved={session.comment}
        />
      )}
    </div>
  );
}

function CommentBox({
  linkId,
  assignmentId,
  workoutId,
  saved,
}: {
  linkId: string;
  assignmentId: string;
  workoutId: string;
  saved: string | null;
}) {
  const [text, setText] = useState(saved ?? '');
  const save = useSaveComment(linkId, assignmentId);
  const trimmed = text.trim();

  const send = (value: string | null, done: string) =>
    save.mutate(
      { workoutId, text: value },
      {
        onSuccess: () => {
          if (value == null) setText('');
          toast.success(done);
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar el comentario')),
      },
    );

  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Comentario para tu alumno</span>
        <textarea
          className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
          style={{ borderColor: 'var(--border-subtle)' }}
          rows={2}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={save.isPending || !trimmed || trimmed === (saved ?? '')}
          onClick={() => send(trimmed, 'Comentario guardado')}
        >
          Guardar comentario
        </button>
        {saved && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={save.isPending}
            onClick={() => send(null, 'Comentario borrado')}
          >
            Borrar
          </button>
        )}
      </div>
    </div>
  );
}
