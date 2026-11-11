import { Link } from 'react-router-dom';
import { useCoachFilters } from '../lib/coach/useCoachFilters';
import { ArrowUpRight, Search } from 'lucide-react';
import { personName, sharedScopes } from '../lib/coach/api';
import { LEVEL_COLORS, signalText } from '../lib/coach/clientStatus';
import { clientTasks } from '../lib/coach/tasks';
import { SERVICE_LABELS, serviceNames } from '../lib/coach/setup';
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
import { ClientAvatar } from '../components/coach/ClientAvatar';

type Filter =
  | 'all'
  | 'attention'
  | 'checkin'
  | 'noProgram'
  | 'setup'
  | 'tasks'
  | 'waiting'
  | 'paused'
  | 'nextWeek';
const FILTERS: { value: Filter; label: string; matches: (row: CoachRow) => boolean }[] = [
  { value: 'all', label: 'Todos', matches: () => true },
  {
    value: 'nextWeek',
    label: 'Semana por preparar',
    matches: (r) =>
      r.link.setup?.services.training === true &&
      (r.status?.nextWeekStatus === 'MISSING' || r.status?.nextWeekStatus === 'DRAFT'),
  },
  { value: 'paused', label: 'En pausa', matches: (r) => !!r.link.followup?.schedule.paused },
  { value: 'setup', label: 'Incorporación', matches: (r) => !r.link.setup?.reviewed },
  {
    value: 'tasks',
    label: 'Tareas del entrenador',
    matches: (r) => clientTasks(r).some((t) => t.owner === 'coach'),
  },
  {
    value: 'waiting',
    label: 'Pendiente del atleta',
    matches: (r) => clientTasks(r).some((t) => t.owner === 'client'),
  },
  {
    value: 'attention',
    label: 'Por revisar',
    matches: (r) => followupSignals(r.status).length > 0,
  },
  { value: 'checkin', label: 'Por responder', matches: (r) => (r.status?.pendingReplies ?? 0) > 0 },
  {
    value: 'noProgram',
    label: 'Sin programa',
    matches: (r) => !!r.status?.signals.some((s) => s.reason === 'NO_PROGRAM'),
  },
];
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
  const filter = FILTERS.find((f) => f.value === params.get('filtro')) ?? FILTERS[0];
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
      <CoachPageHeader title="Atletas">
        <InviteClientButton />
      </CoachPageHeader>
      {clients.isPending ? (
        <p role="status">Cargando atletas…</p>
      ) : clients.isError ? (
        <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
      ) : rows.length === 0 ? (
        <section className="card coach-empty-inline">
          <h2>Aún no tienes atletas</h2>
          <p>Invita a tu primer atleta para empezar a trabajar juntos.</p>
        </section>
      ) : (
        <>
          <div className="coach-list-controls">
            <label className="coach-search">
              <Search size={18} aria-hidden />
              <span className="sr-only">Buscar atleta</span>
              <input
                type="search"
                placeholder="Buscar por nombre"
                value={search}
                onChange={(e) => update('q', e.target.value)}
              />
            </label>
            <label className="coach-sort">
              <span>Ordenar</span>
              <select value={sort} onChange={(e) => update('orden', e.target.value)}>
                <option value="priority">Prioridad</option>
                <option value="name">Nombre</option>
                <option value="recent">Altas recientes</option>
              </select>
            </label>
            <label className="coach-weight-toggle">
              <input
                type="checkbox"
                checked={showWeight}
                onChange={(e) => update('peso', e.target.checked ? 'si' : '')}
              />{' '}
              Mostrar peso
            </label>
            <label className="coach-sort">
              <span>Servicio</span>
              <select value={service} onChange={(e) => update('servicio', e.target.value)}>
                <option value="">Todos los servicios</option>
                {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="coach-chips" role="group" aria-label="Filtrar atletas">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className="coach-chip"
                aria-pressed={filter.value === f.value}
                disabled={f.value !== 'all' && !ready}
                onClick={() => update('filtro', f.value === 'all' ? '' : f.value)}
              >
                {f.label}{' '}
                <span className="coach-chip-count">
                  {f.value === 'all' || ready ? rows.filter(f.matches).length : '—'}
                </span>
              </button>
            ))}
          </div>
          {status.isError && (
            <QueryErrorNotice retry={() => void status.refetch()} pending={status.isFetching} />
          )}
          {!ready && !status.isError && (
            <p role="status">
              {status.isPending
                ? 'Cargando seguimiento…'
                : 'El seguimiento de algunos atletas no está disponible.'}
            </p>
          )}
          {filter.value === 'noProgram' && (
            <p className="coach-description">
              Atletas con servicio de entrenamiento acordado, permiso para pautarlo y sin programa
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
                ver todos los atletas
              </button>
              .
            </p>
          ) : visible.length === 0 ? (
            <div className="card coach-empty-inline">
              <h2>No hay atletas con estos filtros</h2>
              <button type="button" className="btn btn-secondary" onClick={clear}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <p className="coach-list-count" role="status">
                {visible.length} de {rows.length} atletas
              </p>
              <div className="card coach-table-wrap">
                <table className="coach-table">
                  <caption className="sr-only">Seguimiento de atletas</caption>
                  <thead>
                    <tr>
                      <th scope="col">Atleta</th>
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
                          <div className="coach-client-identity">
                            <ClientAvatar client={row.link.client} />
                            <div>
                              <Link className="coach-row-link" to={href(row.link.linkId)}>
                                {personName(row.link.client)}
                              </Link>
                              <span className="coach-muted">
                                Acceso: {sharedScopes(row.link.permissions)}
                              </span>
                              {row.link.setup && (
                                <span className="coach-muted">{serviceNames(row.link.setup)}</span>
                              )}
                            </div>
                          </div>
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
  return (
    <ul className="mt-2 space-y-2">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            className="text-sm underline inline-flex items-center min-h-11 py-2"
            to={href(row.link.linkId, task.section)}
          >
            {task.title}
          </Link>
        </li>
      ))}
    </ul>
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
