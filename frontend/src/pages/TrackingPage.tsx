import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { applyTrackingChanges, parseTrackingInputs } from '../utils/trackingMutations';
import { Skeleton } from '../components/ui/skeleton';
import { DayData, WeekData, TrackingModalData, WeeklyMetricResponse } from '../types/tracking';
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
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  const {
    data: weeks = [],
    isLoading,
    isError,
    isFetching,
    refetch: fetchData,
  } = useQuery<WeekData[]>({
    queryKey: ['trackingWeeks'],
    queryFn: async () => {
      const [weightsRes, stepsRes, caloriesRes] = await Promise.all([
        api.get<WeeklyMetricResponse[]>('/weights/weekly'),
        api.get<WeeklyMetricResponse[]>('/steps/weekly'),
        api.get<WeeklyMetricResponse[]>('/nutrition/calories/weekly'),
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

  const saveModalChanges = async (deleting: boolean) => {
    if (!modalData || savingRef.current) return;
    let next: Pick<DayData, 'weight' | 'steps'>;
    try {
      next = deleting
        ? { weight: null, steps: null }
        : parseTrackingInputs(modalWeight, modalSteps);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Datos no v\u00e1lidos');
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    let changed = false;
    try {
      await applyTrackingChanges(
        api,
        modalData.dateStr,
        modalData.dayData,
        next,
        (metric, value) => {
          changed = true;
          setModalData(
            (current) =>
              current && { ...current, dayData: { ...current.dayData, [metric]: value } },
          );
        },
      );
      if (changed) toast.success(deleting ? 'Registros eliminados' : 'Registros guardados');
      setModalData(null);
    } catch {
      toast.error(
        changed
          ? 'Parte de los cambios se ha guardado. Reintenta para completar el resto.'
          : deleting
            ? 'Error al eliminar. Puedes reintentarlo.'
            : 'Error al guardar. Puedes reintentarlo.',
      );
    } finally {
      if (changed) {
        await Promise.all(
          ['trackingWeeks', 'dashboard', 'weekSummaries', 'weights'].map((key) =>
            queryClient.invalidateQueries({ queryKey: [key] }),
          ),
        );
      }
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const mostRecentWeight = useMemo(() => {
    for (let w = weeks.length - 1; w >= 0; w--) {
      const days = weeks[w].days;
      for (let d = days.length - 1; d >= 0; d--) {
        const val = days[d]?.weight;
        if (val !== null && val !== undefined) {
          return val;
        }
      }
    }
    return null;
  }, [weeks]);

  const mostRecentSteps = useMemo(() => {
    for (let w = weeks.length - 1; w >= 0; w--) {
      const days = weeks[w].days;
      for (let d = days.length - 1; d >= 0; d--) {
        const val = days[d]?.steps;
        if (val !== null && val !== undefined) {
          return val;
        }
      }
    }
    return null;
  }, [weeks]);

  const handleDeltaAdjust = (metric: 'weight' | 'steps', delta: number) => {
    if (metric === 'weight') {
      const normalized = modalWeight.replace(',', '.');
      let current = parseFloat(normalized);
      if (isNaN(current)) current = mostRecentWeight ?? 70;
      const nextWeight = Math.max(0, Math.round((current + delta) * 100) / 100);
      setModalWeight(nextWeight.toFixed(2));
    } else if (metric === 'steps') {
      let current = parseInt(modalSteps, 10);
      if (isNaN(current)) current = mostRecentSteps ?? 5000;
      setModalSteps(Math.max(0, Math.round(current + delta)).toString());
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentMonday = getMondayStr();

  if (isLoading && weeks.length === 0) {
    return (
      <div className="fade-in">
        <h1 className="sr-only">Tracking semanal</h1>
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
      {isError && <QueryErrorNotice retry={fetchData} pending={isFetching} />}
      <h1 className="sr-only">Tracking semanal</h1>
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
        {weeks.length === 0 && !isLoading && !isError && (
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
        pending={isSaving}
        onSave={() => void saveModalChanges(false)}
        onDelete={() => void saveModalChanges(true)}
        onClose={() => {
          if (!savingRef.current) setModalData(null);
        }}
      />
    </div>
  );
}
