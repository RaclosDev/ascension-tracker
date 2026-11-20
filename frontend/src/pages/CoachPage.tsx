import { Link } from 'react-router-dom';
import { Suspense } from 'react';
import { useCoachRoster } from '../lib/coach/workspace';
import { CoachHomeBoard } from '../components/coach/CoachHomeBoard';
import {
  CoachPageHeader,
  CoachWorkspace,
  InviteClientButton,
} from '../components/coach/CoachWorkspace';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const CoachTourWelcome = lazyWithRetry(() => import('../components/coach/tour/CoachTourWelcome'));

export default function CoachPage() {
  return (
    <CoachWorkspace>
      <Dashboard />
    </CoachWorkspace>
  );
}

function Dashboard() {
  const { clients, status, rows, ready } = useCoachRoster();

  return (
    <>
      <CoachPageHeader title="Inicio" description="Qué vence esta semana y cómo van tus atletas.">
        <div className="coach-inline-actions">
          <Link className="btn btn-secondary" to="/entrenador/guia">
            Guía interactiva
          </Link>
          <InviteClientButton />
        </div>
      </CoachPageHeader>
      <Suspense fallback={null}>
        <CoachTourWelcome />
      </Suspense>
      {clients.isPending ? (
        <p role="status">Cargando atletas…</p>
      ) : clients.isError ? (
        <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
      ) : rows.length === 0 ? (
        <section className="card coach-welcome">
          <p className="coach-eyebrow">Tu primer atleta</p>
          <h2>Empieza por una invitación</h2>
          <p>
            Tu atleta acepta el enlace y elige qué datos compartir contigo. Después podrás revisar
            su evolución y asignarle un programa.
          </p>
          <div className="coach-inline-actions">
            <InviteClientButton />
            <Link className="btn btn-secondary" to="/entrenador/programas">
              Preparar un programa
            </Link>
          </div>
        </section>
      ) : (
        <>
          {status.isError && (
            <QueryErrorNotice retry={() => void status.refetch()} pending={status.isFetching} />
          )}
          {!ready && !status.isError && (
            <p role="status" className="coach-description">
              {status.isPending
                ? 'Actualizando el seguimiento…'
                : 'Falta información de seguimiento de algún atleta.'}
            </p>
          )}
          {ready && <CoachHomeBoard rows={rows} />}
        </>
      )}
    </>
  );
}
