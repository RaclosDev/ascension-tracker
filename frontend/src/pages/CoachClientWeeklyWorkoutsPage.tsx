import { shiftWeek } from '../lib/coach/weeks';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { AthleteShell } from '../components/coach/AthleteShell';
import { CoachWorkspace } from '../components/coach/CoachWorkspace';
import { WeeklyWorkoutDetail, WeeklyWorkoutList } from '../components/coach/WeeklyWorkoutList';
import { useCoachCalendarWeek } from '../hooks/useCoachCalendarWeek';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useCoachClient } from '../lib/coach/api';
import { CoachWeekNavigation } from '../components/coach/CoachWeekCalendar';

export default function CoachClientWeeklyWorkoutsPage() {
  const { workoutId } = useParams();
  return (
    <CoachWorkspace
      className={`coach-student athlete-page${workoutId ? '' : ' coach-workout-calendar-page'}`}
    >
      <WeeklyWorkoutsPage />
    </CoachWorkspace>
  );
}

function WeeklyWorkoutsPage() {
  const { linkId = '', workoutId } = useParams();
  const client = useCoachClient(linkId);
  const calendar = useCoachCalendarWeek();
  const { week, search } = calendar;
  const workoutsPath = `/entrenador/atletas/${encodeURIComponent(linkId)}/entrenos`;
  const link = client.data;

  return (
    <>
      {client.isPending ? (
        <p role="status">Cargando atleta…</p>
      ) : client.isError || !link ? (
        <QueryErrorNotice retry={() => void client.refetch()} pending={client.isFetching} />
      ) : (
        <AthleteShell
          link={link}
          active="entrenos"
          back={
            workoutId ? { to: `${workoutsPath}${search}`, label: 'Volver a la semana' } : undefined
          }
        >
          {!link.permissions.training || link.setup?.services.training === false ? (
            <p>No tienes acceso a los entrenamientos de este atleta.</p>
          ) : workoutId ? (
            <WeeklyWorkoutDetail linkId={linkId} workoutId={workoutId} client={link.client} />
          ) : (
            <>
              <CoachWeekNavigation {...calendar} label="Semana de entrenamientos" />
              {[week, shiftWeek(week, -1)].map((visibleWeek) => (
                <section
                  key={visibleWeek}
                  className="coach-weekly-workouts-list"
                  aria-label="Entrenamientos registrados"
                >
                  <h2>Semana del {format(parseISO(visibleWeek), 'd MMM yyyy', { locale: es })}</h2>
                  <WeeklyWorkoutList
                    key={visibleWeek}
                    linkId={linkId}
                    week={visibleWeek}
                    workoutHref={(id) => `${workoutsPath}/${encodeURIComponent(id)}${search}`}
                  />
                </section>
              ))}
            </>
          )}
        </AthleteShell>
      )}
    </>
  );
}
