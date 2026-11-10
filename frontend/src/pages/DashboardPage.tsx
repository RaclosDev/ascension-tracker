import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useMemo, Suspense } from 'react';
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
import { ElevatedKpiGrid } from '../components/dashboard/ElevatedKpiGrid';
import { GoalProgressBar } from '../components/dashboard/GoalProgressBar';
import { useRatePreference, calcEstimatedDate } from '../hooks/useRatePreference';
import { hasBodyTracking, hasNutrition } from '../lib/appModules';
import { PowerliftingCard } from '../components/workout/PowerliftingCard';
import { TodayCard } from '../components/dashboard/TodayCard';

const DashboardCharts = lazyWithRetry(() => import('../components/DashboardCharts'));

export default function DashboardPage() {
  const { pref, update: updateRatePref } = useRatePreference();

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
      <div className="fade-in">
        <h1 className="page-title-desktop">Inicio</h1>
        <div className="dashboard-grid">
          <div className="card p-4 mb-5" style={{ gridArea: 'weight' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-11 w-48" />
            </div>
          </div>
          <div className="card p-4 mb-5" style={{ gridArea: 'today' }}>
            <Skeleton className="h-3 w-12 mb-4" />
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div style={{ gridArea: 'stats' }}>
            <div className="card grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-7 w-24" />
                </div>
              ))}
            </div>
            <DashboardChartsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const showNutrition = settings ? hasNutrition(settings.appModules) : false;

  // Sin el módulo de peso y medidas, el inicio se centra en el entreno en vez de pedir el peso.
  if (settings && !hasBodyTracking(settings.appModules)) {
    return (
      <div className="fade-in">
        <h1 className="page-title-desktop">Inicio</h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {todayLabel}
        </p>
        <div className="dashboard-grid">
          <div className="dashboard-today" style={{ gridArea: 'today' }}>
            <TodayCard showNutrition={showNutrition} />
          </div>
          <div style={{ gridArea: 'stats' }}>
            <PowerliftingCard />
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard || !settings) return <QueryErrorNotice retry={retry} pending={isFetching} />;

  // Effective rate based on user preference
  const historyRate = Math.abs(dashboard.avgWeeklyChange ?? 0);
  const effectiveRate =
    pref.mode === 'goal'
      ? Math.abs(settings.weeklyGoal ?? 0.5)
      : pref.mode === 'custom'
        ? Math.abs(pref.customRate)
        : historyRate;

  const effectiveEstimatedDate =
    pref.mode === 'history'
      ? dashboard.estimatedDate
      : calcEstimatedDate(dashboard.currentWeight, settings.goalWeight, effectiveRate);

  return (
    <div className="fade-in">
      {hasError && <QueryErrorNotice retry={retry} pending={isFetching} />}
      <h1 className="page-title-desktop">Inicio</h1>
      <div className="dashboard-grid">
        <div style={{ gridArea: 'weight' }}>
          <QuickWeightCard
            todayLabel={todayLabel}
            todayDateStr={todayDateStr}
            todayWeight={todayEntry?.weight}
            recentWeight={recentWeight}
            yesterdayWeight={yesterdayWeight}
            hasTodayWeight={hasTodayWeight}
          />
        </div>

        <aside className="dashboard-today" style={{ gridArea: 'today' }} aria-label="Plan de hoy">
          <TodayCard showNutrition={showNutrition} />
        </aside>

        <div style={{ gridArea: 'stats' }} className="min-w-0">
          <ElevatedKpiGrid
            weeklyAverage={dashboard.currentWeeklyAverage}
            totalLost={dashboard.totalLost}
            remaining={dashboard.remaining}
            estimatedDate={effectiveEstimatedDate}
            avgWeeklyRate={effectiveRate}
            ratePref={pref}
            onRateChange={updateRatePref}
            weeklyGoal={settings.weeklyGoal}
          />

          <GoalProgressBar
            progress={dashboard.progress}
            startWeight={settings.startWeight}
            goalWeight={settings.goalWeight}
            currentWeight={dashboard.currentWeight}
          />

          <Suspense fallback={<DashboardChartsSkeleton />}>
            <DashboardCharts
              weightChartData={weightChartData}
              deltaData={deltaData}
              goalWeight={settings.goalWeight}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
