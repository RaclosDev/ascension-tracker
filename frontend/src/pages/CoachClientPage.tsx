import { Suspense, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ClipboardList,
  Dumbbell,
  Camera,
  Footprints,
  MessageSquareText,
  Scale,
  UserMinus,
  Utensils,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';
import {
  PERMISSION_LABELS,
  formatCoachDate,
  personName,
  apiErrorMessage,
  useClientCustomExercises,
  useClientData,
  useCoachClients,
  useEndClient,
  type CoachPermissions,
  type CoachTargets,
} from '../lib/coach/api';
import {
  useAssignProgram,
  useClientAssignments,
  useCoachPrograms,
  useEndAssignment,
} from '../lib/coach/coachPrograms';
import { useExerciseCatalog, getExerciseMap } from '../lib/workout/exercises';
import { ProgramSessions } from '../components/coach/ProgramSessions';
import { NutritionAdherenceSection } from '../components/coach/NutritionAdherenceSection';
import { NutritionPlanSection } from '../components/coach/NutritionPlanSection';
import { CheckinsSection } from '../components/coach/CheckinsSection';
import { PhotoGallery } from '../components/photos/PhotoGallery';
import type { PhotoList } from '../lib/progressPhotos';
import { ActivityHeatmap } from '../components/workout/heatmap';
import { BodyHeatmap } from '../components/workout/body-heatmap';
import { DashboardChartsSkeleton } from '../components/workout/skeletons/DashboardChartsSkeleton';
import { Skeleton } from '../components/ui/skeleton';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { toWeeklyDeltaData, toWeightChartData } from '../lib/weightCharts';
import { formatDay, formatKg, sessionVolume } from '../lib/workout/format';
import type { CompletedWorkout } from '../lib/workout/types';
import type { DashboardData, FoodLog, WeekSummary, WeightEntry } from '../types/api';

const DashboardCharts = lazyWithRetry(() => import('../components/DashboardCharts'));
const NutritionPieChart = lazyWithRetry(() => import('../components/nutrition/NutritionPieChart'));
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const numFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const num = (value: number | null | undefined, unit = '') =>
  value == null || !Number.isFinite(value) ? 'Sin datos' : `${numFmt.format(value)}${unit}`;

export default function CoachClientPage() {
  const { linkId = '' } = useParams();
  const clients = useCoachClients(true);
  const link = clients.data?.find((c) => c.linkId === linkId);

  return (
    <div className="fade-in coach-page">
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
          <header className="coach-client-header">
            <div className="min-w-0">
              <h1 className="coach-client-name">{personName(link.client)}</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Alumno desde {formatCoachDate(link.since)}
              </p>
              <ul className="coach-scopes" aria-label="Qué te comparte">
                {(Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[])
                  .filter((scope) => link.permissions[scope])
                  .map((scope) => (
                    <li key={scope} title={PERMISSION_LABELS[scope].detail}>
                      {PERMISSION_LABELS[scope].title}
                    </li>
                  ))}
              </ul>
            </div>
            <EndRelationButton linkId={linkId} name={personName(link.client)} />
          </header>
          <div className="flex flex-col gap-6">
            <Section title="Check-ins" icon={<MessageSquareText size={18} aria-hidden />}>
              <CheckinsSection linkId={linkId} />
            </Section>
            {link.permissions.body && <BodySection linkId={linkId} />}
            {link.permissions.training && (
              <ProgramsSection linkId={linkId} canAssign={link.permissions.editTraining} />
            )}
            {link.permissions.training && <TrainingSection linkId={linkId} />}
            {link.permissions.nutrition && (
              <NutritionSection linkId={linkId} canEditPlan={link.permissions.editNutrition} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EndRelationButton({ linkId, name }: { linkId: string; name: string }) {
  const end = useEndClient();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="btn btn-secondary coach-end"
      disabled={end.isPending}
      onClick={() => {
        if (!window.confirm(`¿Terminar la relación con ${name}? Dejarás de ver sus datos.`)) return;
        end.mutate(linkId, {
          onSuccess: () => navigate('/entrenador'),
          onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
        });
      }}
    >
      <UserMinus size={16} aria-hidden /> Terminar relación
    </button>
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
      <div className="text-lg font-bold text-foreground">{value}</div>
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
          <span className="text-foreground">{num(week.average, unit)}</span>
        </li>
      ))}
    </ul>
  );
}

function BodySection({ linkId }: { linkId: string }) {
  const dashboard = useClientData<DashboardData>(linkId, 'weights/dashboard', true);
  const entries = useClientData<WeightEntry[]>(linkId, 'weights', true);
  const weeks = useClientData<WeekSummary[]>(linkId, 'weights/weekly', true);
  const steps = useClientData<WeekSummary[]>(linkId, 'steps/weekly', true);
  const photos = useClientData<PhotoList>(linkId, 'progress-photos', true);
  const d = dashboard.data;
  const weightChartData = useMemo(() => toWeightChartData(entries.data ?? []), [entries.data]);
  const deltaData = useMemo(() => toWeeklyDeltaData(weeks.data ?? []), [weeks.data]);

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
        <QueryState
          isLoading={entries.isLoading || weeks.isLoading}
          isError={entries.isError || weeks.isError}
        />
        {entries.data?.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>Sin registros de peso.</p>
        )}
        {entries.data && entries.data.length > 0 && weeks.data && (
          <Suspense fallback={<DashboardChartsSkeleton />}>
            <DashboardCharts weightChartData={weightChartData} deltaData={deltaData} />
          </Suspense>
        )}
      </Section>
      <Section title="Pasos" icon={<Footprints size={18} aria-hidden />}>
        <QueryState isLoading={steps.isLoading} isError={steps.isError} />
        {steps.data && <WeeklyList weeks={steps.data} unit=" pasos/día" />}
      </Section>
      <Section title="Fotos de progreso" icon={<Camera size={18} aria-hidden />}>
        <QueryState isLoading={photos.isLoading} isError={photos.isError} />
        {photos.data?.photos.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>Tu alumno aún no ha subido fotos.</p>
        )}
        {photos.data && photos.data.photos.length > 0 && (
          <PhotoGallery photos={photos.data.photos} />
        )}
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

/** Programs assigned to this client; assigning needs the client's «Pautar entrenamiento». */
function ProgramsSection({ linkId, canAssign }: { linkId: string; canAssign: boolean }) {
  const assignments = useClientAssignments(linkId);
  const library = useCoachPrograms();
  const assign = useAssignProgram(linkId);
  const end = useEndAssignment(linkId);
  const [programId, setProgramId] = useState('');
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [openAssignment, setOpenAssignment] = useState<string | null>(null);
  const active = assignments.data?.find((a) => a.status === 'ACTIVE');
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exerciseMap = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const exerciseName = (id: string) => exerciseMap.get(id)?.name ?? 'Ejercicio';

  const submit = () => {
    if (!programId || !startDate) return;
    if (
      active &&
      !window.confirm(`Esto termina «${active.programName}». ¿Asignar el nuevo programa?`)
    )
      return;
    assign.mutate(
      { programId, startDate },
      {
        onSuccess: () => {
          setProgramId('');
          toast.success('Programa asignado');
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo asignar el programa')),
      },
    );
  };

  return (
    <Section title="Programa" icon={<ClipboardList size={18} aria-hidden />}>
      <QueryState isLoading={assignments.isLoading} isError={assignments.isError} />
      {assignments.data?.length === 0 && (
        <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
          Aún no le has asignado ningún programa.
        </p>
      )}
      {assignments.data && assignments.data.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {assignments.data.map((a) => (
            <li key={a.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate">{a.programName}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {a.weeks} {a.weeks === 1 ? 'semana' : 'semanas'} · empieza el{' '}
                    {formatCoachDate(a.startDate)}
                    {a.status === 'ENDED' &&
                      a.endedAt &&
                      ` · terminado el ${formatCoachDate(a.endedAt)}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    aria-expanded={openAssignment === a.id}
                    onClick={() => setOpenAssignment(openAssignment === a.id ? null : a.id)}
                  >
                    {openAssignment === a.id ? 'Ocultar sesiones' : 'Sesiones'}
                  </button>
                  {a.status === 'ACTIVE' && canAssign && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      aria-label={`Terminar ${a.programName}`}
                      disabled={end.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `¿Terminar «${a.programName}»? Tu alumno conserva su copia.`,
                          )
                        )
                          return;
                        end.mutate(a.id, {
                          onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar')),
                        });
                      }}
                    >
                      Terminar
                    </button>
                  )}
                </div>
              </div>
              {openAssignment === a.id && (
                <ProgramSessions linkId={linkId} assignmentId={a.id} exerciseName={exerciseName} />
              )}
            </li>
          ))}
        </ul>
      )}
      {!canAssign && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Para asignarle programas, tu alumno tiene que darte el permiso «Pautar entrenamiento» en
          sus ajustes.
        </p>
      )}
      {canAssign && library.data?.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Crea un programa en tu <Link to="/entrenador/programas">biblioteca</Link> para asignarlo.
        </p>
      )}
      {canAssign && library.data && library.data.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Programa
            <select value={programId} onChange={(e) => setProgramId(e.target.value)}>
              <option value="">Elige un programa</option>
              {library.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Empieza el
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!programId || !startDate || assign.isPending}
            onClick={submit}
          >
            Asignar
          </button>
        </div>
      )}
    </Section>
  );
}

function TrainingSection({ linkId }: { linkId: string }) {
  const history = useClientData<WorkoutPage>(linkId, 'workouts?page=0&size=10', true);
  const stats = useClientData<WorkoutStats>(linkId, 'workouts/stats', true);
  const [since] = useState(() => Date.now() - YEAR_MS);
  const recent = useClientData<CompletedWorkout[]>(linkId, `workouts/recent?since=${since}`, true);
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exerciseMap = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
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
      <QueryState isLoading={recent.isLoading} isError={recent.isError} />
      {recent.data && recent.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <ActivityHeatmap history={recent.data} />
          <BodyHeatmap history={recent.data} customExercises={custom.data ?? []} />
        </div>
      )}
      <h3 className="text-sm font-bold text-foreground mb-2">Últimos entrenamientos</h3>
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
              <span className="font-bold text-foreground">{workout.name || 'Entrenamiento'}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatDay(workout.startedAt)}</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {(workout.exercises ?? [])
                .map((ex) => exerciseMap.get(ex.exerciseId)?.name ?? 'Ejercicio')
                .join(' · ')}
            </div>
            <div className="text-sm text-foreground">
              Volumen {formatKg(sessionVolume(workout.exercises ?? []))}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NutritionSection({ linkId, canEditPlan }: { linkId: string; canEditPlan: boolean }) {
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
      <h3 className="font-semibold text-foreground mt-6 mb-2">Sus objetivos y registro</h3>
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
                <span className="text-foreground">{num(log.kcal, ' kcal')}</span>
              </li>
            ))}
          </ul>
          <div className="mx-auto mb-2" style={{ width: '100%', maxWidth: 300, height: 250 }}>
            <Suspense fallback={<Skeleton className="w-48 h-48 rounded-full mx-auto" />}>
              <NutritionPieChart pieData={macroPieData(totals, t?.kcal)} />
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
function macroPieData(
  totals: { kcal: number; protein: number; carbs: number; fat: number },
  targetKcal: number | null | undefined,
) {
  return [
    { name: 'Proteínas', value: totals.protein * 4, color: 'var(--color-protein)' },
    { name: 'Hidratos', value: totals.carbs * 4, color: 'var(--color-carbs)' },
    { name: 'Grasas', value: totals.fat * 9, color: 'var(--color-fat)' },
    {
      name: 'Calorías restantes',
      value: Math.max(0, (targetKcal ?? 0) - totals.kcal),
      color: 'rgba(255,255,255,0.05)',
    },
  ];
}
