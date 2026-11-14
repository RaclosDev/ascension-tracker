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
import { WorkoutComparison } from './WorkoutComparison';
import type { TodayDay } from '../../lib/coach/today';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { WorkoutSessionStats } from '../workout/WorkoutSessionSummary';
import { completedSets, formatDay, formatDuration } from '../../lib/workout/format';
import { ClientAvatar } from './ClientAvatar';
import { CoachPageHeader } from './CoachWorkspace';
import { CoachWeekGrid } from './CoachWeekCalendar';

export function WeeklyWorkoutList({
  linkId,
  week,
  workoutHref,
}: {
  linkId: string;
  week: string;
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
  if (query.isPending) return <p role="status">Cargando entrenos…</p>;
  if (query.isError)
    return <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />;
  return (
    <>
      <p className="coach-muted" role="status">
        {workouts.length === 1 ? '1 entreno registrado' : `${workouts.length} entrenos registrados`}
      </p>
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
        ) : hasProgram && prescription.data ? (
          <WorkoutComparison workout={query.data} plan={prescription.data} catalog={names} />
        ) : (
          <>
            {hasProgram && prescription.isError ? (
              <QueryErrorNotice
                retry={() => void prescription.refetch()}
                pending={prescription.isFetching}
              />
            ) : (
              <p className="coach-muted">
                {hasProgram ? 'Pauta original no disponible' : 'Entreno libre'}
              </p>
            )}
            <WorkoutReview
              workout={query.data}
              exerciseName={(id) => names.get(id)?.name ?? 'Ejercicio'}
            />
          </>
        )}
      </div>
    </article>
  );
}
