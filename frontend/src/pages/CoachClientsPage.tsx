import { Link } from 'react-router-dom';
import { useCoachFilters } from '../lib/coach/useCoachFilters';
import { ArrowUpRight } from 'lucide-react';
import { personName, sharedScopes } from '../lib/coach/api';
import { LEVEL_COLORS, signalText } from '../lib/coach/clientStatus';
import { clientTasks } from '../lib/coach/tasks';
import { serviceNames } from '../lib/coach/setup';
import {
  activityText,
  clientHref,
  followupLevel,
  followupSignals,
  searchName,
  useCoachRoster,
  type CoachRow,
} from '../lib/coach/workspace';
import {
  CoachPageHeader,
  CoachWorkspace,
  InviteClientButton,
} from '../components/coach/CoachWorkspace';
import { PendingInvitations } from '../components/coach/CoachInvitations';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { CoachRosterFilters, ROSTER_FILTERS } from '../components/coach/CoachRosterFilters';
import '../styles/coach-roster.css';

const weightFormat = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export default function CoachClientsPage() {
  return (
    <CoachWorkspace>
      <Clients />
    </CoachWorkspace>
  );
}

function Clients() {
  const { clients, status, rows, ready } = useCoachRoster();
  const { params, update, clear } = useCoachFilters();
  const filter = ROSTER_FILTERS.find((f) => f.value === params.get('filtro')) ?? ROSTER_FILTERS[0];
  const search = params.get('q') ?? '';
  const sort = params.get('orden') ?? 'priority';
  const showWeight = params.get('peso') === 'si';
  const service = params.get('servicio') ?? '';
  const visible = rows.filter(
    (r) =>
      filter.matches(r) &&
      (!service ||
        Object.entries(r.link.setup?.services ?? {}).some(
          ([key, active]) => key === service && active,
        )) &&
      searchName(personName(r.link.client)).includes(searchName(search.trim())),
  );
  if (sort === 'name')
    visible.sort((a, b) =>
      personName(a.link.client).localeCompare(personName(b.link.client), 'es'),
    );
  if (sort === 'recent') visible.sort((a, b) => b.link.since.localeCompare(a.link.since));
  const href = (
    linkId: string,
    section = rows.find((row) => row.link.linkId === linkId)?.link.permissions.training
      ? 'semana'
      : 'resumen',
  ) => `${clientHref(linkId, section)}&lista=${encodeURIComponent(params.toString())}`;

  return (
    <>
      <CoachPageHeader
        title="Alumnos"
        description="Encuentra a cada alumno y retoma su seguimiento."
      >
        <InviteClientButton />
      </CoachPageHeader>
      {clients.isPending ? (
        <p role="status">Cargando alumnos…</p>
      ) : clients.isError ? (
        <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
      ) : rows.length === 0 ? (
        <section className="card coach-empty-inline">
          <h2>Aún no tienes alumnos</h2>
          <p>Invita a tu primer alumno para empezar a trabajar juntos.</p>
        </section>
      ) : (
        <>
          <CoachRosterFilters
            rows={rows}
            ready={ready}
            params={params}
            update={update}
            clear={clear}
          />
          {status.isError && (
            <QueryErrorNotice retry={() => void status.refetch()} pending={status.isFetching} />
          )}
          {!ready && !status.isError && (
            <p role="status">
              {status.isPending
                ? 'Cargando seguimiento…'
                : 'El seguimiento de algunos alumnos no está disponible.'}
            </p>
          )}
          {filter.value === 'noProgram' && (
            <p className="coach-description">
              Alumnos con servicio de entrenamiento acordado, permiso para pautarlo y sin programa
              activo.
            </p>
          )}
          {!ready && filter.value !== 'all' ? (
            <p>
              Espera a que cargue el seguimiento o{' '}
              <button
                type="button"
                className="coach-text-button"
                onClick={() => update('filtro', '')}
              >
                ver todos los alumnos
              </button>
              .
            </p>
          ) : visible.length === 0 ? (
            <div className="card coach-empty-inline">
              <h2>No hay alumnos con estos filtros</h2>
              <button type="button" className="btn btn-secondary" onClick={clear}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <p className="coach-list-count" role="status">
                {visible.length} de {rows.length} alumnos
              </p>
              <div className="card coach-table-wrap">
                <table className="coach-table">
                  <caption className="sr-only">Seguimiento de alumnos</caption>
                  <thead>
                    <tr>
                      <th scope="col">Alumno</th>
                      <th scope="col">Seguimiento</th>
                      <th scope="col">Actividad y entrenos</th>
                      <th scope="col">Semana siguiente</th>
                      {showWeight && <th scope="col">Peso (4 sem.)</th>}
                      <th scope="col">Revisiones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.link.linkId}>
                        <td>
                          <Link className="coach-row-link" to={href(row.link.linkId)}>
                            {personName(row.link.client)}
                          </Link>
                          <details className="coach-row-details">
                            <summary>Ver accesos</summary>
                            <p className="coach-muted">{sharedScopes(row.link.permissions)}</p>
                          </details>
                          {row.link.setup && (
                            <span className="coach-muted">{serviceNames(row.link.setup)}</span>
                          )}
                        </td>
                        <td>
                          <ClientState row={row} />
                          <TaskLinks row={row} href={href} />
                        </td>
                        <td>
                          <span>Actividad: {activityText(row.status?.lastActivity)}</span>
                          <span className="coach-muted">
                            Entreno: {activityText(row.status?.lastWorkout)}
                          </span>
                          <span className="coach-muted">
                            Revisión: {activityText(row.status?.lastCheckin)}
                          </span>
                        </td>
                        <td>
                          {row.link.permissions.training ? (
                            <Link to={href(row.link.linkId, 'semana')}>
                              {row.status?.nextWeekStatus === 'SCHEDULED'
                                ? 'Programada'
                                : row.status?.nextWeekStatus === 'DRAFT'
                                  ? 'Borrador'
                                  : 'Sin preparar'}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        {showWeight && (
                          <td>
                            {row.link.permissions.body && row.status?.weightChange != null
                              ? `${weightFormat.format(row.status.weightChange)} kg`
                              : '—'}
                          </td>
                        )}
                        <td>
                          {row.status ? (
                            row.status.pendingReplies > 0 ? (
                              <Link
                                className="coach-pending"
                                to={href(row.link.linkId, 'revisiones')}
                              >
                                {row.status.pendingReplies} por responder
                              </Link>
                            ) : (
                              <span className="coach-muted">Sin respuestas pendientes</span>
                            )
                          ) : (
                            <span className="coach-muted">No disponible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="card coach-cards">
                {visible.map((row) => (
                  <li key={row.link.linkId}>
                    <Link className="coach-card-link" to={href(row.link.linkId)}>
                      <span className="min-w-0 flex-1 flex flex-col gap-1">
                        <strong className="coach-card-name">{personName(row.link.client)}</strong>
                        <ClientState row={row} />
                        {row.link.setup && (
                          <span className="coach-muted">{serviceNames(row.link.setup)}</span>
                        )}
                        <span className="coach-muted">
                          Última actividad: {activityText(row.status?.lastActivity)}
                        </span>
                        {row.link.permissions.training && (
                          <span className="coach-muted">
                            Último entreno: {activityText(row.status?.lastWorkout)} · Próxima
                            semana:{' '}
                            {row.status?.nextWeekStatus === 'SCHEDULED'
                              ? 'programada'
                              : row.status?.nextWeekStatus === 'DRAFT'
                                ? 'borrador'
                                : 'sin preparar'}
                          </span>
                        )}
                        {(row.status?.pendingReplies ?? 0) > 0 && (
                          <span className="coach-pending">
                            {row.status?.pendingReplies} por responder
                          </span>
                        )}
                        {showWeight &&
                          row.link.permissions.body &&
                          row.status?.weightChange != null && (
                            <span className="coach-muted">
                              Peso (4 sem.): {weightFormat.format(row.status.weightChange)} kg
                            </span>
                          )}
                      </span>
                      <ArrowUpRight size={18} aria-hidden />
                    </Link>
                    <TaskLinks row={row} href={href} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <PendingInvitations />
    </>
  );
}

function TaskLinks({
  row,
  href,
}: {
  row: CoachRow;
  href: (linkId: string, section: string) => string;
}) {
  const tasks = clientTasks(row);
  if (tasks.length === 0) return null;
  const taskLink = (task: (typeof tasks)[number]) => (
    <Link className="coach-task-link" to={href(row.link.linkId, task.section)}>
      {task.title}
    </Link>
  );
  return (
    <div className="coach-roster-tasks">
      {taskLink(tasks[0])}
      {tasks.length > 1 && (
        <details className="coach-row-details">
          <summary>
            {tasks.length - 1} {tasks.length === 2 ? 'tarea más' : 'tareas más'}
            <span className="sr-only"> de {personName(row.link.client)}</span>
          </summary>
          <ul>
            {tasks.slice(1).map((task) => (
              <li key={task.id}>{taskLink(task)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ClientState({ row }: { row: CoachRow }) {
  if (row.link.followup?.schedule.paused)
    return <span className="coach-muted">Seguimiento en pausa</span>;
  if (!row.status) return <span className="coach-muted">Seguimiento no disponible</span>;
  if (!row.link.setup) return <span className="coach-muted">Servicio por configurar</span>;
  if (!row.link.setup.reviewed) return <span className="coach-muted">Incorporación pendiente</span>;
  const signal = followupSignals(row.status)[0];
  return (
    <span className="coach-status">
      <span
        className="coach-status-level"
        style={{ color: LEVEL_COLORS[followupLevel(row.status)] }}
      >
        <span aria-hidden className="coach-dot" style={{ background: 'currentColor' }} />
        {signal ? 'Por revisar' : 'Sin avisos'}
      </span>
      {signal && <span className="coach-muted">{signalText(signal)}</span>}
    </span>
  );
}
