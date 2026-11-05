import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Dumbbell, Footprints, Scale, Utensils } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  formatCoachDate,
  personName,
  sharedScopes,
  useClientData,
  useCoachClients,
  type CoachTargets,
} from '../lib/coach/api';
import { useExerciseCatalog, getExerciseMap } from '../lib/workout/exercises';
import { formatDay, formatKg, sessionVolume } from '../lib/workout/format';
import type { CompletedWorkout } from '../lib/workout/types';
import type { DashboardData, FoodLog, WeekSummary } from '../types/api';

const numFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const num = (value: number | null | undefined, unit = '') =>
  value == null || !Number.isFinite(value) ? '—' : `${numFmt.format(value)}${unit}`;

export default function CoachClientPage() {
  const { linkId = '' } = useParams();
  const clients = useCoachClients(true);
  const link = clients.data?.find((c) => c.linkId === linkId);

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 pt-2 sm:pt-4">
      <Link
        to="/entrenador"
        className="inline-flex items-center gap-1 mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={16} aria-hidden /> Alumnos
      </Link>
      {clients.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {clients.data && !link && <p role="alert">Este alumno ya no está vinculado contigo.</p>}
      {link && (
        <>
          <header className="mb-6 pb-2 border-b border-white/5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {personName(link.client)}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Comparte: {sharedScopes(link.permissions)} · desde {formatCoachDate(link.since)}
            </p>
          </header>
          <div className="flex flex-col gap-6">
            {link.permissions.body && <BodySection linkId={linkId} />}
            {link.permissions.training && <TrainingSection linkId={linkId} />}
            {link.permissions.nutrition && <NutritionSection linkId={linkId} />}
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="card-title flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function QueryState({ isLoading, isError }: { isLoading: boolean; isError: boolean }) {
  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (isError) return <p role="alert">No se pudieron cargar estos datos.</p>;
  return null;
}

function WeeklyList({ weeks, unit }: { weeks: WeekSummary[]; unit: string }) {
  const recent = weeks.slice(-6).reverse();
  if (recent.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>Sin registros.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {recent.map((week) => (
        <li key={week.weekStart} className="flex justify-between gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>
            Semana del {formatCoachDate(week.weekStart)}
          </span>
          <span className="text-white">{num(week.average, unit)}</span>
        </li>
      ))}
    </ul>
  );
}

function BodySection({ linkId }: { linkId: string }) {
  const dashboard = useClientData<DashboardData>(linkId, 'weights/dashboard', true);
  const weeks = useClientData<WeekSummary[]>(linkId, 'weights/weekly', true);
  const steps = useClientData<WeekSummary[]>(linkId, 'steps/weekly', true);
  const d = dashboard.data;

  return (
    <>
      <Section title="Peso" icon={<Scale size={18} aria-hidden />}>
        <QueryState isLoading={dashboard.isLoading} isError={dashboard.isError} />
        {d && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Stat label="Actual" value={num(d.currentWeight, ' kg')} />
            <Stat label="Media semanal" value={num(d.currentWeeklyAverage, ' kg')} />
            <Stat label="Cambio total" value={num(d.totalLost, ' kg')} />
            <Stat label="Cambio/semana" value={num(d.avgWeeklyChange, ' kg')} />
          </div>
        )}
        {weeks.data && <WeeklyList weeks={weeks.data} unit=" kg" />}
      </Section>
      <Section title="Pasos" icon={<Footprints size={18} aria-hidden />}>
        <QueryState isLoading={steps.isLoading} isError={steps.isError} />
        {steps.data && <WeeklyList weeks={steps.data} unit=" pasos/día" />}
      </Section>
    </>
  );
}

interface WorkoutPage {
  content: CompletedWorkout[];
}

interface WorkoutStats {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalVolume: number;
  totalSets: number;
}

function TrainingSection({ linkId }: { linkId: string }) {
  const history = useClientData<WorkoutPage>(linkId, 'workouts?page=0&size=10', true);
  const stats = useClientData<WorkoutStats>(linkId, 'workouts/stats', true);
  const catalog = useExerciseCatalog();
  const exerciseMap = useMemo(() => getExerciseMap([], catalog.data ?? []), [catalog.data]);
  const s = stats.data;

  return (
    <Section title="Entrenamiento" icon={<Dumbbell size={18} aria-hidden />}>
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Stat label="Entrenos" value={num(s.totalWorkouts)} />
          <Stat label="Horas" value={num(s.totalDurationSeconds / 3600)} />
          <Stat label="Series" value={num(s.totalSets)} />
          <Stat label="Volumen" value={formatKg(s.totalVolume)} />
        </div>
      )}
      <QueryState isLoading={history.isLoading} isError={history.isError} />
      {history.data?.content.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>Aún no ha registrado entrenamientos.</p>
      )}
      <ul className="flex flex-col gap-3">
        {history.data?.content.map((workout) => (
          <li
            key={workout.id}
            className="border-t pt-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex justify-between gap-2">
              <span className="font-bold text-white">{workout.name || 'Entrenamiento'}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatDay(workout.startedAt)}</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {(workout.exercises ?? [])
                .map((ex) => exerciseMap.get(ex.exerciseId)?.name ?? 'Ejercicio personalizado')
                .join(' · ')}
            </div>
            <div className="text-sm text-white">
              Volumen {formatKg(sessionVolume(workout.exercises ?? []))}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NutritionSection({ linkId }: { linkId: string }) {
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
      {t && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Stat label="Objetivo" value={num(t.kcal, ' kcal')} />
          <Stat label="Proteína" value={num(t.customProteinGrams, ' g')} />
          <Stat label="Carbohidratos" value={num(t.customCarbsGrams, ' g')} />
          <Stat label="Grasa" value={num(t.customFatGrams, ' g')} />
        </div>
      )}
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
        <p style={{ color: 'var(--text-secondary)' }}>Nada registrado ese día.</p>
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
                <span className="text-white">{num(log.kcal, ' kcal')}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-white">
            Total {num(totals.kcal, ' kcal')} · P {num(totals.protein, ' g')} · C{' '}
            {num(totals.carbs, ' g')} · G {num(totals.fat, ' g')}
          </p>
        </>
      )}
    </Section>
  );
}
