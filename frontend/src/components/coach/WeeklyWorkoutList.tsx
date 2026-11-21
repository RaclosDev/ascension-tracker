import { useMemo } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  personName,
  useClientCustomExercises,
  useClientData,
  type CoachPerson,
} from '../../lib/coach/api';
import { useExerciseCatalog, getExerciseMap } from '../../lib/workout/exercises';
import type { CompletedWorkout } from '../../lib/workout/types';
import { WorkoutReview } from './WorkoutReview';
import type { TodayDay } from '../../lib/coach/today';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { WorkoutSessionStats } from '../workout/WorkoutSessionSummary';
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  sessionVolume,
} from '../../lib/workout/format';
import { es } from 'date-fns/locale';
import { ClientAvatar } from './ClientAvatar';
import { CoachPageHeader } from './CoachWorkspace';
import { CoachWeekGrid } from './CoachWeekCalendar';

export function WeeklyWorkoutList({
  linkId,
  week,
  current = false,
  workoutHref,
}: {
  linkId: string;
  week: string;
  /** The week being looked at, marked like Tracking semanal marks the current one. */
  current?: boolean;
  workoutHref: (workoutId: string) => string;
}) {
  const monday = parseISO(week);
  const query = useClientData<CompletedWorkout[]>(
    linkId,
    `workouts/recent?since=${monday.getTime()}`,
    true,
  );
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const names = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const workouts = (query.data ?? [])
    .filter(
      (workout) =>
        workout.startedAt >= monday.getTime() && workout.startedAt < addDays(monday, 7).getTime(),
    )
    .sort((a, b) => a.startedAt - b.startedAt);
  const heading = (
    <h2>
      <span className="sr-only">Semana del </span>
      {format(monday, 'd MMM', { locale: es })}
      {current && <span className="ew-current">Actual</span>}
    </h2>
  );
  if (query.isPending)
    return (
      <>
        <header className="ew-head">{heading}</header>
        <p role="status">Cargando entrenos…</p>
      </>
    );
  if (query.isError)
    return (
      <>
        <header className="ew-head">{heading}</header>
        <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />
      </>
    );
  const sets = workouts.reduce((sum, w) => sum + completedSets(w.exercises), 0);
  const volume = workouts.reduce((sum, w) => sum + sessionVolume(w.exercises), 0);
  const time = workouts.reduce((sum, w) => sum + (w.finishedAt - w.startedAt), 0);
  return (
    <>
      <header className="ew-head">
        {heading}
        <dl className="ew-sum">
          <div>
            <dt>Entrenos</dt>
            <dd role="status">
              {workouts.length}
              <span className="sr-only">
                {workouts.length === 1 ? ' entreno registrado' : ' entrenos registrados'}
              </span>
            </dd>
          </div>
          <div>
            <dt>Series</dt>
            <dd>{sets}</dd>
          </div>
          <div>
            <dt>Volumen</dt>
            <dd>{volume ? formatKg(volume) : '—'}</dd>
          </div>
          <div>
            <dt>Tiempo</dt>
            <dd>{time ? formatDuration(time) : '—'}</dd>
          </div>
        </dl>
      </header>
      <CoachWeekGrid
        week={week}
        renderDay={(date) => {
          const sessions = workouts.filter(
            (workout) => format(workout.startedAt, 'yyyy-MM-dd') === date,
          );
          if (!sessions.length) return null;
          return (
            <ul className="coach-workout-calendar-sessions">
              {sessions.map((workout) => (
                <li key={workout.id}>
                  <Link className="coach-workout-calendar-session" to={workoutHref(workout.id)}>
                    <span className="coach-workout-calendar-name">
                      <strong>{workout.name || 'Entrenamiento'}</strong>
                      <ArrowUpRight size={15} aria-hidden />
                    </span>
                    <span className="coach-workout-calendar-meta">
                      {completedSets(workout.exercises)} series ·{' '}
                      {formatDuration(workout.finishedAt - workout.startedAt)}
                    </span>
                    {workout.exercises.length > 0 && (
                      <ul className="coach-workout-calendar-exercises" aria-label="Ejercicios">
                        {workout.exercises.slice(0, 3).map((exercise) => (
                          <li key={exercise.id}>
                            {names.get(exercise.exerciseId)?.name ?? 'Ejercicio'}
                          </li>
                        ))}
                        {workout.exercises.length > 3 && (
                          <li className="coach-workout-calendar-more">
                            +{workout.exercises.length - 3} más
                          </li>
                        )}
                      </ul>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          );
        }}
      />
    </>
  );
}

export function WeeklyWorkoutDetail({
  linkId,
  workoutId,
  client,
}: {
  linkId: string;
  workoutId: string;
  client: CoachPerson;
}) {
  const path = `workouts/${encodeURIComponent(workoutId)}`;
  const query = useClientData<CompletedWorkout>(linkId, path, true);
  const hasProgram = Boolean(query.data?.programDayId);
  const prescription = useClientData<TodayDay | null>(linkId, `${path}/prescription`, hasProgram);
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const names = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  if (query.isPending || custom.isPending || catalog.isPending)
    return <p role="status">Cargando entrenos…</p>;
  if (query.isError || custom.isError || catalog.isError)
    return (
      <QueryErrorNotice
        retry={() => {
          void query.refetch();
          void custom.refetch();
          void catalog.refetch();
        }}
        pending={query.isFetching || custom.isFetching || catalog.isFetching}
      />
    );
  return (
    <article className="coach-workout-review-page">
      <CoachPageHeader level={2} title={query.data.name || 'Entrenamiento'}>
        <div className="coach-workout-detail-client">
          <ClientAvatar client={client} />
          <span>{personName(client)}</span>
          <time dateTime={format(query.data.finishedAt, 'yyyy-MM-dd')}>
            {formatDay(query.data.finishedAt)}
          </time>
        </div>
      </CoachPageHeader>
      <div className="card coach-workout-review-stats">
        <WorkoutSessionStats workout={query.data} />
      </div>
      <div className="coach-quick-workout-detail">
        {hasProgram && prescription.isPending ? (
          <p role="status">Cargando pauta del entrenador…</p>
        ) : (
          <>
            {hasProgram && prescription.isError && (
              <QueryErrorNotice
                retry={() => void prescription.refetch()}
                pending={prescription.isFetching}
              />
            )}
            {!prescription.data && (
              <p className="coach-muted">
                {hasProgram ? 'Pauta original no disponible' : 'Entreno libre'}
              </p>
            )}
            {prescription.data?.notes?.trim() && (
              <p className="wr-note">{prescription.data.notes}</p>
            )}
            <WorkoutReview
              workout={query.data}
              exerciseName={(id) => names.get(id)?.name ?? 'Ejercicio'}
              prescribed={prescription.data?.exercises}
            />
          </>
        )}
      </div>
    </article>
  );
}
