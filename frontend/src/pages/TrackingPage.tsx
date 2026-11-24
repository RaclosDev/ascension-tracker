import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { applyTrackingChanges, parseTrackingInputs } from '../utils/trackingMutations';
import { Skeleton } from '../components/ui/skeleton';
import { DayData, WeekData, TrackingModalData, WeeklyMetricResponse } from '../types/tracking';
import { WEIGHT_DELTAS, STEPS_DELTAS, mergeWeeksData } from '../utils/trackingHelpers';
import { TrackingMetricToggle } from '../components/tracking/TrackingMetricToggle';
import { TrackingEntryModal } from '../components/tracking/TrackingEntryModal';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import '../styles/athlete-tracking.css';
import { TrackingLadder, type TrackingMetric } from '../components/tracking/TrackingLadder';

const ProgressPhotosSection = lazyWithRetry(
  () => import('../components/photos/ProgressPhotosSection'),
);

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

  const picked: TrackingMetric[] = [
    ...(showWeight ? (['weight'] as const) : []),
    ...(showSteps ? (['steps'] as const) : []),
    ...(showCalories ? (['calories'] as const) : []),
  ];
  const metrics: TrackingMetric[] = picked.length ? picked : ['weight'];
  // The last metric left stays on: an empty sheet would look broken.
  const canHide = picked.length > 1;

  if (isLoading && weeks.length === 0) {
    return (
      <div className="fade-in track">
        <h1 className="page-title-desktop">Seguimiento</h1>
        <Skeleton className="h-10 w-72 rounded-md" />
        <div className="card" aria-hidden>
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-16 w-48 mb-6" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full mb-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in track">
      {isError && <QueryErrorNotice retry={fetchData} pending={isFetching} />}
      <header className="track-head">
        <h1 className="page-title-desktop">Seguimiento</h1>
        <TrackingMetricToggle
          showWeight={metrics.includes('weight')}
          showSteps={showSteps}
          showCalories={showCalories}
          onToggleWeight={() =>
            showWeight ? canHide && setShowWeight(false) : setShowWeight(true)
          }
          onToggleSteps={() => (showSteps ? canHide && setShowSteps(false) : setShowSteps(true))}
          onToggleCalories={() =>
            showCalories ? canHide && setShowCalories(false) : setShowCalories(true)
          }
        />
      </header>
      {weeks.length === 0 && !isError ? (
        <p className="card chart-empty track-empty">Aún no hay registros.</p>
      ) : (
        <div style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <TrackingLadder weeks={weeks} metrics={metrics} onOpenDay={handleOpenDayModal} />
        </div>
      )}

      <Suspense fallback={null}>
        <ProgressPhotosSection />
      </Suspense>

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
