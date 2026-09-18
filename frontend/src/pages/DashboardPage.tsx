import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseSafeWeight } from '../utils/weightHelper';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [quickWeight, setQuickWeight] = useState('');

  // 1. Fetch data with React Query
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then(res => res.data)
  });

  const { data: weights = [], isLoading: loadingWeights } = useQuery({
    queryKey: ['weights'],
    queryFn: () => api.get('/weights').then(res => res.data)
  });

  const { data: weekSummaries = [], isLoading: loadingWeekly } = useQuery({
    queryKey: ['weekSummaries'],
    queryFn: () => api.get('/weights/weekly').then(res => res.data)
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(res => res.data)
  });

  const isLoading = loadingDash || loadingWeights || loadingWeekly || loadingSettings;

  const today = new Date();
  const todayDateStr = format(today, 'yyyy-MM-dd');
  const todayEntry = weights.find((w: any) => w.date === todayDateStr);
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
    },
    onError: (err: any) => {
      console.error('Error al guardar peso:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al registrar peso');
    }
  });

  const handleQuickAdd = () => {
    const val = parseSafeWeight(quickWeight);
    if (val === null) {
      toast.error('Introduce un peso válido en kg (ej: 80.5)');
      return;
    }
    addWeightMutation.mutate(val);
  };

  if (isLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!dashboard || !settings) return null;

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const todayLabel = `${dayNames[today.getDay()]}, ${format(today, "d 'de' MMMM 'de' yyyy", { locale: es })}`;

  // Chart data
  const weightChartData = weights.map(w => ({
    date: w.date,
    weight: w.weight,
    label: format(new Date(w.date + 'T00:00:00'), 'd MMM', { locale: es }),
  }));

  // Weekly averages for the chart
  const avgChartData = weekSummaries
    .filter(w => w.average !== null)
    .map(w => ({
      date: w.weekStart,
      average: w.average,
    }));

  // Delta chart data
  const deltaData = weekSummaries
    .filter(w => w.delta !== null)
    .map(w => ({
      week: format(new Date(w.weekStart + 'T00:00:00'), 'd MMM', { locale: es }),
      delta: w.delta,
      fill: w.delta <= 0 ? 'var(--color-success-strong, rgba(52, 211, 153, 0.8))' : 'var(--color-fat-strong, rgba(248, 113, 113, 0.8))',
    }));

  return (
    <div className="fade-in">

      {/* Quick Add / Edit Bar */}
      <div className="quick-add-card">
        <div className="quick-add-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="quick-add-title">
              Peso hoy
            </span>
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
            onChange={e => setQuickWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            placeholder={hasTodayWeight && todayEntry ? todayEntry.weight.toString() : "00.00"}
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
        <div className="kpi-card accent">
          <div className="kpi-label"> Peso Actual</div>
          <div className="kpi-value accent">{dashboard.currentWeight?.toFixed(2)} kg</div>
          <div className="kpi-detail">Media semanal: {dashboard.currentWeeklyAverage?.toFixed(2)} kg</div>
        </div>
        <div className="kpi-card accent">
          <div className="kpi-label"> Total Perdido</div>
          <div className="kpi-value accent">{dashboard.totalLost?.toFixed(2)} kg</div>
          <div className="kpi-detail">
            {dashboard.totalLost < 0 ? (
              <span className="kpi-badge positive"> {Math.abs(dashboard.totalLost).toFixed(1)} kg perdidos</span>
            ) : (
              <span className="kpi-badge negative"> {dashboard.totalLost?.toFixed(1)} kg ganados</span>
            )}
          </div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-label"> Te Falta</div>
          <div className="kpi-value info">{dashboard.remaining?.toFixed(1)} kg</div>
          <div className="kpi-detail">{dashboard.remaining > 0 ? 'por perder' : '¡Meta alcanzada!'}</div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-label"> Fecha Estimada</div>
          <div className="kpi-value info" style={{ fontSize: '1.15rem' }}>{dashboard.estimatedDate}</div>
          <div className="kpi-detail">A ritmo de {Math.abs(dashboard.avgWeeklyChange).toFixed(2)} kg/semana</div>
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
      <div className="charts-grid">
        {/* Weight Evolution Chart */}
        <div className="chart-card full-width">
          <div className="chart-title"> Evolución de Peso</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis width={40} tick={{ fill: '#64748b', fontSize: 11 }} domain={[dataMin => Math.floor(dataMin), dataMax => Math.ceil(dataMax)]} tickFormatter={v => `${v}`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(10, 12, 15, 0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                  labelStyle={{ color: '#F4F5F7' }}
                  itemStyle={{ color: '#9BA3AF' }}
                  formatter={v => [`${v.toFixed(2)} kg`, 'Peso']}
                />
                <ReferenceLine y={settings.goalWeight} stroke="rgba(52, 211, 153, 0.5)" strokeDasharray="8 4" label={{ value: 'Obj.', fill: 'var(--color-success)', fontSize: 12, position: 'insideTopLeft' }} />
                <Area type="monotone" dataKey="weight" stroke="var(--accent-primary)" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 3, fill: 'var(--accent-primary)' }} activeDot={{ r: 6, fill: 'var(--accent-primary-light)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delta Chart */}
        <div className="chart-card">
          <div className="chart-title"> Variación Semanal (Δ)</div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deltaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis width={40} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}`} />
                <Tooltip
                  labelStyle={{ color: '#F4F5F7' }}
                  itemStyle={{ color: '#9BA3AF' }}
                  contentStyle={{ background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={v => [`${v > 0 ? '+' : ''}${v.toFixed(2)} kg`, 'Variación']}
                />
                <Bar dataKey="delta" radius={[6, 6, 0, 0]}>
                  {deltaData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}



