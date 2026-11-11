import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { personName } from '@/lib/coach/api';
import { useMyNutritionPlan, type DayTargets } from '@/lib/coach/nutritionPlan';

/**
 * While a coach's nutrition plan is in force it replaces the user's own targets, so the
 * macro editor gives way to a read-only view of the plan. Otherwise the editor shows as usual.
 */
export function CoachNutritionGate({ children }: { children: ReactNode }) {
  const plan = useMyNutritionPlan();
  if (plan.isPending) return <p role="status">Cargando objetivos de nutrición…</p>;
  if (plan.isError)
    return (
      <div role="alert">
        No se pudieron cargar tus objetivos de nutrición.
        <button type="button" className="btn btn-secondary" onClick={() => void plan.refetch()}>
          Reintentar objetivos
        </button>
      </div>
    );
  if (!plan.data) return <>{children}</>;
  const { coach, training, rest, notes } = plan.data;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
        <Lock size={16} aria-hidden />
        Pautado por {personName(coach)}. Tus objetivos los fija tu entrenador mientras la pauta esté
        activa.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <DayCard title="Día de entreno" targets={training} />
        <DayCard title="Día de descanso" targets={rest} />
      </div>
      {notes && (
        <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
          {notes}
        </p>
      )}
    </div>
  );
}

function DayCard({ title, targets }: { title: string; targets: DayTargets }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-subtle)' }}>
      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        {targets.kcal} kcal
      </p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        P {targets.protein} g · C {targets.carbs} g · G {targets.fat} g
      </p>
    </div>
  );
}
