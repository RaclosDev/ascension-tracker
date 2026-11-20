import '../styles/coach-quick-view.css';
import { Suspense } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiErrorMessage, personName, useCoachClient, type CoachClient } from '../lib/coach/api';
import { AthleteShell, useAthleteLinks, useAthleteViews } from '../components/coach/AthleteShell';
import { ClientManagement } from '../components/coach/ClientManagement';
import { CheckinsSection } from '../components/coach/CheckinsSection';
import { SectionSkeleton } from '../components/coach/SectionSkeleton';
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
  const { sectionHref, recordHref } = useAthleteLinks(linkId);
  const views = useAthleteViews(link);
  // Planning is where a coach spends the time; the summary covers athletes without that permission.
  const asked = params.get('seccion') ?? (link.permissions.training ? 'semana' : 'progreso');
  // The summary now opens inside Progreso; old links keep working.
  const section = asked === 'resumen' ? 'progreso' : asked;
  const open = (id: string) => section === id && views.has(id) && !views.locked(id);

  return (
    <AthleteShell link={link} active={section}>
      <div className="coach-client-content" key={`${linkId}:${section}`}>
        <Suspense fallback={<SectionSkeleton />}>
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
          {(open('nutricion') || open('pauta')) && (
            <ClientNutrition
              linkId={linkId}
              view={section === 'pauta' ? 'pauta' : 'diario'}
              canEditPlan={link.permissions.editNutrition}
            />
          )}
          {open('powerlifting') && (
            <ClientPowerlifting linkId={linkId} canEdit={link.permissions.editTraining} />
          )}
          {open('progreso') && (
            <ClientProgress link={link} sectionHref={sectionHref} recordHref={recordHref} />
          )}
          {open('revisiones') && <CheckinsSection link={link} />}
          {open('gestion') && <ClientManagement link={link} />}
          {views.locked(section) && (
            <section className="card athlete-locked">
              <h2>{personName(link.client)} aún no comparte su nutrición contigo</h2>
              <p>
                El servicio de nutrición está contratado, pero falta su permiso. Se concede desde su
                aplicación, en Configuración → Entrenador, marcando «Nutrición» y «Pautar
                nutrición». En cuanto lo haga, aquí verás su pauta y sus comidas registradas.
              </p>
              <Link to={sectionHref('gestion')} className="btn btn-secondary mt-3">
                Ver servicios y permisos
              </Link>
            </section>
          )}
          {!views.has(section) && (
            <section className="card">
              <h2>Sección no disponible</h2>
              <p>Esta sección no está disponible con los permisos actuales.</p>
              <Link to={sectionHref('progreso')} className="btn btn-secondary mt-3">
                Ir a progreso
              </Link>
            </section>
          )}
        </Suspense>
      </div>
    </AthleteShell>
  );
}
