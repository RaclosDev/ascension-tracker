import { Link } from 'react-router-dom';
import { useCoachFilters } from '../lib/coach/useCoachFilters';
import { ArrowRight, ArrowUpRight, Check, Clock3, Search } from 'lucide-react';
import { personName } from '../lib/coach/api';
import { clientTasks } from '../lib/coach/tasks';
import { SERVICE_LABELS } from '../lib/coach/setup';
import {
  activityText,
  clientHref,
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
import '../styles/coach-roster.css';
import { Select } from '@/components/ui/select';

interface Filter {
  value: string;
  label: string;
  matches: (row: CoachRow) => boolean;
}
const weekPending = ({ link, status }: CoachRow) =>
  link.setup?.services.training === true &&
  link.permissions.training &&
  (status?.nextWeekStatus === 'MISSING' || status?.nextWeekStatus === 'DRAFT');
const ALL: Filter = { value: '', label: 'Todos los atletas', matches: () => true };
const STATE_FILTERS: Filter[] = [
  {
    value: 'tasks',
    label: 'Con pendientes',
    matches: (r) => clientTasks(r).some((t) => t.owner === 'coach'),
  },
  { value: 'nextWeek', label: 'Semana por preparar', matches: weekPending },
  {
    value: 'checkin',
    label: 'Seguimientos por responder',
    matches: (r) => (r.status?.pendingReplies ?? 0) > 0,
  },
  {
    value: 'waiting',
    label: 'Pendiente del atleta',
    matches: (r) => clientTasks(r).some((t) => t.owner === 'client'),
  },
  {
    value: 'attention',
    label: 'Con alertas',
    matches: (r) => followupSignals(r.status).length > 0,
  },
  {
    value: 'noProgram',
    label: 'Sin programa',
    matches: (r) => !!r.status?.signals.some((s) => s.reason === 'NO_PROGRAM'),
  },
  { value: 'setup', label: 'Incorporación', matches: (r) => !r.link.setup?.reviewed },
  { value: 'paused', label: 'En pausa', matches: (r) => !!r.link.followup?.schedule.paused },
];
const SERVICE_FILTERS: Filter[] = Object.entries(SERVICE_LABELS).map(([key, label]) => ({
  value: `servicio-${key}`,
  label,
  matches: (r) =>
    Object.entries(r.link.setup?.services ?? {}).some(([name, active]) => name === key && active),
}));
const FILTERS = [ALL, ...STATE_FILTERS, ...SERVICE_FILTERS];

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
  const filter = FILTERS.find((f) => f.value === params.get('filtro')) ?? ALL;
  const search = params.get('q') ?? '';
  const sort = params.get('orden') ?? 'priority';
  const visible = rows.filter(
    (r) =>
      filter.matches(r) &&
      searchName(personName(r.link.client)).includes(searchName(search.trim())),
  );
  if (sort === 'name')
    visible.sort((a, b) =>
      personName(a.link.client).localeCompare(personName(b.link.client), 'es'),
    );
  if (sort === 'recent') visible.sort((a, b) => b.link.since.localeCompare(a.link.since));
  const listQuery = params.toString();
  const href = (linkId: string, section?: string) =>
    `${clientHref(linkId, section)}${section ? '&' : '?'}lista=${encodeURIComponent(listQuery)}`;
  const registerHref = (linkId: string) =>
    `/entrenador/atletas/${encodeURIComponent(linkId)}/registro?${new URLSearchParams({ lista: listQuery })}`;
  const count = (f: Filter) => (f === ALL || ready ? ` (${rows.filter(f.matches).length})` : '');

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
          <div className="coach-list-controls coach-roster-toolbar">
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
              <span>Mostrar</span>
              <Select
                aria-label="Filtrar atletas"
                value={filter.value}
                onChange={(e) => update('filtro', e.target.value)}
              >
                <option value="">
                  {ALL.label}
                  {count(ALL)}
                </option>
                <optgroup label="Por estado">
                  {STATE_FILTERS.map((f) => (
                    <option key={f.value} value={f.value} disabled={!ready}>
                      {f.label}
                      {count(f)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Por servicio">
                  {SERVICE_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                      {count(f)}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </label>
            <label className="coach-sort">
              <span>Ordenar</span>
              <Select value={sort} onChange={(e) => update('orden', e.target.value)}>
                <option value="priority">Prioridad</option>
                <option value="name">Nombre</option>
                <option value="recent">Altas recientes</option>
              </Select>
            </label>
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
          {!ready && STATE_FILTERS.includes(filter) ? (
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
                {visible.length === rows.length
                  ? `${rows.length} atletas`
                  : `${visible.length} de ${rows.length} atletas`}
              </p>
              <div className="card coach-table-wrap coach-roster-wrap">
                <table className="coach-table coach-roster-table">
                  <caption className="sr-only">Seguimiento de atletas</caption>
                  <thead>
                    <tr>
                      <th scope="col">Atleta</th>
                      <th scope="col">Semana siguiente</th>
                      <th scope="col">Último registro</th>
                      <th scope="col">Último seguimiento</th>
                      <th scope="col">Siguiente paso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.link.linkId}>
                        <td>
                          <div className="coach-client-identity">
                            <ClientAvatar client={row.link.client} />
                            <Link className="coach-row-link" to={href(row.link.linkId)}>
                              {personName(row.link.client)}
                            </Link>
                          </div>
                        </td>
                        <td>
                          <WeekStatus row={row} />
                        </td>
                        <td>
                          <Link
                            className="coach-roster-register"
                            to={registerHref(row.link.linkId)}
                            aria-label={`Registro de ${personName(row.link.client)}: ${activityText(row.status?.lastActivity)}`}
                          >
                            {activityText(row.status?.lastActivity)}
                          </Link>
                        </td>
                        <td>
                          <span className="coach-muted">{checkinText(row)}</span>
                        </td>
                        <td>
                          <NextStep row={row} href={href} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="card coach-cards coach-roster-cards">
                {visible.map((row) => (
                  <li key={row.link.linkId}>
                    <Link className="coach-card-link" to={href(row.link.linkId)}>
                      <ClientAvatar client={row.link.client} />
                      <span className="min-w-0 flex-1 flex flex-col gap-1">
                        <strong className="coach-card-name">{personName(row.link.client)}</strong>
                        <span className="coach-muted">
                          Último registro: {activityText(row.status?.lastActivity)}
                        </span>
                        {row.link.permissions.training && row.status?.nextWeekStatus && (
                          <span className="coach-muted">
                            Semana siguiente: {weekText(row.status.nextWeekStatus).toLowerCase()}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight size={18} aria-hidden />
                    </Link>
                    <NextStep row={row} href={href} />
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

/** The one thing to do with this athlete now: what the coach owes first, then the week, then waiting. */
function NextStep({
  row,
  href,
}: {
  row: CoachRow;
  href: (linkId: string, section: string) => string;
}) {
  const tasks = clientTasks(row);
  const task = tasks.find((t) => t.owner === 'coach');
  if (task)
    return (
      <Link
        className="coach-roster-action coach-roster-action-primary"
        to={href(row.link.linkId, task.section)}
      >
        <span className="coach-roster-action-text">
          {task.title}
          {task.id !== 'reply' && <small>{task.detail}</small>}
        </span>
        {task.id === 'reply' && (
          <span
            className="coach-roster-reply-count"
            aria-label={`${row.status?.pendingReplies} por responder`}
          >
            {row.status?.pendingReplies}
          </span>
        )}
        <ArrowRight size={15} aria-hidden />
      </Link>
    );
  if (weekPending(row))
    return (
      <Link
        className="coach-roster-action coach-roster-action-primary"
        to={href(row.link.linkId, 'semana')}
      >
        <span>
          {row.status?.nextWeekStatus === 'DRAFT' ? 'Terminar semana' : 'Preparar semana'}
        </span>
        <ArrowRight size={15} aria-hidden />
      </Link>
    );
  if (tasks[0])
    return (
      <Link className="coach-roster-action" to={href(row.link.linkId, tasks[0].section)}>
        <span className="coach-roster-action-text">
          {tasks[0].title}
          <small>{tasks[0].detail}</small>
        </span>
        <ArrowRight size={15} aria-hidden />
      </Link>
    );
  return (
    <span className="coach-roster-quiet">
      {row.link.followup?.schedule.paused ? (
        <>
          <Clock3 size={15} aria-hidden /> En pausa
        </>
      ) : !row.status ? (
        'Seguimiento no disponible'
      ) : (
        <>
          <Check size={15} aria-hidden /> Al día
        </>
      )}
    </span>
  );
}

/** When the last seguimiento came in and whose turn it is now. */
function checkinText({ status }: CoachRow) {
  if (!status) return 'No disponible';
  const late = status.signals.find((signal) => signal.reason === 'CHECKIN_MISSING')?.value;
  if (status.pendingReplies > 0) return `${activityText(status.lastCheckin)} · por responder`;
  if (late) return late === 1 ? 'Atrasado 1 semana' : `Atrasado ${late} semanas`;
  return status.lastCheckin
    ? `${activityText(status.lastCheckin)} · respondido`
    : 'Sin seguimientos';
}

const weekText = (state: NonNullable<NonNullable<CoachRow['status']>['nextWeekStatus']>) =>
  state === 'SCHEDULED' ? 'Publicada' : state === 'DRAFT' ? 'Borrador' : 'Sin preparar';

function WeekStatus({ row }: { row: CoachRow }) {
  if (!row.link.permissions.training) return <span className="coach-muted">—</span>;
  if (!row.status) return <span className="coach-muted">No disponible</span>;
  const state = row.status.nextWeekStatus;
  if (!state) return <span className="coach-muted">—</span>;
  return (
    <span className="coach-roster-week" data-state={state}>
      {state === 'SCHEDULED' ? <Check size={15} aria-hidden /> : <Clock3 size={15} aria-hidden />}
      <span>{weekText(state)}</span>
    </span>
  );
}
