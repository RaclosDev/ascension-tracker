import '../styles/coach-quick-view.css';
import { Suspense } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiErrorMessage, useCoachClient, type CoachClient } from '../lib/coach/api';
import { AthleteShell, useAthleteLinks, useAthleteViews } from '../components/coach/AthleteShell';
import { ClientOverview } from '../components/coach/ClientOverview';
import { ClientManagement } from '../components/coach/ClientManagement';
import { CheckinsSection } from '../components/coach/CheckinsSection';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import '../styles/coach-workspace.css';
import '../styles/coach-student.css';

const ClientTraining = lazyWithRetry(() => import('../components/coach/ClientTraining'));
const ClientProgress = lazyWithRetry(() => import('../components/coach/ClientProgress'));
const ClientPrograms = lazyWithRetry(() => import('../components/coach/ClientPrograms'));
const ClientNutrition = lazyWithRetry(() => import('../components/coach/ClientNutrition'));
const ClientPowerlifting = lazyWithRetry(() => import('../components/coach/ClientPowerlifting'));
const ClientWeek = lazyWithRetry(() => import('../components/coach/ClientWeek'));

export default function CoachClientPage() {
  const { linkId = '' } = useParams();
  const clients = useCoachClient(linkId);
  const link = clients.data;
  const { back } = useAthleteLinks(linkId);

  return (
    <div className="coach-page coach-workspace coach-student athlete-page">
      {link ? (
        <AthleteSections link={link} />
      ) : (
        <>
          <Link to={back.to} className="coach-back-link">
            <ArrowLeft size={16} aria-hidden />
            {back.label}
          </Link>
          {clients.isPending ? (
            <p role="status">Cargando ficha…</p>
          ) : clients.isError ? (
            <section className="card">
              <h1>Ficha no disponible</h1>
              <p>{apiErrorMessage(clients.error, 'No se pudo cargar la ficha del atleta.')}</p>
              <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
            </section>
          ) : (
            <section className="card">
              <h1>Atleta no disponible</h1>
              <p>Este atleta ya no está vinculado contigo o no tienes acceso a su ficha.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function AthleteSections({ link }: { link: CoachClient }) {
  const { linkId } = link;
  const [params] = useSearchParams();
  const section = params.get('seccion') ?? 'resumen';
  const { sectionHref, recordHref } = useAthleteLinks(linkId);
  const views = useAthleteViews(link);
  const open = (id: string) => section === id && views.has(id);

  return (
    <AthleteShell link={link} active={section}>
      <div className="coach-client-content" key={`${linkId}:${section}`}>
        <Suspense fallback={<p role="status">Cargando sección…</p>}>
          {open('resumen') && (
            <ClientOverview link={link} sectionHref={sectionHref} recordHref={recordHref} />
          )}
          {open('semana') && <ClientWeek link={link} />}
          {open('entrenamiento') && (
            <>
              <ClientPrograms linkId={linkId} canAssign={link.permissions.editTraining} />
              <details className="card athlete-disclosure">
                <summary>Historial y estadísticas de entreno</summary>
                <ClientTraining linkId={linkId} />
              </details>
            </>
          )}
          {open('nutricion') && (
            <ClientNutrition linkId={linkId} canEditPlan={link.permissions.editNutrition} />
          )}
          {open('powerlifting') && (
            <ClientPowerlifting linkId={linkId} canEdit={link.permissions.editTraining} />
          )}
          {open('progreso') && <ClientProgress linkId={linkId} />}
          {open('revisiones') && <CheckinsSection linkId={linkId} />}
          {open('gestion') && <ClientManagement link={link} />}
          {!views.has(section) && (
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
    </AthleteShell>
  );
}
