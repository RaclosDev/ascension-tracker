import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseSafeWeight } from '../utils/weightHelper';
import { Skeleton } from '../components/ui/skeleton';
import { DayData, WeekData, TrackingModalData } from '../types/tracking';
import {
  DAY_NAMES,
  WEIGHT_DELTAS,
  STEPS_DELTAS,
  getMondayStr,
  mergeWeeksData,
} from '../utils/trackingHelpers';
import { TrackingMetricToggle } from '../components/tracking/TrackingMetricToggle';
import { TrackingDayCell } from '../components/tracking/TrackingDayCell';
import { TrackingWeeklyStats } from '../components/tracking/TrackingWeeklyStats';
import { TrackingEntryModal } from '../components/tracking/TrackingEntryModal';

const getInitialMetricVisibility = (key: string): boolean => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
};

const setMetricVisibility = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in restricted contexts
  }
};

export default function TrackingPage() {
  const queryClient = useQueryClient();
  const [showWeight, setShowWeight] = useState<boolean>(() =>
    getInitialMetricVisibility('tracking_showWeight'),
  );
  const [showSteps, setShowSteps] = useState<boolean>(() =>
    getInitialMetricVisibility('tracking_showSteps'),
  );
  const [showCalories, setShowCalories] = useState<boolean>(() =>
    getInitialMetricVisibility('tracking_showCalories'),
  );

  useEffect(() => {
    setMetricVisibility('tracking_showWeight', showWeight);
  }, [showWeight]);
  useEffect(() => {
    setMetricVisibility('tracking_showSteps', showSteps);
  }, [showSteps]);
  useEffect(() => {
    setMetricVisibility('tracking_showCalories', showCalories);
  }, [showCalories]);

  const [modalData, setModalData] = useState<TrackingModalData | null>(null);
  const [modalWeight, setModalWeight] = useState('');
  const [modalSteps, setModalSteps] = useState('');

  const {
    data: weeks = [],
    isLoading,
    refetch: fetchData,
  } = useQuery<WeekData[]>({
    queryKey: ['trackingWeeks'],
    queryFn: async () => {
      const [weightsRes, stepsRes, caloriesRes] = await Promise.all([
        api.get('/weights/weekly').catch(() => ({ data: [] })),
        api.get('/steps/weekly').catch(() => ({ data: [] })),
        api.get('/nutrition/calories/weekly').catch(() => ({ data: [] })),
      ]);
      return mergeWeeksData(weightsRes.data, stepsRes.data, caloriesRes.data);
    },
  });

  const handleOpenDayModal = ({
    dateStr,
    dayName,
    dayData,
  }: {
    dateStr: string;
    dayName: string;
    dayData: DayData;
  }) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    setModalData({
      dateStr,
      dayName,
      dayData,
      fullLabel: format(dateObj, "EEEE d 'de' MMMM", { locale: es }),
    });
    setModalWeight(dayData.weight !== null ? dayData.weight.toString() : '');
    setModalSteps(dayData.steps !== null ? dayData.steps.toString() : '');
  };

  const handleModalSave = async () => {
    if (!modalData) return;
    const { dateStr, dayData: currentData } = modalData;

    try {
      let changed = false;
      const wVal = parseSafeWeight(modalWeight);
      if (modalWeight === '' && currentData.weight !== null) {
        await api.delete(`/weights/${dateStr}`);
        changed = true;
      } else if (wVal !== null && wVal !== currentData.weight) {
        await api.post('/weights', { date: dateStr, weight: wVal });
        changed = true;
      }

      const sVal = modalSteps === '' ? null : parseInt(modalSteps, 10);
      if (modalSteps === '' && currentData.steps !== null) {
        await api.delete(`/steps/${dateStr}`);
        changed = true;
      } else if (sVal !== null && !isNaN(sVal) && sVal !== currentData.steps) {
        await api.post('/steps', { date: dateStr, steps: sVal });
        changed = true;
      }

      if (changed) {
        toast.success('Registros guardados');
        await fetchData();
        queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
      setModalData(null);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Error al guardar',
      );
    }
  };

  const handleModalDelete = async () => {
    if (!modalData) return;
    try {
      if (modalData.dayData.weight !== null) await api.delete(`/weights/${modalData.dateStr}`);
      if (modalData.dayData.steps !== null) await api.delete(`/steps/${modalData.dateStr}`);
      await fetchData();
      queryClient.invalidateQueries({ queryKey: ['trackingWeeks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Registros eliminados');
      setModalData(null);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Error al eliminar',
      );
    }
  };

  const handleDeltaAdjust = (metric: 'weight' | 'steps', delta: number) => {
    if (metric === 'weight') {
      const normalized = modalWeight.replace(',', '.');
      let current = parseFloat(normalized);
      if (isNaN(current)) current = 75;
      const nextWeight = Math.max(0, Math.round((current + delta) * 100) / 100);
      setModalWeight(nextWeight.toFixed(2));
    } else if (metric === 'steps') {
      let current = parseInt(modalSteps, 10);
      if (isNaN(current)) current = 5000;
      setModalSteps(Math.max(0, Math.round(current + delta)).toString());
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentMonday = getMondayStr();

  if (isLoading && weeks.length === 0) {
    return (
      <div className="fade-in">
        <div
          style={{
            display: 'flex',
            gap: '0.3rem',
            marginBottom: 'var(--space-xl)',
            padding: '0.35rem',
          }}
        >
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="calendar-container">
          {[1, 2, 3].map((i) => (
            <div key={i} className="calendar-week">
              <div className="calendar-week-header">
                <Skeleton className="h-6 w-32" />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="calendar-grid">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div key={d} className="calendar-day" style={{ padding: '0.5rem' }}>
                    <Skeleton className="h-4 w-6 mb-2 mx-auto" />
                    <Skeleton className="h-6 w-full mb-1" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <TrackingMetricToggle
        showWeight={showWeight}
        showSteps={showSteps}
        showCalories={showCalories}
        onToggleWeight={() => setShowWeight(!showWeight)}
        onToggleSteps={() => setShowSteps(!showSteps)}
        onToggleCalories={() => setShowCalories(!showCalories)}
      />

      <div
        className="calendar-container"
        style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}
      >
        {[...weeks].reverse().map((week) => {
          const isCurrentWeek = week.weekStart === currentMonday;
          return (
            <div key={week.weekStart} className="calendar-week">
              <div className="calendar-week-header">
                <div className="calendar-week-title">
                  {format(new Date(week.weekStart + 'T00:00:00'), 'd MMM', { locale: es })}
                  {isCurrentWeek && <span className="current-week-label"> ACTUAL</span>}
                </div>
                <TrackingWeeklyStats
                  week={week}
                  showWeight={showWeight}
                  showSteps={showSteps}
                  showCalories={showCalories}
                />
              </div>

              <div className="calendar-grid">
                {week.days.map((dayData: DayData, d: number) => {
                  const date = new Date(week.weekStart + 'T00:00:00');
                  date.setDate(date.getDate() + d);
                  const dateStr = format(date, 'yyyy-MM-dd');

                  return (
                    <TrackingDayCell
                      key={dateStr}
                      dateStr={dateStr}
                      dayName={DAY_NAMES[d]}
                      dayData={dayData}
                      isToday={dateStr === todayStr}
                      onOpenModal={handleOpenDayModal}
                      showWeight={showWeight}
                      showSteps={showSteps}
                      showCalories={showCalories}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        {weeks.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No hay datos registrados aún.
          </div>
        )}
      </div>

      <TrackingEntryModal
        modalData={modalData}
        modalWeight={modalWeight}
        modalSteps={modalSteps}
        weightDeltas={WEIGHT_DELTAS}
        stepsDeltas={STEPS_DELTAS}
        onWeightChange={setModalWeight}
        onStepsChange={setModalSteps}
        onDeltaAdjust={handleDeltaAdjust}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        onClose={() => setModalData(null)}
      />
    </div>
  );
}
