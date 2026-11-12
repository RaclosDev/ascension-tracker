import { Suspense, useMemo } from 'react';
import { Scale, Footprints, Camera } from 'lucide-react';
import { useClientData } from '../../lib/coach/api';
import { PhotoGallery } from '../photos/PhotoGallery';
import type { PhotoList } from '../../lib/progressPhotos';
import { DashboardChartsSkeleton } from '../workout/skeletons/DashboardChartsSkeleton';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { toWeeklyDeltaData, toWeightChartData } from '../../lib/weightCharts';
import type { DashboardData, WeightEntry, WeekSummary } from '../../types/api';
import { Section, Stat, QueryState, WeeklyList, num } from './ClientSection';
const DashboardCharts = lazyWithRetry(() => import('../DashboardCharts'));

export default function BodySection({ linkId }: { linkId: string }) {
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
          <p style={{ color: 'var(--text-secondary)' }}>Tu atleta aún no ha subido fotos.</p>
        )}
        {photos.data && photos.data.photos.length > 0 && (
          <PhotoGallery photos={photos.data.photos} />
        )}
      </Section>
    </>
  );
}
