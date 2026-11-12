import { Suspense, useState } from 'react';
import { format } from 'date-fns';
import { Utensils } from 'lucide-react';
import { useClientData, type CoachTargets } from '../../lib/coach/api';
import type { FoodLog, WeekSummary } from '../../types/api';
import { NutritionAdherenceSection } from './NutritionAdherenceSection';
import { NutritionPlanSection } from './NutritionPlanSection';
import { Skeleton } from '../ui/skeleton';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { Section, Stat, QueryState, WeeklyList, num } from './ClientSection';
const NutritionPieChart = lazyWithRetry(() => import('../nutrition/NutritionPieChart'));

export default function NutritionSection({
  linkId,
  canEditPlan,
}: {
  linkId: string;
  canEditPlan: boolean;
}) {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const targets = useClientData<CoachTargets>(linkId, 'targets', true);
  const weekly = useClientData<WeekSummary[]>(linkId, 'nutrition/calories/weekly', true);
  const logs = useClientData<FoodLog[]>(linkId, `nutrition/logs?date=${date}`, Boolean(date));
  const t = targets.data;
  const totals = (logs.data ?? []).reduce(
    (acc, log) => ({
      kcal: acc.kcal + (log.kcal || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <Section title="Nutrición" icon={<Utensils size={18} aria-hidden />}>
      <h3 className="font-semibold text-foreground mb-2">Pauta de nutrición</h3>
      <NutritionPlanSection linkId={linkId} canEdit={canEditPlan} />
      <h3 className="font-semibold text-foreground mt-6 mb-2">Adherencia a la pauta</h3>
      <NutritionAdherenceSection linkId={linkId} />
      <details className="mt-6">
        <summary className="cursor-pointer font-semibold">Objetivos personales del atleta</summary>
        <p className="text-sm my-2">
          Estos valores proceden de sus ajustes personales. La pauta del entrenador los sustituye
          mientras esté activa; la adherencia anterior se calcula contra la pauta vigente en cada
          fecha.
        </p>
        {t && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Stat label="Objetivo" value={num(t.kcal, ' kcal')} />
            <Stat label="Proteína" value={num(t.customProteinGrams, ' g')} />
            <Stat label="Carbohidratos" value={num(t.customCarbsGrams, ' g')} />
            <Stat label="Grasa" value={num(t.customFatGrams, ' g')} />
          </div>
        )}
      </details>
      <h3 className="font-semibold text-foreground mt-6 mb-2">Registro de ingesta</h3>
      {weekly.data && <WeeklyList weeks={weekly.data} unit=" kcal/día" />}

      <label className="flex items-center gap-2 mt-4 mb-2">
        <span style={{ color: 'var(--text-secondary)' }}>Día</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg px-3 py-1 bg-black/20 border"
          style={{ borderColor: 'var(--border-subtle)' }}
        />
      </label>
      <QueryState isLoading={logs.isLoading} isError={logs.isError} />
      {logs.data?.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Nada registrado ese día. No equivale a haber consumido cero calorías.
        </p>
      )}
      {logs.data && logs.data.length > 0 && (
        <>
          <ul className="flex flex-col gap-1 mb-2">
            {logs.data.map((log, i) => (
              <li key={log.id ?? i} className="flex justify-between gap-2">
                <span className="truncate">
                  {log.product}{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    · {num(log.quantity, ' g')}
                  </span>
                </span>
                <span className="text-foreground">{num(log.kcal, ' kcal')}</span>
              </li>
            ))}
          </ul>
          <div className="mx-auto mb-2" style={{ width: '100%', maxWidth: 300, height: 250 }}>
            <Suspense fallback={<Skeleton className="w-48 h-48 rounded-full mx-auto" />}>
              <NutritionPieChart pieData={macroPieData(totals)} />
            </Suspense>
          </div>
          <p className="text-sm text-foreground">
            Total {num(totals.kcal, ' kcal')} · P {num(totals.protein, ' g')} · C{' '}
            {num(totals.carbs, ' g')} · G {num(totals.fat, ' g')}
          </p>
        </>
      )}
    </Section>
  );
}

/** Same split as the client's own diary: kcal from each macro plus what is left of the target. */
function macroPieData(totals: { kcal: number; protein: number; carbs: number; fat: number }) {
  return [
    { name: 'Proteínas', value: totals.protein * 4, color: 'var(--color-protein)' },
    { name: 'Hidratos', value: totals.carbs * 4, color: 'var(--color-carbs)' },
    { name: 'Grasas', value: totals.fat * 9, color: 'var(--color-fat)' },
  ];
}
