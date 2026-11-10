import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Dumbbell, MessageSquare, Utensils } from 'lucide-react';
import api from '../../api/client';
import { localIsoDate, useTodayPlans } from '../../lib/coach/today';
import { personName, useMyCoaches, type MyCoach } from '../../lib/coach/api';
import { useMyCheckin } from '../../lib/coach/checkins';
import type { FoodLog, Macros } from '../../types/api';

interface Props {
  showNutrition: boolean;
}

function Row({
  icon,
  title,
  detail,
  to,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail?: string;
  to: string;
  action: string;
}) {
  return (
    <li className="today-row flex items-center gap-3 py-3">
      <span className="shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        {detail && (
          <p className="m-0 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
            {detail}
          </p>
        )}
      </div>
      <Link to={to} className="btn btn-secondary btn-sm min-h-11 shrink-0 px-3 text-xs">
        {action}
      </Link>
    </li>
  );
}

function WorkoutRow() {
  const { data: plans } = useTodayPlans();
  const active = plans?.find((p) => p.phase === 'ACTIVE' && p.day);
  if (active?.completedWorkoutId) {
    return (
      <Row
        icon={<Dumbbell size={18} />}
        title="Entreno hecho"
        detail={active.day?.name}
        to="/workout"
        action="Ver"
      />
    );
  }
  if (active?.day) {
    return (
      <Row
        icon={<Dumbbell size={18} />}
        title={active.day.name}
        detail={active.coachName ? `${active.programName} · ${active.coachName}` : active.programName}
        to="/workout"
        action="Empezar"
      />
    );
  }
  return (
    <Row
      icon={<Dumbbell size={18} />}
      title="Sin sesión programada"
      detail="Entreno libre cuando quieras"
      to="/workout"
      action="Entrenar"
    />
  );
}

function NutritionRow() {
  const date = localIsoDate();
  const { data } = useQuery({
    queryKey: ['nutrition', 'today-summary', date],
    queryFn: async () => {
      const [macros, logs] = await Promise.all([
        api.get<Macros>(`/nutrition/macros?date=${date}`),
        api.get<FoodLog[]>(`/nutrition/logs?date=${date}`),
      ]);
      const eaten = logs.data.reduce((sum, log) => sum + log.kcal, 0);
      return { eaten: Math.round(eaten), target: Math.round(macros.data.kcal) };
    },
    staleTime: 60 * 1000,
  });
  const detail = data
    ? data.target > 0
      ? `${data.eaten} de ${data.target} kcal`
      : `${data.eaten} kcal`
    : undefined;
  return (
    <Row
      icon={<Utensils size={18} />}
      title="Comidas"
      detail={detail}
      to="/nutrition"
      action="Anotar"
    />
  );
}

function CoachRow({ link }: { link: MyCoach }) {
  const { data, isError } = useMyCheckin(link.linkId);
  if (isError || !data) return null;
  const coach = personName(link.coach);
  const to = `/checkin/${encodeURIComponent(link.linkId)}`;
  if (!data.current) {
    return (
      <Row
        icon={<MessageSquare size={18} />}
        title="Check-in semanal pendiente"
        detail={`Para ${coach}`}
        to={to}
        action="Rellenar"
      />
    );
  }
  if (data.current.coachReply) {
    return (
      <Row
        icon={<MessageSquare size={18} />}
        title={`${coach} te ha respondido`}
        detail={data.current.coachReply}
        to={to}
        action="Leer"
      />
    );
  }
  return null;
}

/** What is planned for today: the session, the food and, only with a coach, the check-in. */
export function TodayCard({ showNutrition }: Props) {
  const { data: coaches = [] } = useMyCoaches();
  return (
    <section aria-labelledby="today-card-title" className="card today-card p-4 mb-5">
      <h2
        id="today-card-title"
        className="m-0 text-xs font-bold uppercase tracking-wide"
        style={{ color: 'var(--text-secondary)' }}
      >
        Hoy
      </h2>
      <ul className="today-list m-0 list-none p-0">
        <WorkoutRow />
        {showNutrition && <NutritionRow />}
        {coaches.map((link) => (
          <CoachRow key={link.linkId} link={link} />
        ))}
      </ul>
    </section>
  );
}
