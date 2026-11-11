import { Suspense, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { apiErrorMessage, personName, useCoachClient } from '../lib/coach/api';
import { ClientOverview } from '../components/coach/ClientOverview';
import { usePowerProfile } from '../lib/coach/powerlifting';
import { ClientManagement } from '../components/coach/ClientManagement';
import { CheckinsSection } from '../components/coach/CheckinsSection';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import '../styles/coach-workspace.css';

const ClientProgress = lazyWithRetry(() => import('../components/coach/ClientProgress'));
const ClientPrograms = lazyWithRetry(() => import('../components/coach/ClientPrograms'));
const ClientTraining = lazyWithRetry(() => import('../components/coach/ClientTraining'));
const ClientNutrition = lazyWithRetry(() => import('../components/coach/ClientNutrition'));
const ClientPowerlifting = lazyWithRetry(() => import('../components/coach/ClientPowerlifting'));
const ClientWeek = lazyWithRetry(() => import('../components/coach/ClientWeek'));

export default function CoachClientPage() {
  const { linkId = '' } = useParams();
  const clients = useCoachClient(linkId);
  const link = clients.data;
  const power = usePowerProfile(linkId, !!link?.permissions.training);
  const [params] = useSearchParams();
  const section = params.get('seccion') ?? (link?.permissions.training ? 'semana' : 'resumen');
  const sectionNav = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = sectionNav.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active) {
      const left = active.getBoundingClientRect().left - nav.getBoundingClientRect().left;
      nav.scrollLeft += left - (nav.clientWidth - active.offsetWidth) / 2;
    }
  }, [section, link?.linkId]);
  const listQuery = new URLSearchParams(params.get('lista') ?? '').toString();
  const backTo =
    params.get('origen') === 'revisiones'
      ? `/entrenador/revisiones${listQuery ? `?${listQuery}` : ''}`
      : `/entrenador/alumnos${listQuery ? `?${listQuery}` : ''}`;
  const sectionHref = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('seccion', value);
    return `/entrenador/alumnos/${encodeURIComponent(linkId)}?${next}`;
  };
  const sections = [
    { id: 'semana', label: 'Semana', visible: link?.permissions.training },
    { id: 'resumen', label: 'Resumen', visible: true },
    { id: 'entrenamiento', label: 'Entrenamientos', visible: link?.permissions.training },
    {
      id: 'powerlifting',
      label: 'Powerlifting',
      visible: link?.permissions.training && power.data?.profile.enabled,
    },
    {
      id: 'nutricion',
      label: 'Nutrición',
      visible: link?.permissions.nutrition && link.setup?.services.nutrition !== false,
    },
    { id: 'progreso', label: 'Progreso', visible: link?.permissions.body },
    { id: 'revisiones', label: 'Revisiones', visible: true },
    { id: 'gestion', label: 'Ficha y gestión', visible: true },
  ].filter((s) => s.visible);

  return (
    <div className="fade-in coach-page coach-workspace">
      <Link to={backTo} className="coach-back-link">
        <ArrowLeft size={16} aria-hidden />
        {params.get('origen') === 'revisiones' ? 'Volver a revisiones' : 'Volver a alumnos'}
      </Link>
      {clients.isPending ? (
        <p role="status">Cargando ficha…</p>
      ) : clients.isError ? (
        <section className="card">
          <h1>Ficha no disponible</h1>
          <p>{apiErrorMessage(clients.error, 'No se pudo cargar la ficha del alumno.')}</p>
          <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
        </section>
      ) : !link ? (
        <section className="card">
          <h1>Alumno no disponible</h1>
          <p>Este alumno ya no está vinculado contigo o no tienes acceso a su ficha.</p>
        </section>
      ) : (
        <>
          <header className="coach-client-header">
            <div className="min-w-0">
              <h1 className="coach-client-name">{personName(link.client)}</h1>
              <p className="coach-description">
                {[
                  link.setup?.goal,
                  link.setup?.trainingDays ? `${link.setup.trainingDays} días por semana` : null,
                  link.setup?.equipment,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Completa su objetivo y disponibilidad en Ficha y gestión.'}
              </p>
            </div>
            {section !== 'revisiones' && (
              <Link to={sectionHref('revisiones')} className="btn btn-primary">
                <MessageSquareText size={16} aria-hidden />
                Ver revisiones
              </Link>
            )}
          </header>
          <nav ref={sectionNav} className="coach-client-nav" aria-label="Secciones del alumno">
            {sections.map((s) => (
              <Link
                key={s.id}
                to={sectionHref(s.id)}
                aria-current={section === s.id ? 'page' : undefined}
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <div className="coach-client-content" key={`${linkId}:${section}`}>
            <Suspense fallback={<p role="status">Cargando sección…</p>}>
              {section === 'resumen' && <ClientOverview link={link} sectionHref={sectionHref} />}
              {section === 'semana' && link.permissions.training && <ClientWeek link={link} />}
              {section === 'entrenamiento' && link.permissions.training && (
                <>
                  <ClientPrograms linkId={linkId} canAssign={link.permissions.editTraining} />
                  <ClientTraining linkId={linkId} />
                </>
              )}
              {section === 'nutricion' &&
                link.permissions.nutrition &&
                link.setup?.services.nutrition !== false && (
                  <ClientNutrition linkId={linkId} canEditPlan={link.permissions.editNutrition} />
                )}
              {section === 'powerlifting' &&
                link.permissions.training &&
                power.data?.profile.enabled && (
                  <ClientPowerlifting linkId={linkId} canEdit={link.permissions.editTraining} />
                )}
              {section === 'progreso' && link.permissions.body && (
                <ClientProgress linkId={linkId} />
              )}
              {section === 'revisiones' && (
                <section className="card">
                  <h2 className="card-title">Revisiones semanales</h2>
                  <CheckinsSection linkId={linkId} />
                </section>
              )}
              {section === 'gestion' && <ClientManagement link={link} />}
              {!sections.some((s) => s.id === section) && (
                <section className="card">
                  <h2>Sección no disponible</h2>
                  <p>Esta sección no está disponible con los permisos actuales.</p>
                  <Link to={sectionHref('resumen')} className="btn btn-secondary mt-3">
                    Ir al resumen
                  </Link>
                </section>
              )}
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}
