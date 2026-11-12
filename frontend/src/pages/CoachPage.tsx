import { Link } from 'react-router-dom';
import { Suspense } from 'react';
import { ArrowUpRight, ClipboardList, MessageSquareText, Users } from 'lucide-react';
import { followupSignals, useCoachRoster } from '../lib/coach/workspace';
import { CoachTaskBoard } from '../components/coach/CoachTaskBoard';
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
  const replies = rows.filter((r) => (r.status?.pendingReplies ?? 0) > 0);
  const pending = replies.reduce((sum, r) => sum + (r.status?.pendingReplies ?? 0), 0);
  const followups = rows.filter((r) => followupSignals(r.status).length > 0);

  return (
    <>
      <CoachPageHeader
        title="Inicio"
        description="Organiza las revisiones y el seguimiento de tus atletas."
      >
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
          <div className="coach-overview" aria-label="Resumen de atletas">
            <Link
              to="/entrenador/revisiones"
              className="coach-overview-item coach-overview-primary"
            >
              <MessageSquareText size={20} aria-hidden />
              <span>Check-ins por responder</span>
              <strong>{ready ? pending : '—'}</strong>
              <small>
                {ready
                  ? `De ${replies.length} ${replies.length === 1 ? 'atleta' : 'atletas'}`
                  : 'Estado no disponible'}
              </small>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link to="/entrenador/atletas?filtro=attention" className="coach-overview-item">
              <ClipboardList size={20} aria-hidden />
              <span>Atletas por revisar</span>
              <strong>{ready ? followups.length : '—'}</strong>
              <small>Señales de seguimiento</small>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link to="/entrenador/atletas" className="coach-overview-item">
              <Users size={20} aria-hidden />
              <span>Atletas activos</span>
              <strong>{rows.length}</strong>
              <small>Ver tu lista completa</small>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
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
          {ready && (
            <>
              <Link
                className="btn btn-secondary self-start"
                to="/entrenador/revisiones?vista=agenda"
              >
                Ver agenda semanal
              </Link>
              <CoachTaskBoard rows={rows} />
            </>
          )}
        </>
      )}
    </>
  );
}
