import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, MessageSquareText, Users } from 'lucide-react';
import { personName } from '../lib/coach/api';
import { signalText } from '../lib/coach/clientStatus';
import { activityText, clientHref, followupSignals, useCoachRoster } from '../lib/coach/workspace';
import {
  CoachPageHeader,
  CoachWorkspace,
  InviteClientButton,
} from '../components/coach/CoachWorkspace';
import { QueryErrorNotice } from '../components/QueryErrorNotice';

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
        description="Organiza las revisiones y el seguimiento de tus alumnos."
      >
        <InviteClientButton />
      </CoachPageHeader>
      {clients.isPending ? (
        <p role="status">Cargando alumnos…</p>
      ) : clients.isError ? (
        <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
      ) : rows.length === 0 ? (
        <section className="card coach-welcome">
          <p className="coach-eyebrow">Tu primer alumno</p>
          <h2>Empieza por una invitación</h2>
          <p>
            Tu alumno acepta el enlace y elige qué datos compartir contigo. Después podrás revisar
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
          <div className="coach-overview" aria-label="Resumen de alumnos">
            <Link
              to="/entrenador/revisiones"
              className="coach-overview-item coach-overview-primary"
            >
              <MessageSquareText size={20} aria-hidden />
              <span>Check-ins por responder</span>
              <strong>{ready ? pending : '—'}</strong>
              <small>
                {ready
                  ? `De ${replies.length} ${replies.length === 1 ? 'alumno' : 'alumnos'}`
                  : 'Estado no disponible'}
              </small>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link to="/entrenador/alumnos?filtro=attention" className="coach-overview-item">
              <ClipboardList size={20} aria-hidden />
              <span>Alumnos por revisar</span>
              <strong>{ready ? followups.length : '—'}</strong>
              <small>Señales de seguimiento</small>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
            <Link to="/entrenador/alumnos" className="coach-overview-item">
              <Users size={20} aria-hidden />
              <span>Alumnos activos</span>
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
                : 'Falta información de seguimiento de algún alumno.'}
            </p>
          )}
          {ready && (
            <div className="coach-dashboard-grid">
              <section className="card coach-worklist" aria-labelledby="coach-pending-title">
                <div className="coach-section-heading">
                  <h2 id="coach-pending-title">Pendiente de ti</h2>
                  <Link to="/entrenador/revisiones">
                    Ver revisiones <ArrowUpRight size={14} aria-hidden />
                  </Link>
                </div>
                {replies.length === 0 ? (
                  <div className="coach-empty-inline">
                    <MessageSquareText size={24} aria-hidden />
                    <h3>No tienes respuestas pendientes</h3>
                    <p>Los nuevos check-ins aparecerán aquí cuando tus alumnos los envíen.</p>
                  </div>
                ) : (
                  <ul className="coach-action-list">
                    {replies.slice(0, 5).map(({ link, status: state }) => (
                      <li key={link.linkId}>
                        <Link to={clientHref(link.linkId, 'revisiones')}>
                          <span className="coach-avatar" aria-hidden>
                            {personName(link.client).slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            <strong>{personName(link.client)}</strong>
                            <small>
                              {state?.pendingReplies}{' '}
                              {state?.pendingReplies === 1
                                ? 'check-in por responder'
                                : 'check-ins por responder'}
                            </small>
                          </span>
                          <span className="coach-row-action">
                            Revisar <ArrowUpRight size={15} aria-hidden />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="card coach-worklist" aria-labelledby="coach-followup-title">
                <div className="coach-section-heading">
                  <h2 id="coach-followup-title">Seguimiento</h2>
                  <Link to="/entrenador/alumnos?filtro=attention">
                    Ver todos <ArrowUpRight size={14} aria-hidden />
                  </Link>
                </div>
                {followups.length === 0 ? (
                  <div className="coach-empty-inline">
                    <h3>Sin señales pendientes</h3>
                    <p>Puedes abrir la ficha de cualquier alumno desde tu lista.</p>
                  </div>
                ) : (
                  <ul className="coach-action-list">
                    {followups.slice(0, 4).map(({ link, status: state }) => (
                      <li key={link.linkId}>
                        <Link to={clientHref(link.linkId)}>
                          <span>
                            <strong>{personName(link.client)}</strong>
                            <small>{signalText(followupSignals(state)[0])}</small>
                            <small>Última actividad: {activityText(state?.lastActivity)}</small>
                          </span>
                          <ArrowUpRight size={16} aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
}
