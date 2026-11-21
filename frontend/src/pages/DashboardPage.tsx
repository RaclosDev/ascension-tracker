import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useMemo, Suspense, type ComponentProps } from 'react';
import type * as Charts from '../components/dashboard/WeightCharts';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { toWeeklyDeltaData, toWeightChartData } from '../lib/weightCharts';
import { DashboardData, WeightEntry, WeekSummary, UserSettings } from '../types/api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '../components/ui/skeleton';
import { DashboardChartsSkeleton } from '../components/workout/skeletons/DashboardChartsSkeleton';
import { QuickWeightCard } from '../components/dashboard/QuickWeightCard';
import { GoalTrack } from '../components/dashboard/GoalTrack';
import { RatePicker } from '../components/dashboard/RatePicker';
import { useRatePreference, calcEstimatedDate, formatEstimate } from '../hooks/useRatePreference';
import { hasBodyTracking, hasNutrition } from '../lib/appModules';
import { PowerliftingCard } from '../components/workout/PowerliftingCard';
import { TodayCard } from '../components/dashboard/TodayCard';
import { useMyCoaches } from '../lib/coach/api';
import '../styles/athlete-home.css';

const WeightTrendChart = lazyWithRetry<ComponentProps<typeof Charts.WeightTrendChart>>(() =>
  import('../components/dashboard/WeightCharts').then((m) => ({ default: m.WeightTrendChart })),
);
const WeeklyChangeChart = lazyWithRetry<ComponentProps<typeof Charts.WeeklyChangeChart>>(() =>
  import('../components/dashboard/WeightCharts').then((m) => ({ default: m.WeeklyChangeChart })),
);

const signed = (n: number, digits = 1) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;

export default function DashboardPage() {
  const { pref, update: updateRatePref } = useRatePreference();
  const coaches = useMyCoaches();
  const powerlifting =
    coaches.data?.some((coach) => coach.powerliftingEnabled && coach.permissions.training) ?? false;
  const performance =
    coaches.data?.some(
      (coach) =>
        ['PERFORMANCE', 'GENERAL'].includes(coach.setup?.goalFocus ?? '') ||
        (coach.powerliftingEnabled && coach.setup?.services.nutrition === false),
    ) ?? false;
  const maintenance = coaches.data?.some((coach) => coach.setup?.goalFocus === 'MAINTAIN') ?? false;

  const {
    data: dashboard,
    isLoading: loadingDash,
    isError: errorDash,
    isFetching: fetchingDash,
    refetch: refetchDash,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/weights/dashboard').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const {
    data: weights = [],
    isLoading: loadingWeights,
    isError: errorWeights,
    isFetching: fetchingWeights,
    refetch: refetchWeights,
  } = useQuery<WeightEntry[]>({
    queryKey: ['weights'],
    queryFn: () => api.get<WeightEntry[]>('/weights').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const {
    data: weekSummaries = [],
    isLoading: loadingWeekly,
    isError: errorWeekly,
    isFetching: fetchingWeekly,
    refetch: refetchWeekly,
  } = useQuery<WeekSummary[]>({
    queryKey: ['weekSummaries'],
    queryFn: () => api.get<WeekSummary[]>('/weights/weekly').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const {
    data: settings,
    isLoading: loadingSettings,
    isError: errorSettings,
    isFetching: fetchingSettings,
    refetch: refetchSettings,
  } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get<UserSettings>('/settings').then((res) => res.data),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  const hasError = errorDash || errorWeights || errorWeekly || errorSettings;
  const isFetching = fetchingDash || fetchingWeights || fetchingWeekly || fetchingSettings;
  const retry = () => {
    void Promise.all([refetchDash(), refetchWeights(), refetchWeekly(), refetchSettings()]);
  };

  const isLoading = loadingDash || loadingWeights || loadingWeekly || loadingSettings;

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const todayEntry = weights.find((w: WeightEntry) => w.date === todayDateStr);
  const hasTodayWeight = !!todayEntry;
  const recentWeight =
    weights.length > 0 ? weights[weights.length - 1].weight : settings?.startWeight;

  // Previous day weight (last entry that is not today)
  const yesterdayWeight = weights.filter((w: WeightEntry) => w.date < todayDateStr).at(-1)?.weight;

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayLabel = `${dayNames[today.getDay()]}, ${format(today, "d 'de' MMMM 'de' yyyy", { locale: es })}`;

  const weightChartData = useMemo(() => toWeightChartData(weights), [weights]);
  const deltaData = useMemo(() => toWeeklyDeltaData(weekSummaries), [weekSummaries]);

  if (isLoading) {
    return (
      <div className="fade-in home">
        <h1 className="page-title-desktop">Inicio</h1>
        <div className="card home-hero">
          <div className="home-hero-side">
            <Skeleton className="h-4 w-28 mb-4" />
            <Skeleton className="h-14 w-full mb-6" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="home-hero-chart">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const showNutrition = settings ? hasNutrition(settings.appModules) : false;

  // Sin el módulo de peso y medidas, el inicio se centra en el entreno en vez de pedir el peso.
  if (
    settings &&
    (!hasBodyTracking(settings.appModules) ||
      settings.weeklyGoal === 0 ||
      settings.startWeight === settings.goalWeight ||
      performance ||
      maintenance)
  ) {
    return (
      <div className="fade-in">
        <h1 className="page-title-desktop">Inicio</h1>
        <div className="dashboard-focus">
          <aside className="dashboard-today" aria-label="Plan de hoy">
            <TodayCard showNutrition={showNutrition} />
          </aside>
          <div className="dashboard-focus-main">
            {coaches.data
              ?.filter((coach) => coach.setup?.goal)
              .map((coach) => (
                <section key={coach.linkId} className="card">
                  <h2>Objetivo acordado</h2>
                  <p>{coach.setup?.goal}</p>
                </section>
              ))}
            {powerlifting && <PowerliftingCard />}
            {hasBodyTracking(settings.appModules) && (
              <>
                <section className="card">
                  <h2>{performance ? 'Seguimiento del peso' : 'Mantenimiento del peso'}</h2>
                  <p>
                    {dashboard?.currentWeeklyAverage
                      ? `Media semanal: ${dashboard.currentWeeklyAverage.toFixed(1)} kg.`
                      : 'Aún no hay registros suficientes para una media semanal.'}
                  </p>
                  <p className="text-sm">
                    Referencia personal: {settings.goalWeight} kg.{' '}
                    {performance
                      ? 'El peso acompaña al seguimiento del rendimiento.'
                      : 'Sin un objetivo semanal de ganancia o pérdida; no hay porcentaje de progreso ni fecha de llegada.'}
                  </p>
                </section>
                <details className="card">
                  <summary className="cursor-pointer">Registrar peso y consultar evolución</summary>
                  <QuickWeightCard
                    todayLabel={todayLabel}
                    todayDateStr={todayDateStr}
                    todayWeight={todayEntry?.weight}
                    recentWeight={recentWeight}
                    yesterdayWeight={yesterdayWeight}
                    hasTodayWeight={hasTodayWeight}
                  />
                  <Suspense fallback={<DashboardChartsSkeleton />}>
                    <WeightTrendChart data={weightChartData} height={260} />
                    <WeeklyChangeChart data={deltaData} />
                  </Suspense>
                </details>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard || !settings) return <QueryErrorNotice retry={retry} pending={isFetching} />;

  const gaining = settings.goalWeight > settings.startWeight;
  const historyRate = Math.abs(dashboard.avgWeeklyChange ?? 0);
  const effectiveRate =
    pref.mode === 'goal'
      ? Math.abs(settings.weeklyGoal ?? 0.5)
      : pref.mode === 'custom'
        ? Math.abs(pref.customRate)
        : historyRate;
  // The backend says «--» when the real pace goes away from the goal; otherwise every mode is
  // projected here so the date always reads the same way.
  const arrival =
    pref.mode === 'history' && dashboard.estimatedDate === '--'
      ? ''
      : formatEstimate(
          calcEstimatedDate(dashboard.currentWeight, settings.goalWeight, effectiveRate),
        );
  const change = dashboard.totalLost;
  const pace = dashboard.avgWeeklyChange ?? 0;

  return (
    <div className="fade-in home">
      {hasError && <QueryErrorNotice retry={retry} pending={isFetching} />}
      <h1 className="page-title-desktop">Inicio</h1>

      <section className="card home-hero" aria-label="Peso">
        <div className="home-hero-side">
          <QuickWeightCard
            variant="hero"
            gaining={gaining}
            todayLabel={todayLabel}
            todayDateStr={todayDateStr}
            todayWeight={todayEntry?.weight}
            recentWeight={recentWeight}
            yesterdayWeight={yesterdayWeight}
            hasTodayWeight={hasTodayWeight}
          />
          <GoalTrack
            start={settings.startWeight}
            current={dashboard.currentWeight}
            goal={settings.goalWeight}
            arrival={arrival}
            pace={
              <RatePicker
                rate={effectiveRate}
                pref={pref}
                onChange={updateRatePref}
                weeklyGoal={settings.weeklyGoal}
              />
            }
          />
        </div>
        <div className="home-hero-chart">
          <Suspense fallback={<Skeleton className="h-[340px] w-full" />}>
            <WeightTrendChart
              data={weightChartData}
              goalWeight={settings.goalWeight}
              height={300}
            />
          </Suspense>
        </div>
      </section>

      <dl className="card home-stats">
        <div className="home-stat">
          <dt>Media 7 días</dt>
          <dd className="tabular-nums">
            {dashboard.currentWeeklyAverage ? dashboard.currentWeeklyAverage.toFixed(1) : '—'}
            <small>kg</small>
          </dd>
        </div>
        <div className="home-stat">
          <dt>Desde el inicio</dt>
          <dd
            className="tabular-nums"
            data-tone={(gaining ? change > 0 : change < 0) ? 'good' : undefined}
          >
            {signed(change)}
            <small>kg</small>
          </dd>
        </div>
        <div className="home-stat">
          <dt>Ritmo medio</dt>
          <dd className="tabular-nums">
            {signed(pace, 2)}
            <small>kg/sem</small>
          </dd>
        </div>
        <div className="home-stat">
          <dt>Racha de registro</dt>
          <dd className="tabular-nums">
            {dashboard.streak}
            <small>{dashboard.streak === 1 ? 'día' : 'días'}</small>
          </dd>
        </div>
      </dl>

      <div className="home-lower">
        <section className="card home-change">
          <Suspense fallback={<Skeleton className="h-[240px] w-full" />}>
            <WeeklyChangeChart data={deltaData} gaining={gaining} />
          </Suspense>
        </section>
        <aside className="home-today" aria-label="Plan de hoy">
          <TodayCard showNutrition={showNutrition} />
        </aside>
      </div>
    </div>
  );
}
