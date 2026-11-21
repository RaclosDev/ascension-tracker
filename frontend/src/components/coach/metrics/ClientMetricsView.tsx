import { Suspense, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CalendarCheck,
  Footprints,
  Scale,
} from 'lucide-react';
import { useClientData, type CoachClient } from '../../../lib/coach/api';
import { signalText, useClientStatus } from '../../../lib/coach/clientStatus';
import { followupSignals } from '../../../lib/coach/workspace';
import { signalSection } from '../../../lib/coach/tasks';
import type { PhotoList } from '../../../lib/progressPhotos';
import type { DashboardData, WeekSummary, WeightEntry } from '../../../types/api';
import { lazyWithRetry } from '../../../utils/lazyWithRetry';
import { PhotoGallery } from '../../photos/PhotoGallery';
import { QueryErrorNotice } from '../../QueryErrorNotice';
import { QueryState } from '../ClientSection';
import '../../../styles/coach-metrics.css';

const MetricsWeightChart = lazyWithRetry(() => import('./MetricsWeightChart'));

const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const signed = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const kgSigned = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? '—' : `${signed.format(value)} kg`;
const whole = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const shortDay = (iso: string) => format(parseISO(iso), 'd MMM', { locale: es });

const stepsShared = (link: CoachClient) =>
  link.permissions.body && link.setup?.services?.progress !== false;

/** Métricas: how the athlete's body is moving — weight trend and goal, steps, how often they log, photos. */
export default function ClientMetrics({
  link,
  sectionHref,
  recordHref,
}: {
  link: CoachClient;
  sectionHref: (section: string) => string;
  recordHref: (path: string) => string;
}) {
  const body = link.permissions.body;
  const steps = stepsShared(link);
  return (
    <div className="metrics">
      <Attention link={link} sectionHref={sectionHref} />
      {!body && (
        <p className="coach-description">
          Este atleta no comparte su peso, sus pasos ni sus fotos contigo.
        </p>
      )}
      {body && <WeightCard linkId={link.linkId} href={recordHref('peso')} />}
      {(steps || body) && (
        <div className="metrics-pair">
          {steps && <StepsCard linkId={link.linkId} href={recordHref('pasos')} />}
          {body && <LoggingCard linkId={link.linkId} />}
        </div>
      )}
      {body && <PhotosCard linkId={link.linkId} />}
    </div>
  );
}

/** Only when something needs the coach: otherwise the page starts with the numbers. */
function Attention({
  link,
  sectionHref,
}: {
  link: CoachClient;
  sectionHref: (section: string) => string;
}) {
  const query = useClientStatus(true, link.linkId);
  const status = query.isError ? undefined : query.data?.find((s) => s.linkId === link.linkId);
  const signals = followupSignals(status);
  if (query.isError)
    return <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />;
  if (!signals.length) return null;
  return (
    <section className="metrics-attention" aria-label="Requiere atención">
      <AlertTriangle size={16} aria-hidden />
      <ul>
        {signals.map((s) => (
          <li key={s.reason}>
            <Link to={sectionHref(signalSection(s))}>{signalText(s)}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardHead({ icon, title, href }: { icon: ReactNode; title: string; href?: string }) {
  return (
    <header className="metrics-head">
      <h2>
        {icon} {title}
      </h2>
      {href && (
        <Link to={href}>
          Día a día <ArrowUpRight size={14} aria-hidden />
        </Link>
      )}
    </header>
  );
}

function WeightCard({ linkId, href }: { linkId: string; href: string }) {
  const dashboard = useClientData<DashboardData>(linkId, 'weights/dashboard', true);
  const entries = useClientData<WeightEntry[]>(linkId, 'weights', true);
  const d = dashboard.data;
  const last = useMemo(
    () => [...(entries.data ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0],
    [entries.data],
  );
  const progress = Math.max(0, Math.min(100, d?.progress ?? 0));
  const remaining = d?.remaining ?? null;
  // The backend sends a written-out date, or "--" when there is no pace to project from.
  const eta = d?.estimatedDate && /\d/.test(d.estimatedDate) ? d.estimatedDate : null;
  return (
    <section className="card metrics-card metrics-weight">
      <CardHead icon={<Scale size={17} aria-hidden />} title="Peso" href={href} />
      <QueryState isLoading={dashboard.isLoading} isError={dashboard.isError} />
      {entries.data?.length === 0 && <p className="metrics-empty">Aún no se ha pesado.</p>}
      {d && !!entries.data?.length && (
        <div className="metrics-weight-body">
          <div className="metrics-weight-facts">
            <div>
              <p className="metrics-figure">
                <strong>{kg.format(d.currentWeeklyAverage ?? d.currentWeight)}</strong> kg
              </p>
              <p className="metrics-caption">
                Media de la semana
                {last && (
                  <>
                    {' '}
                    · último pesaje {kg.format(last.weight)} kg el {shortDay(last.date)}
                  </>
                )}
              </p>
            </div>
            <dl className="metrics-facts">
              <div>
                <dt>Ritmo</dt>
                <dd>{kgSigned(d.avgWeeklyChange)}/sem</dd>
              </div>
              <div>
                <dt>Desde el inicio</dt>
                <dd>{kgSigned(d.totalLost)}</dd>
              </div>
            </dl>
            <div className="metrics-goal">
              <div className="metrics-goal-head">
                <span>Objetivo</span>
                <strong>{kg.format(progress)} %</strong>
              </div>
              <div
                className="metrics-bar"
                role="progressbar"
                aria-label="Progreso hacia el objetivo de peso"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="metrics-caption">
                {remaining == null
                  ? 'Sin objetivo marcado'
                  : Math.abs(remaining) < 0.05
                    ? 'Objetivo alcanzado'
                    : `Faltan ${kg.format(Math.abs(remaining))} kg por ${remaining < 0 ? 'subir' : 'bajar'}`}
                {eta ? ` · llegada estimada el ${eta}` : ' · sin ritmo para estimar la llegada'}
              </p>
            </div>
          </div>
          <figure className="metrics-chart" aria-label="Evolución del peso">
            <Suspense fallback={<div className="metrics-chart-wait" />}>
              <MetricsWeightChart entries={entries.data} />
            </Suspense>
            <figcaption>
              <span className="metrics-key metrics-key-dot" /> Pesaje
              <span className="metrics-key metrics-key-line" /> Media 7 días
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}

function StepsCard({ linkId, href }: { linkId: string; href: string }) {
  const query = useClientData<WeekSummary[]>(linkId, 'steps/weekly', true);
  const weeks = (query.data ?? []).filter((w) => w.average != null).slice(-8);
  const latest = weeks.at(-1);
  const top = Math.max(...weeks.map((w) => w.average ?? 0), 1);
  const typical =
    weeks.length > 1
      ? weeks.slice(0, -1).reduce((sum, w) => sum + (w.average ?? 0), 0) / (weeks.length - 1)
      : null;
  return (
    <section className="card metrics-card">
      <CardHead icon={<Footprints size={17} aria-hidden />} title="Pasos" href={href} />
      <QueryState isLoading={query.isLoading} isError={query.isError} />
      {query.data && !latest && <p className="metrics-empty">Sin pasos registrados.</p>}
      {latest && (
        <>
          <p className="metrics-figure">
            <strong>{whole.format(latest.average ?? 0)}</strong> al día
          </p>
          <p className="metrics-caption">
            Semana del {shortDay(latest.weekStart)}
            {typical != null && <> · antes, {whole.format(typical)} de media</>}
          </p>
          <ol className="metrics-bars" aria-label="Media de pasos al día por semana">
            {weeks.map((w, i) => (
              <li
                key={w.weekStart}
                data-current={i === weeks.length - 1 || undefined}
                title={`Semana del ${shortDay(w.weekStart)}: ${whole.format(w.average ?? 0)} pasos/día`}
              >
                <span style={{ height: `${((w.average ?? 0) / top) * 100}%` }} />
                <small>{shortDay(w.weekStart)}</small>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function LoggingCard({ linkId }: { linkId: string }) {
  const query = useClientData<DashboardData>(linkId, 'weights/dashboard', true);
  const d = query.data;
  const days = d?.streakDays ?? [];
  const logged = days.filter((day) => day.hasData).length;
  return (
    <section className="card metrics-card">
      <CardHead icon={<CalendarCheck size={17} aria-hidden />} title="Constancia" />
      <QueryState isLoading={query.isLoading} isError={query.isError} />
      {d && (
        <>
          <p className="metrics-figure">
            <strong>{logged}</strong> de {days.length} días
          </p>
          <p className="metrics-caption">con pesaje en las dos últimas semanas</p>
          <ol className="metrics-days" aria-label="Días con pesaje">
            {days.map((day) => (
              <li
                key={day.date}
                data-on={day.hasData || undefined}
                title={`${format(parseISO(day.date), "EEEE d 'de' MMM", { locale: es })}: ${day.hasData ? 'se pesó' : 'sin pesaje'}`}
              >
                {format(parseISO(day.date), 'EEEEE', { locale: es })}
              </li>
            ))}
          </ol>
          <dl className="metrics-facts">
            <div>
              <dt>Racha</dt>
              <dd>
                {d.streak ?? 0} {d.streak === 1 ? 'día' : 'días'}
              </dd>
            </div>
            <div>
              <dt>Registrando</dt>
              <dd>
                {d.weeksActive ?? 0} {d.weeksActive === 1 ? 'semana' : 'semanas'}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

function PhotosCard({ linkId }: { linkId: string }) {
  const query = useClientData<PhotoList>(linkId, 'progress-photos', true);
  const photos = query.data?.photos ?? [];
  return (
    <section className="card metrics-card">
      <CardHead icon={<Camera size={17} aria-hidden />} title="Fotos de progreso" />
      <QueryState isLoading={query.isLoading} isError={query.isError} />
      {query.data && !photos.length && <p className="metrics-empty">Todavía no ha subido fotos.</p>}
      {photos.length > 0 && <PhotoGallery photos={photos} />}
    </section>
  );
}
