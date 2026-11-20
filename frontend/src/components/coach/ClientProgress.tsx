import { Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Apple, ArrowUpRight, Camera, Footprints, Scale, Target } from 'lucide-react';
import { useClientData, type CoachClient } from '../../lib/coach/api';
import { PhotoGallery } from '../photos/PhotoGallery';
import type { PhotoList } from '../../lib/progressPhotos';
import { DashboardChartsSkeleton } from '../workout/skeletons/DashboardChartsSkeleton';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import { toWeeklyDeltaData, toWeightChartData } from '../../lib/weightCharts';
import type { DashboardData, WeightEntry, WeekSummary } from '../../types/api';
import { ClientOverview } from './ClientOverview';
import { CoachTracking } from './CoachTracking';
import { Section, Stat, QueryState, WeeklyList, num } from './ClientSection';
const DashboardCharts = lazyWithRetry(() => import('../DashboardCharts'));

type Metric = 'peso' | 'pasos' | 'kcal';
const STORAGE_KEY = 'ascension.coach.trackingMetrics';
const METRICS = [
  { id: 'peso', label: 'Peso', icon: Scale },
  { id: 'pasos', label: 'Pasos', icon: Footprints },
  { id: 'kcal', label: 'Kcal', icon: Apple },
] as const;

function readHidden(): Metric[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const stepsShared = (link: CoachClient) =>
  link.permissions.body && link.setup?.services?.progress !== false;

/** Progreso: the athlete's weekly tracking as they see it, a card per week with weight, steps and calories. */
export default function ClientProgress({
  link,
  recordHref,
}: {
  link: CoachClient;
  recordHref: (path: string) => string;
}) {
  const available: Record<Metric, boolean> = {
    peso: link.permissions.body,
    pasos: stepsShared(link),
    kcal: link.permissions.nutrition && link.setup?.services?.nutrition !== false,
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

  if (options.length === 0)
    return (
      <section className="card">
        <h2>Sin registros compartidos</h2>
        <p className="coach-description">
          Tu atleta no comparte peso, pasos ni nutrición. Lo demás está en Métricas.
        </p>
      </section>
    );

  return (
    <>
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
      {(shows('peso') || shows('pasos') || shows('kcal')) && (
        <CoachTracking
          linkId={link.linkId}
          weights={shows('peso')}
          steps={shows('pasos')}
          calories={shows('kcal')}
          weekHref={weekHref}
        />
      )}
    </>
  );
}

/** Métricas: where the athlete stands, the weight goal, trends and photos. */
export function ClientMetrics({
  link,
  sectionHref,
  recordHref,
}: {
  link: CoachClient;
  sectionHref: (section: string) => string;
  recordHref: (path: string) => string;
}) {
  const body = link.permissions.body;
  return (
    <ClientOverview link={link} sectionHref={sectionHref}>
      {body && <WeightPanel linkId={link.linkId} href={recordHref('peso')} />}
      {stepsShared(link) && <StepsPanel linkId={link.linkId} href={recordHref('pasos')} />}
      {body && <PhotosPanel linkId={link.linkId} />}
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

const longDay = (iso?: string) => {
  if (!iso) return '—';
  const date = parseISO(iso);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'd MMM yyyy', { locale: es });
};

function WeightPanel({ linkId, href }: { linkId: string; href: string }) {
  const dashboard = useClientData<DashboardData>(linkId, 'weights/dashboard', true);
  const entries = useClientData<WeightEntry[]>(linkId, 'weights', true);
  const weeks = useClientData<WeekSummary[]>(linkId, 'weights/weekly', true);
  const d = dashboard.data;
  const weightChartData = useMemo(() => toWeightChartData(entries.data ?? []), [entries.data]);
  const deltaData = useMemo(() => toWeeklyDeltaData(weeks.data ?? []), [weeks.data]);
  return (
    <>
      <Section title="Peso" icon={<Scale size={18} aria-hidden />}>
        <QueryState isLoading={dashboard.isLoading} isError={dashboard.isError} />
        {d && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Actual" value={num(d.currentWeight, ' kg')} />
            <Stat label="Media semanal" value={num(d.currentWeeklyAverage, ' kg')} />
            <Stat label="Cambio total" value={num(d.totalLost, ' kg')} />
            <Stat label="Cambio/semana" value={num(d.avgWeeklyChange, ' kg')} />
            <Stat label="Mejor semana" value={num(d.bestWeekDelta, ' kg')} />
            <Stat label="Semanas registrando" value={num(d.weeksActive)} />
            <Stat label="Racha" value={num(d.streak, ' días')} />
          </div>
        )}
      </Section>
      {d && (
        <Section title="Objetivo de peso" icon={<Target size={18} aria-hidden />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Falta" value={num(d.remaining, ' kg')} />
            <Stat label="Progreso" value={num(d.progress, ' %')} />
            <Stat label="Fecha estimada" value={longDay(d.estimatedDate)} />
          </div>
        </Section>
      )}
      <Section title="Evolución del peso" icon={<Scale size={18} aria-hidden />}>
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
    </>
  );
}

function StepsPanel({ linkId, href }: { linkId: string; href: string }) {
  const steps = useClientData<WeekSummary[]>(linkId, 'steps/weekly', true);
  return (
    <Section title="Pasos por semana" icon={<Footprints size={18} aria-hidden />}>
      <QueryState isLoading={steps.isLoading} isError={steps.isError} />
      {steps.data && <WeeklyList weeks={steps.data} unit=" pasos/día" />}
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
