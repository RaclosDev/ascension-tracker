import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { useClientData, type CoachClient } from '../../lib/coach/api';
import type { CompletedWorkout } from '../../lib/workout/types';
import type { WeekSummary } from '../../types/api';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { CoachFoodSummary } from './CoachFoodSummary';
import { CoachWeekGrid } from './CoachWeekCalendar';

/** One week of what the athlete logged: workouts, steps, weight and food, day by day. */
export function RegisterWeek({
  client,
  week,
  search,
}: {
  client: CoachClient;
  week: string;
  search: string;
}) {
  const body = client.permissions.body && client.setup?.services.progress !== false;
  const training = client.permissions.training && client.setup?.services.training !== false;
  const nutrition = client.permissions.nutrition && client.setup?.services.nutrition !== false;
  const weights = useClientData<WeekSummary[]>(client.linkId, 'weights/weekly', body);
  const steps = useClientData<WeekSummary[]>(client.linkId, 'steps/weekly', body);
  const workouts = useClientData<CompletedWorkout[]>(
    client.linkId,
    `workouts/recent?since=${parseISO(week).getTime()}`,
    training,
  );
  const queries = [...(body ? [weights, steps] : []), ...(training ? [workouts] : [])];
  if (queries.some((query) => query.isPending)) return <p role="status">Cargando registros…</p>;
  if (queries.some((query) => query.isError))
    return (
      <QueryErrorNotice
        retry={() => {
          queries.forEach((query) => void query.refetch());
        }}
        pending={queries.some((query) => query.isFetching)}
      />
    );
  return (
    <CoachWeekGrid
      week={week}
      renderDay={(date, index) => (
        <div className="coach-register-day">
          {training && (
            <div className="coach-register-training">
              <strong>Entreno</strong>
              {(workouts.data ?? [])
                .filter((workout) => format(workout.startedAt, 'yyyy-MM-dd') === date)
                .map((workout) => (
                  <Link
                    key={workout.id}
                    to={`/entrenador/atletas/${client.linkId}/entrenos/${workout.id}${search}`}
                  >
                    {workout.name || 'Entrenamiento'}
                  </Link>
                ))}
              {!(workouts.data ?? []).some(
                (workout) => format(workout.startedAt, 'yyyy-MM-dd') === date,
              ) && <span>Sin registro</span>}
            </div>
          )}
          {body && (
            <>
              <div className="coach-register-metric">
                <strong>Pasos</strong>
                <span>
                  {steps.data
                    ?.find((row) => row.weekStart === week)
                    ?.days[index]?.toLocaleString('es-ES') ?? '—'}
                </span>
              </div>
              <div className="coach-register-metric">
                <strong>Peso</strong>
                <span>
                  {weights.data?.find((row) => row.weekStart === week)?.days[index] != null
                    ? `${weights.data.find((row) => row.weekStart === week)!.days[index]!.toLocaleString('es-ES', { maximumFractionDigits: 2 })} kg`
                    : '—'}
                </span>
              </div>
            </>
          )}
          {nutrition && <CoachFoodSummary linkId={client.linkId} date={date} />}
        </div>
      )}
    />
  );
}
