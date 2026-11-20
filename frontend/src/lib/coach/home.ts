import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../../api/client';

/** Mirrors the backend CoachHomeDtos records. */
interface KeyLift {
  linkId: string;
  exerciseId: string;
  customName: string | null;
  workoutId: string;
  date: string;
  weight: number;
  reps: number;
  e1rm: number;
  trend: number | null;
}

interface HomeMeet {
  linkId: string;
  id: string;
  name: string;
  date: string;
}

interface CoachHome {
  lifts: KeyLift[];
  meets: HomeMeet[];
}

export const useCoachHome = (enabled: boolean) =>
  useQuery({
    queryKey: ['coach', 'home'] as const,
    enabled,
    queryFn: async () => (await api.get<CoachHome>('/coach/home')).data,
  });

/** Next week has to be published before its Monday: the deadline is the Sunday before. */
export function nextWeekDeadline(today = new Date()) {
  const monday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const daysLeft = differenceInCalendarDays(monday, today) - 1;
  return {
    weekStart: format(monday, 'yyyy-MM-dd'),
    range: `${format(monday, sameMonth ? 'd' : 'd MMM', { locale: es })} al ${format(sunday, 'd MMM', { locale: es })}`,
    daysLeft,
    dueText:
      daysLeft <= 0 ? 'vence hoy' : daysLeft === 1 ? 'queda 1 día' : `quedan ${daysLeft} días`,
  };
}

export const shortDate = (iso: string) => format(parseISO(iso), 'd MMM', { locale: es });

export const kilos = (value: number) =>
  `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })} kg`;

export function daysUntilText(iso: string, today = new Date()) {
  const days = differenceInCalendarDays(parseISO(iso), today);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days < 14) return `En ${days} días`;
  return `En ${Math.round(days / 7)} semanas`;
}
