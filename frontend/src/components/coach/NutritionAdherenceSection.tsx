import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useNutritionAdherence,
  type AdherenceDay,
  type AdherenceWeek,
} from '@/lib/coach/nutritionAdherence';

const pct = (value: number | null) => (value == null ? '—' : `${value} %`);

function dayState(day: AdherenceDay) {
  const label = format(parseISO(day.date), 'EEEE d', { locale: es });
  if (!day.target) return { className: 'border border-dashed', text: `${label}: sin pauta` };
  if (!day.intake) return { className: 'bg-white/10', text: `${label}: sin registro` };
  const detail = `${day.intake.kcal} de ${day.target.kcal} kcal, ${day.intake.protein} de ${day.target.protein} g de proteína`;
  return day.onTarget
    ? { className: 'bg-green-500', text: `${label}: en objetivo (${detail})` }
    : { className: 'bg-amber-400', text: `${label}: fuera de objetivo (${detail})` };
}

function WeekRow({ week }: { week: AdherenceWeek }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 border-b border-white/5">
      <span className="w-24 text-sm text-white">
        {format(parseISO(week.weekStart), "'Sem.' d MMM", { locale: es })}
      </span>
      <ul className="flex gap-1" aria-label="Días de la semana">
        {week.days.map((day) => {
          const state = dayState(day);
          return (
            <li
              key={day.date}
              className={`w-3 h-3 rounded-full ${state.className}`}
              style={{ borderColor: 'var(--border-subtle)' }}
              title={state.text}
              aria-label={state.text}
            />
          );
        })}
      </ul>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {week.plannedDays === 0
          ? 'Sin pauta'
          : `${week.onTargetDays} de ${week.plannedDays} días en objetivo · ${week.loggedDays} registrados`}
      </span>
      {week.plannedDays > 0 && (
        <span className="text-sm text-white">
          kcal {pct(week.kcalPct)} · proteína {pct(week.proteinPct)}
        </span>
      )}
    </li>
  );
}

/** Logged against prescribed for the last weeks; a day is on target within ±10 % kcal and ≥90 % protein. */
export function NutritionAdherenceSection({ linkId }: { linkId: string }) {
  const adherence = useNutritionAdherence(linkId);
  if (adherence.isLoading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Cargando adherencia…</p>;
  }
  if (adherence.isError || !adherence.data) {
    return <p style={{ color: 'var(--text-secondary)' }}>No se pudo cargar la adherencia.</p>;
  }
  const weeks = [...adherence.data].reverse();
  if (weeks.every((week) => week.plannedDays === 0)) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Sin pauta en las últimas semanas: no hay adherencia que medir.
      </p>
    );
  }
  return (
    <div>
      <ul aria-label="Adherencia por semana">
        {weeks.map((week) => (
          <WeekRow key={week.weekStart} week={week} />
        ))}
      </ul>
      <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
        En objetivo: kcal a ±10 % de la pauta y al menos el 90 % de la proteína. Los porcentajes
        comparan los días registrados con su pauta.
      </p>
    </div>
  );
}
