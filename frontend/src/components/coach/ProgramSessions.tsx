import { startOfWeek, format, parseISO, addDays } from 'date-fns';
import { WorkoutReview } from './WorkoutReview';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage, formatCoachDate, useClientData } from '@/lib/coach/api';
import { WEEKDAY_LABELS } from '@/lib/coach/weekdays';
import { localIsoDate } from '@/lib/coach/today';
import { PrescriptionSummary } from './PrescriptionSummary';
import {
  SESSION_STATUS_LABELS,
  sessionStatus,
  useProgramSessions,
  useSaveComment,
  type ProgramSession,
  type SessionStatus,
} from '@/lib/coach/sessions';
import { type CompletedWorkout } from '@/lib/workout/types';

const STATUS_COLORS: Record<SessionStatus, string> = {
  DONE: 'var(--success, #22c55e)',
  MODIFIED: 'var(--warning, #f59e0b)',
  PARTIAL: 'var(--warning, #f59e0b)',
  MISSED: 'var(--danger, #ef4444)',
  PENDING: 'var(--text-secondary)',
};

/** Prescribed versus done, day by day, for one assigned program. */
export function ProgramSessions({
  linkId,
  assignmentId,
  exerciseName,
  weekStart,
}: {
  linkId: string;
  assignmentId: string;
  exerciseName: (id: string) => string;
  weekStart?: string;
}) {
  const sessions = useProgramSessions(linkId, assignmentId);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [today] = useState(() => localIsoDate());
  const [allWeeks, setAllWeeks] = useState(false);
  const from = weekStart ?? format(startOfWeek(parseISO(today), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const until = format(addDays(parseISO(from), 7), 'yyyy-MM-dd');
  const visible =
    sessions.data?.filter((s) => (!weekStart && allWeeks) || (s.date >= from && s.date < until)) ??
    [];

  if (sessions.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (sessions.isError) return <p role="alert">No se pudieron cargar las sesiones.</p>;
  if (!sessions.data?.length)
    return <p style={{ color: 'var(--text-secondary)' }}>Este programa no tiene días.</p>;

  return (
    <div>
      {!weekStart && (
        <button
          type="button"
          className="btn btn-secondary"
          aria-pressed={allWeeks}
          onClick={() => setAllWeeks(!allWeeks)}
        >
          {allWeeks ? 'Ver semana actual' : 'Ver todas las semanas'}
        </button>
      )}
      {visible.length === 0 && <p>No hay sesiones pautadas para esta semana.</p>}
      <ol className="flex flex-col gap-2 mt-2">
        {visible.map((session) => {
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
                  {session.recordedSets != null
                    ? ` · ${session.completedSets}/${session.recordedSets} series`
                    : ''}
                  {session.comment ? ' · revisado con comentario' : ''}
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
    </div>
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
            return (
              <li key={i} className="text-sm">
                <span className="text-white">{e.exerciseName ?? exerciseName(e.exerciseId)}</span>{' '}
                <div style={{ color: 'var(--text-secondary)' }}>
                  <PrescriptionSummary exercise={e} />
                </div>
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
          <WorkoutReview
            workout={workout.data}
            exerciseName={exerciseName}
            prescribed={session.exercises}
          />
        )}
      </div>
      {session.workoutId && (
        <CommentBox
          key={session.workoutId}
          linkId={linkId}
          assignmentId={assignmentId}
          workoutId={session.workoutId}
          saved={session.comment}
          contexts={workout.data?.exercises.map((exercise) => ({
            name: exerciseName(exercise.exerciseId),
            sets: exercise.sets.length,
            videoSeconds: exercise.videoSeconds,
          }))}
        />
      )}
    </div>
  );
}

export function CommentBox({
  linkId,
  assignmentId,
  workoutId,
  saved,
  contexts = [],
}: {
  linkId: string;
  assignmentId: string;
  workoutId: string;
  saved: string | null;
  contexts?: { name: string; sets: number; videoSeconds?: number | null }[];
}) {
  const [text, setText] = useState(saved ?? '');
  const [context, setContext] = useState('');
  const [setNumber, setSetNumber] = useState('');
  const [videoTime, setVideoTime] = useState('');
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
      {!!contexts.length && (
        <details>
          <summary className="cursor-pointer text-sm">
            Referenciar ejercicio, serie o momento del vídeo
          </summary>
          <div className="flex flex-wrap gap-2 mt-2">
            <label className="text-xs">
              Ejercicio
              <select
                value={context}
                onChange={(event) => {
                  setContext(event.target.value);
                  setSetNumber('');
                  setVideoTime(
                    contexts[Number(event.target.value)]?.videoSeconds?.toString() ?? '',
                  );
                }}
              >
                <option value="">Seleccionar</option>
                {contexts.map((item, i) => (
                  <option key={i} value={i}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Serie
              <input
                className="w-20"
                type="number"
                min={1}
                max={contexts[Number(context)]?.sets ?? 100}
                value={setNumber}
                onChange={(event) => setSetNumber(event.target.value)}
              />
            </label>
            <label className="text-xs">
              Segundo del vídeo
              <input
                className="w-24"
                type="number"
                min={0}
                max={7200}
                value={videoTime}
                onChange={(event) => setVideoTime(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={context === '' || text.length > 800}
              onClick={() =>
                setText(
                  `${text}${text ? '\n' : ''}[${contexts[Number(context)].name}${setNumber ? ` · serie ${setNumber}` : ''}${videoTime ? ` · vídeo, segundo ${videoTime}` : ''}] `,
                )
              }
            >
              Añadir referencia al comentario
            </button>
          </div>
        </details>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Comentario para tu atleta</span>
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
