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
import {
  DAY_NAMES,
  WEIGHT_DELTAS,
  STEPS_DELTAS,
  getMondayStr,
  mergeWeeksData,
} from '../utils/trackingHelpers';
import { TrackingMetricToggle } from '../components/tracking/TrackingMetricToggle';
import { TrackingDayCell, formatKg } from '../components/tracking/TrackingDayCell';
import { WeekSpark } from '../components/tracking/WeekSpark';
import { TrackingEntryModal } from '../components/tracking/TrackingEntryModal';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import '../styles/athlete-tracking.css';

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

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentMonday = getMondayStr();

  const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}`;
  const columns = [showWeight, showSteps, showCalories].filter(Boolean).length;

  if (isLoading && weeks.length === 0) {
    return (
      <div className="fade-in track">
        <h1 className="page-title-desktop">Seguimiento</h1>
        <Skeleton className="h-10 w-72 rounded-md" />
        <div className="card track-sheet" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="track-week">
              <div className="track-week-label">
                <Skeleton className="h-5 w-20" />
              </div>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div key={d} className="track-day">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="mt-2 h-5 w-full" />
                </div>
              ))}
              <div className="track-week-sum">
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
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
          showWeight={showWeight}
          showSteps={showSteps}
          showCalories={showCalories}
          onToggleWeight={() => setShowWeight(!showWeight)}
          onToggleSteps={() => setShowSteps(!showSteps)}
          onToggleCalories={() => setShowCalories(!showCalories)}
        />
      </header>

      <section
        className="card track-sheet"
        aria-label="Registro diario por semanas"
        data-rows={columns}
        style={{ opacity: isLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}
      >
        <div className="track-week track-cols" aria-hidden>
          <span className="track-week-label">Semana</span>
          {DAY_NAMES.map((d) => (
            <span key={d} className="track-col">
              {d}
            </span>
          ))}
          <span className="track-week-sum">Media</span>
        </div>
        {[...weeks].reverse().map((week) => {
          const isCurrentWeek = week.weekStart === currentMonday;
          const monday = new Date(week.weekStart + 'T00:00:00');
          return (
            <div
              key={week.weekStart}
              className="track-week"
              data-current={isCurrentWeek || undefined}
              role="group"
              aria-label={`Semana del ${format(monday, "d 'de' MMMM", { locale: es })}`}
            >
              <div className="track-week-label">
                <strong>
                  {isCurrentWeek ? 'Esta semana' : format(monday, 'd MMM', { locale: es })}
                </strong>
                {isCurrentWeek && <span>{format(monday, 'd MMM', { locale: es })}</span>}
              </div>
              {week.days.map((dayData: DayData, d: number) => {
                const date = new Date(monday);
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
              <dl className="track-week-sum">
                {showWeight && (
                  <div className="track-sum-weight">
                    <dt className="sr-only">Peso medio</dt>
                    <dd className="track-sum-avg tabular-nums">
                      {week.averageWeight != null ? (
                        <>
                          {formatKg(week.averageWeight)}
                          <span className="track-unit"> kg</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </dd>
                    {week.deltaWeight != null && (
                      <>
                        <dt className="sr-only">Cambio frente a la semana anterior</dt>
                        <dd className="track-sum-delta tabular-nums">
                          {signed(week.deltaWeight)}
                          <span className="track-unit"> kg</span>
                        </dd>
                      </>
                    )}
                    <dd className="track-spark-cell" aria-hidden>
                      <WeekSpark days={week.days} />
                    </dd>
                  </div>
                )}
                {((showSteps && week.averageSteps != null) ||
                  (showCalories && week.averageCalories != null)) && (
                  <div className="track-sub tabular-nums">
                    {showSteps && week.averageSteps != null && (
                      <>
                        <dt className="sr-only">Pasos medios</dt>
                        <dd className="track-minor">
                          {Math.round(week.averageSteps).toLocaleString('es-ES')}
                          <span className="track-unit"> pas</span>
                        </dd>
                      </>
                    )}
                    {showCalories && week.averageCalories != null && (
                      <>
                        <dt className="sr-only">Calorías medias</dt>
                        <dd className="track-minor">
                          {Math.round(week.averageCalories).toLocaleString('es-ES')}
                          <span className="track-unit"> kcal</span>
                        </dd>
                      </>
                    )}
                  </div>
                )}
              </dl>
            </div>
          );
        })}
        {weeks.length === 0 && !isLoading && !isError && (
          <p className="chart-empty track-empty">Aún no hay registros.</p>
        )}
      </section>

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
