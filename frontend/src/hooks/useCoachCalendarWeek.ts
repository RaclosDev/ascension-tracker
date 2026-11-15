import { isValid, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { weekDate } from '../lib/coach/weeks';

export function useCoachCalendarWeek() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('semana');
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? parseISO(requested) : null;
  const currentWeek = weekDate();
  const selected = date && isValid(date) ? weekDate(date) : currentWeek;
  const week = selected <= currentWeek ? selected : currentWeek;
  const listQuery = new URLSearchParams(params.get('lista') ?? '').toString();

  function changeWeek(value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value === currentWeek) next.delete('semana');
        else next.set('semana', value);
        return next;
      },
      { replace: true },
    );
  }

  return {
    week,
    currentWeek,
    changeWeek,
    back: `/entrenador/atletas${listQuery ? `?${listQuery}` : ''}`,
    search: params.size ? `?${params}` : '',
  };
}
