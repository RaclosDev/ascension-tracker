import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { AthleteShell } from '../components/coach/AthleteShell';
import { CoachWorkspace } from '../components/coach/CoachWorkspace';
import { CoachWeekNavigation } from '../components/coach/CoachWeekCalendar';
import { RegisterWeek } from '../components/coach/RegisterWeek';
import { useCoachCalendarWeek } from '../hooks/useCoachCalendarWeek';
import { useCoachClient } from '../lib/coach/api';
import { shiftWeek } from '../lib/coach/weeks';
import { QueryErrorNotice } from '../components/QueryErrorNotice';

export default function CoachClientRegisterPage() {
  const { linkId = '' } = useParams();
  const client = useCoachClient(linkId);
  const calendar = useCoachCalendarWeek();
  return (
    <CoachWorkspace className="coach-student athlete-page coach-workout-calendar-page coach-register-page">
      {client.isPending ? (
        <p role="status">Cargando atleta…</p>
      ) : client.isError || !client.data ? (
        <QueryErrorNotice retry={client.refetch} pending={client.isFetching} />
      ) : (
        <AthleteShell link={client.data} active="registro">
          <CoachWeekNavigation {...calendar} label="Semanas del registro" />
          {[calendar.week, shiftWeek(calendar.week, -1)].map((week) => (
            <section key={week} className="coach-weekly-workouts-list">
              <h2>Semana del {format(parseISO(week), 'd MMM yyyy', { locale: es })}</h2>
              <RegisterWeek client={client.data} week={week} search={calendar.search} />
            </section>
          ))}
        </AthleteShell>
      )}
    </CoachWorkspace>
  );
}
