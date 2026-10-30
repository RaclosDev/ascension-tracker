import { useMemo, Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
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

const DashboardCharts = lazyWithRetry(() => import('../components/DashboardCharts'));

export default function DashboardPage() {
  const { pref, update: updateRatePref } = useRatePreference();

  // 1. Fetch data with React Query
  const { data: dashboard, isLoading: loadingDash } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const { data: weights = [], isLoading: loadingWeights } = useQuery<WeightEntry[]>({
    queryKey: ['weights'],
    queryFn: () => api.get('/weights').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const { data: weekSummaries = [], isLoading: loadingWeekly } = useQuery<WeekSummary[]>({
    queryKey: ['weekSummaries'],
    queryFn: () => api.get('/weights/weekly').then((res) => res.data),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const { data: settings, isLoading: loadingSettings } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

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

  // Memoized Chart data
  const weightChartData = useMemo(() => {
    return weights.map((w: WeightEntry) => ({
      date: w.date,
      weight: w.weight,
      label: format(new Date(w.date + 'T00:00:00'), 'd MMM', { locale: es }),
    }));
  }, [weights]);

  // Memoized Delta chart data
  const deltaData = useMemo(() => {
    return weekSummaries
      .filter((w: WeekSummary): w is WeekSummary & { delta: number } => w.delta !== null)
      .map((w) => ({
        week: format(new Date(w.weekStart + 'T00:00:00'), 'd MMM', { locale: es }),
        delta: w.delta,
        fill:
          w.delta <= 0
            ? 'var(--color-success-strong, rgba(52, 211, 153, 0.8))'
            : 'var(--color-fat-strong, rgba(248, 113, 113, 0.8))',
      }));
  }, [weekSummaries]);

  if (isLoading) {
    return (
      <div className="fade-in">
        <h1 className="sr-only">Inicio</h1>
        {/* Skeleton for Quick Add */}
        <div className="card glass-panel-elevated p-4 sm:p-5 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-10 w-full max-w-xs rounded-xl" />
          </div>
        </div>

        {/* Skeleton for KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card glass-panel-elevated p-3.5 sm:p-4 rounded-2xl">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Skeleton for Progress Bar */}
        <div className="card glass-panel-elevated p-4 sm:p-5 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full rounded-full mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Skeleton for Charts */}
        <DashboardChartsSkeleton />
      </div>
    );
  }

  if (!dashboard || !settings) return null;

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
      <h1 className="sr-only">Inicio</h1>
      {/* 1. Quick Add / Edit Weight Card */}
      <QuickWeightCard
        todayLabel={todayLabel}
        todayDateStr={todayDateStr}
        todayWeight={todayEntry?.weight}
        recentWeight={recentWeight}
        yesterdayWeight={yesterdayWeight}
        hasTodayWeight={hasTodayWeight}
      />

      {/* 2. Elevated KPI Grid */}
      <ElevatedKpiGrid
        currentWeight={dashboard.currentWeight}
        weeklyAverage={dashboard.currentWeeklyAverage}
        totalLost={dashboard.totalLost}
        remaining={dashboard.remaining}
        estimatedDate={effectiveEstimatedDate}
        avgWeeklyRate={effectiveRate}
        ratePref={pref}
        onRateChange={updateRatePref}
        weeklyGoal={settings.weeklyGoal}
      />

      {/* 3. Goal Progress Bar */}
      <GoalProgressBar
        progress={dashboard.progress}
        startWeight={settings.startWeight}
        goalWeight={settings.goalWeight}
        currentWeight={dashboard.currentWeight}
      />

      {/* 4. Charts */}
      <Suspense fallback={<DashboardChartsSkeleton />}>
        <DashboardCharts
          weightChartData={weightChartData}
          deltaData={deltaData}
          goalWeight={settings.goalWeight}
        />
      </Suspense>
    </div>
  );
}
