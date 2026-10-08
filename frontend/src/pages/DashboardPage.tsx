import { useState, useEffect } from 'react';
import { DashboardData, WeightEntry, WeekSummary, UserSettings } from '../types/api';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const DashboardCharts = lazy(() => import('../components/DashboardCharts'));
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseSafeWeight } from '../utils/weightHelper';
import { Skeleton } from '../components/ui/skeleton';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [quickWeight, setQuickWeight] = useState('');

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

  useEffect(() => {
    if (todayEntry && quickWeight === '') {
      setQuickWeight(todayEntry.weight.toString());
    }
  }, [todayEntry, quickWeight]);

  // 2. Mutations with React Query
  const addWeightMutation = useMutation({
    mutationFn: (val: number) => api.post('/weights', { date: todayDateStr, weight: val }),
    onSuccess: (_, val) => {
      toast.success(hasTodayWeight ? `Peso actualizado: ${val} kg` : `Peso registrado: ${val} kg`);
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      // Delay invalidation for dashboard and weekly to prevent UI thrashing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
      }, 500);
    },
    onError: (err: Error) => {
      console.error('Error al guardar peso:', err);
      const e = err as Error & { response?: { data?: { message?: string; error?: string } } };
      const msg = e.response?.data?.message || e.response?.data?.error || e.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al registrar peso');
    },
  });

  const handleQuickAdd = () => {
    const val = parseSafeWeight(quickWeight);
    if (val === null) {
      toast.error('Introduce un peso válido en kg (ej: 80.5)');
      return;
    }
    addWeightMutation.mutate(val);
  };

  if (isLoading) {
    return (
      <div className="fade-in">
        {/* Skeleton for Quick Add */}
        <div className="quick-add-card">
          <div className="quick-add-header">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="quick-add-body">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Skeleton for KPI Grid */}
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Skeleton for Progress Bar */}
        <div className="progress-section">
          <div className="progress-card">
            <div className="progress-info mb-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <div className="progress-markers">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>

        {/* Skeleton for Charts */}
        <div className="charts-grid">
          <div className="chart-card full-width">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="chart-card">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard || !settings) return null;

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayLabel = `${dayNames[today.getDay()]}, ${format(today, "d 'de' MMMM 'de' yyyy", { locale: es })}`;

  // Chart data
  const weightChartData = weights.map((w: WeightEntry) => ({
    date: w.date,
    weight: w.weight,
    label: format(new Date(w.date + 'T00:00:00'), 'd MMM', { locale: es }),
  }));

  // Delta chart data
  const deltaData = weekSummaries
    .filter((w: WeekSummary): w is WeekSummary & { delta: number } => w.delta !== null)
    .map((w) => ({
      week: format(new Date(w.weekStart + 'T00:00:00'), 'd MMM', { locale: es }),
      delta: w.delta,
      fill:
        w.delta <= 0
          ? 'var(--color-success-strong, rgba(52, 211, 153, 0.8))'
          : 'var(--color-fat-strong, rgba(248, 113, 113, 0.8))',
    }));

  return (
    <div className="fade-in">
      {/* Quick Add / Edit Bar */}
      <div className="quick-add-card">
        <div className="quick-add-header">
          <div className="flex items-center gap-2">
            <span className="quick-add-title">Peso hoy</span>
          </div>
          <span className="quick-add-date">{todayLabel}</span>
        </div>
        <div className="quick-add-body">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            className="quick-add-input"
            value={quickWeight}
            onChange={(e) => setQuickWeight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            placeholder={hasTodayWeight && todayEntry ? todayEntry.weight.toString() : '00.00'}
          />
          <button
            className={`btn ${hasTodayWeight ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleQuickAdd}
          >
            {hasTodayWeight ? 'Actualizar' : 'Registrar'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label"> Peso Actual</div>
          <div className="kpi-value">{dashboard.currentWeight?.toFixed(2)} kg</div>
          <div className="kpi-detail">
            Media semanal: {dashboard.currentWeeklyAverage?.toFixed(2)} kg
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"> Total Perdido</div>
          <div className="kpi-value">{dashboard.totalLost?.toFixed(2)} kg</div>
          <div className="kpi-detail">
            {dashboard.totalLost < 0 ? (
              <span className="kpi-badge positive">
                {' '}
                {Math.abs(dashboard.totalLost).toFixed(1)} kg perdidos
              </span>
            ) : (
              <span className="kpi-badge negative">
                {' '}
                {dashboard.totalLost?.toFixed(1)} kg ganados
              </span>
            )}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"> Te Falta</div>
          <div className="kpi-value">{dashboard.remaining?.toFixed(1)} kg</div>
          <div className="kpi-detail">
            {dashboard.remaining > 0 ? 'por perder' : '¡Meta alcanzada!'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"> Fecha Estimada</div>
          <div className="kpi-value" style={{ fontSize: '1.15rem' }}>
            {dashboard.estimatedDate}
          </div>
          <div className="kpi-detail">
            A ritmo de {Math.abs(dashboard.avgWeeklyChange).toFixed(2)} kg/semana
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-info">
            <span className="progress-label">Progreso hacia tu meta</span>
            <span className="progress-pct">{dashboard.progress?.toFixed(1)}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${dashboard.progress}%` }} />
          </div>
          <div className="progress-markers">
            <span>{settings.startWeight} kg</span>
            <span>{settings.goalWeight} kg</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <Suspense
        fallback={
          <div className="charts-grid">
            <Skeleton style={{ height: 300, borderRadius: 16 }} />
            <Skeleton style={{ height: 300, borderRadius: 16 }} />
          </div>
        }
      >
        <DashboardCharts
          weightChartData={weightChartData}
          deltaData={deltaData}
          goalWeight={settings.goalWeight}
        />
      </Suspense>
    </div>
  );
}
