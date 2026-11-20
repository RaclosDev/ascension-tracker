import { Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Apple, ArrowUpRight, Camera, Footprints, Scale } from 'lucide-react';
import { useClientData, type CoachClient } from '../../lib/coach/api';
import { PhotoGallery } from '../photos/PhotoGallery';
import type { PhotoList } from '../../lib/progressPhotos';
import { DashboardChartsSkeleton } from '../workout/skeletons/DashboardChartsSkeleton';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { toWeeklyDeltaData, toWeightChartData } from '../../lib/weightCharts';
import type { DashboardData, WeightEntry, WeekSummary } from '../../types/api';
import { ClientOverview } from './ClientOverview';
import { CoachTracking } from './CoachTracking';
import { Section, Stat, QueryState, num } from './ClientSection';
const DashboardCharts = lazyWithRetry(() => import('../DashboardCharts'));

type Metric = 'peso' | 'pasos' | 'kcal' | 'fotos';
const STORAGE_KEY = 'ascension.coach.trackingMetrics';
const METRICS = [
  { id: 'peso', label: 'Peso', icon: Scale },
  { id: 'pasos', label: 'Pasos', icon: Footprints },
  { id: 'kcal', label: 'Kcal', icon: Apple },
  { id: 'fotos', label: 'Fotos', icon: Camera },
] as const;

function readHidden(): Metric[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/** How the athlete is doing, the way they see it: a card per week with weight, steps and calories. */
export default function ClientProgress({
  link,
  sectionHref,
  recordHref,
}: {
  link: CoachClient;
  sectionHref: (section: string) => string;
  recordHref: (path: string) => string;
}) {
  const services = link.setup?.services;
  const body = link.permissions.body;
  const available: Record<Metric, boolean> = {
    peso: body,
    pasos: body && services?.progress !== false,
    kcal: link.permissions.nutrition && services?.nutrition !== false,
    fotos: body,
  };
  const options = METRICS.filter((m) => available[m.id]);
  // Coaches hide what they never read; everything starts visible.
  const [hidden, setHidden] = useState<Metric[]>(readHidden);
  const shows = (id: Metric) => available[id] && !hidden.includes(id);
  const toggle = (id: Metric) => {
    const next = hidden.includes(id) ? hidden.filter((m) => m !== id) : [...hidden, id];
    setHidden(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: the choice lasts until the page closes.
    }
  };
  const weekHref = (week: string) => {
    const [path, query = ''] = recordHref('registro').split('?');
    const next = new URLSearchParams(query);
    next.set('semana', week);
    return `${path}?${next}`;
  };
  const tracking = shows('peso') || shows('pasos') || shows('kcal');

  return (
    <ClientOverview link={link} sectionHref={sectionHref}>
      {options.length > 0 && (
        <div
          className="segmented coach-tracking-toggle"
          role="toolbar"
          aria-label="Registros mostrados"
        >
          {options.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="segmented-option"
              aria-pressed={shows(id)}
              onClick={() => toggle(id)}
            >
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>
      )}
      {tracking && (
        <CoachTracking
          linkId={link.linkId}
          weights={shows('peso')}
          steps={shows('pasos')}
          calories={shows('kcal')}
          weekHref={weekHref}
        />
      )}
      {shows('peso') && <WeightPanel linkId={link.linkId} href={recordHref('peso')} />}
      {shows('fotos') && <PhotosPanel linkId={link.linkId} />}
    </ClientOverview>
  );
}

function DaysLink({ href }: { href: string }) {
  return (
    <Link className="btn btn-secondary mt-4" to={href}>
      Ver día a día <ArrowUpRight size={16} aria-hidden />
    </Link>
  );
}

function WeightPanel({ linkId, href }: { linkId: string; href: string }) {
  const dashboard = useClientData<DashboardData>(linkId, 'weights/dashboard', true);
  const entries = useClientData<WeightEntry[]>(linkId, 'weights', true);
  const weeks = useClientData<WeekSummary[]>(linkId, 'weights/weekly', true);
  const d = dashboard.data;
  const weightChartData = useMemo(() => toWeightChartData(entries.data ?? []), [entries.data]);
  const deltaData = useMemo(() => toWeeklyDeltaData(weeks.data ?? []), [weeks.data]);
  return (
    <Section title="Evolución del peso" icon={<Scale size={18} aria-hidden />}>
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
      <DaysLink href={href} />
    </Section>
  );
}

function PhotosPanel({ linkId }: { linkId: string }) {
  const photos = useClientData<PhotoList>(linkId, 'progress-photos', true);
  return (
    <Section title="Fotos de progreso" icon={<Camera size={18} aria-hidden />}>
      <QueryState isLoading={photos.isLoading} isError={photos.isError} />
      {photos.data?.photos.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>Tu atleta aún no ha subido fotos.</p>
      )}
      {photos.data && photos.data.photos.length > 0 && <PhotoGallery photos={photos.data.photos} />}
    </Section>
  );
}
