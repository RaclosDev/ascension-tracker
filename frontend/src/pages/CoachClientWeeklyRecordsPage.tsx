import { CoachFoodSummary } from '../components/coach/CoachFoodSummary';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { AthleteShell } from '../components/coach/AthleteShell';
import { ClientFoodDay } from '../components/coach/ClientFoodDay';
import { CoachWorkspace } from '../components/coach/CoachWorkspace';
import { CoachWeekGrid, CoachWeekNavigation } from '../components/coach/CoachWeekCalendar';
import { useCoachCalendarWeek } from '../hooks/useCoachCalendarWeek';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useClientData, useCoachClient } from '../lib/coach/api';
import { weekDate, shiftWeek } from '../lib/coach/weeks';
import type { WeekSummary } from '../types/api';
import { getLocalDateString } from '../utils/dateHelper';

const records = {
  meals: { title: 'Comidas', endpoint: 'nutrition/calories/weekly', unit: 'kcal' },
  steps: { title: 'Pasos', endpoint: 'steps/weekly', unit: 'pasos' },
  weight: { title: 'Peso', endpoint: 'weights/weekly', unit: 'kg' },
};

type Metric = keyof typeof records;
const formatAmount = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

export default function CoachClientWeeklyRecordsPage({ metric }: { metric: Metric }) {
  return (
    <CoachWorkspace className="coach-student athlete-page coach-workout-calendar-page">
      <WeeklyRecords metric={metric} />
    </CoachWorkspace>
  );
}

function WeeklyRecords({ metric }: { metric: Metric }) {
  const { linkId = '', date } = useParams();
  const athlete = useCoachClient(linkId);
  const calendar = useCoachCalendarWeek();
  const { title } = records[metric];
  const link = athlete.data;
  const meals = metric === 'meals';
  const canRead = meals
    ? link?.permissions.nutrition && link.setup?.services.nutrition !== false
    : link?.permissions.body && link.setup?.services.progress !== false;
  const basePath = `/entrenador/atletas/${encodeURIComponent(linkId)}/comidas`;
  const mealsParams = new URLSearchParams(calendar.search);
  const parsedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseISO(date) : null;
  const validDate = parsedDate && isValid(parsedDate) && date && date <= getLocalDateString();
  if (validDate) {
    const diaryWeek = weekDate(parsedDate);
    if (diaryWeek === calendar.currentWeek) mealsParams.delete('semana');
    else mealsParams.set('semana', diaryWeek);
  }
  const mealsBack = `${basePath}${mealsParams.size ? `?${mealsParams}` : ''}`;

  return (
    <>
      {athlete.isPending ? (
        <p role="status">Cargando atleta…</p>
      ) : athlete.isError || !link ? (
        <QueryErrorNotice retry={athlete.refetch} pending={athlete.isFetching} />
      ) : (
        <AthleteShell
          link={link}
          active={metric === 'meals' ? 'comidas' : metric === 'steps' ? 'pasos' : 'peso'}
          back={date ? { to: mealsBack, label: 'Volver a la semana' } : undefined}
        >
          {!canRead ? (
            <p>No tienes acceso a estos registros del atleta.</p>
          ) : date ? (
            validDate ? (
              <section className="coach-weekly-workouts-list" aria-label="Diario del atleta">
                <h2>{format(parsedDate, "EEEE d 'de' MMMM", { locale: es })}</h2>
                <ClientFoodDay linkId={linkId} date={date} />
              </section>
            ) : (
              <p>La fecha del diario no es válida.</p>
            )
          ) : (
            <>
              <CoachWeekNavigation
                {...calendar}
                label={`Semana de ${title.toLocaleLowerCase('es')}`}
              />
              {Array.from({ length: meals ? 2 : 4 }, (_, index) =>
                shiftWeek(calendar.week, -index),
              ).map((week) => (
                <section
                  key={week}
                  className="coach-weekly-workouts-list"
                  aria-label={title + ' de la semana'}
                >
                  <h2>Semana del {format(parseISO(week), 'd MMM yyyy', { locale: es })}</h2>
                  <WeeklyRecordGrid linkId={linkId} metric={metric} week={week} />
                </section>
              ))}
            </>
          )}
        </AthleteShell>
      )}
    </>
  );
}

function WeeklyRecordGrid({
  linkId,
  metric,
  week,
}: {
  linkId: string;
  metric: Metric;
  week: string;
}) {
  const { endpoint, unit } = records[metric];
  const query = useClientData<WeekSummary[]>(linkId, endpoint, true);
  if (query.isPending) return <p role="status">Cargando registros…</p>;
  if (query.isError) return <QueryErrorNotice retry={query.refetch} pending={query.isFetching} />;

  const summary = query.data?.find(({ weekStart }) => weekStart === week);
  const days = summary?.days ?? [];
  const count = days.filter((value) => value != null).length;

  return (
    <>
      <p className="coach-muted" role="status">
        {count === 1 ? '1 día con registros' : `${count} días con registros`}
        {metric !== 'meals' && summary?.average != null && (
          <>
            {' '}
            · Media de la semana: {formatAmount.format(summary.average)} {unit}
          </>
        )}
      </p>
      <CoachWeekGrid
        week={week}
        renderDay={(date, index) => {
          const amount = days[index];
          if (metric === 'meals') return <CoachFoodSummary linkId={linkId} date={date} />;
          if (amount == null) return null;
          const label = `${formatAmount.format(amount)} ${unit}`;
          return (
            <div className="coach-workout-calendar-sessions">
              <div className="coach-workout-calendar-session coach-record-value">
                <strong className="coach-workout-calendar-name">{label}</strong>
              </div>
            </div>
          );
        }}
      />
    </>
  );
}
