import { Link } from 'react-router-dom';
import { useCoachFilters } from '../lib/coach/useCoachFilters';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  CalendarDays,
  Clock3,
  Dumbbell,
  Footprints,
  Scale,
  Search,
  SlidersHorizontal,
  Utensils,
} from 'lucide-react';
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
    label: 'Con pendientes',
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
  {
    value: 'checkin',
    label: 'Seguimientos por responder',
    matches: (r) => (r.status?.pendingReplies ?? 0) > 0,
  },
  {
    value: 'noProgram',
    label: 'Sin programa',
    matches: (r) => !!r.status?.signals.some((s) => s.reason === 'NO_PROGRAM'),
  },
];
const PRIMARY_FILTERS: Filter[] = ['all', 'tasks', 'nextWeek', 'checkin'];
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
  const href = (linkId: string, section = 'resumen') =>
    `${clientHref(linkId, section)}&lista=${encodeURIComponent(params.toString())}`;

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
              <span>Ordenar</span>
              <select value={sort} onChange={(e) => update('orden', e.target.value)}>
                <option value="priority">Prioridad</option>
                <option value="name">Nombre</option>
                <option value="recent">Altas recientes</option>
              </select>
            </label>
            <details className="coach-roster-options">
              <summary>
                <SlidersHorizontal size={17} aria-hidden /> Opciones
                {(service || showWeight) && (
                  <span className="coach-options-active" aria-label="Opciones activas" />
                )}
              </summary>
              <div className="coach-roster-options-panel">
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
            </details>
          </div>
          <div
            className="coach-chips coach-roster-filters"
            role="group"
            aria-label="Filtrar atletas"
          >
            {FILTERS.filter((f) => PRIMARY_FILTERS.includes(f.value)).map((f) => (
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
            <label className="coach-more-filters">
              <span className="sr-only">Más filtros</span>
              <select
                aria-label="Más filtros"
                value={PRIMARY_FILTERS.includes(filter.value) ? '' : filter.value}
                disabled={!ready}
                onChange={(e) => update('filtro', e.target.value)}
              >
                <option value="">Más filtros</option>
                {FILTERS.filter((f) => !PRIMARY_FILTERS.includes(f.value)).map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} ({rows.filter(f.matches).length})
                  </option>
                ))}
              </select>
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
                {visible.length === rows.length
                  ? `${rows.length} atletas`
                  : `${visible.length} de ${rows.length} atletas`}
              </p>
              <div className="card coach-table-wrap coach-roster-wrap">
                <table className="coach-table coach-roster-table" data-show-weight={showWeight}>
                  <caption className="sr-only">Seguimiento de atletas</caption>
                  <thead>
                    <tr>
                      <th scope="col">Atleta</th>
                      <th scope="col">Pendientes</th>
                      <th scope="col">Última actividad</th>
                      <th scope="col">Semana siguiente</th>
                      {showWeight && <th scope="col">Peso (4 sem.)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.link.linkId}>
                        <td>
                          <div className="coach-client-identity">
                            <ClientAvatar client={row.link.client} />
                            <div className="coach-roster-person">
                              <div className="coach-roster-name-line">
                                <Link className="coach-row-link" to={href(row.link.linkId)}>
                                  {personName(row.link.client)}
                                </Link>
                                <RegisterLink
                                  linkId={row.link.linkId}
                                  listQuery={params.toString()}
                                />
                              </div>
                              <QuickLinks row={row} listQuery={params.toString()} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <TaskLinks row={row} href={href} />
                        </td>
                        <td>
                          <span className="coach-roster-activity">
                            {row.link.permissions.training
                              ? `Entreno: ${activityText(row.status?.lastWorkout)}`
                              : `Actividad: ${activityText(row.status?.lastActivity)}`}
                          </span>
                          <span className="coach-muted">
                            Seguimiento: {activityText(row.status?.lastCheckin)}
                          </span>
                        </td>
                        <td>
                          <WeekStatus row={row} href={href} />
                        </td>
                        {showWeight && (
                          <td>
                            {row.link.permissions.body && row.status?.weightChange != null
                              ? `${weightFormat.format(row.status.weightChange)} kg`
                              : '—'}
                          </td>
                        )}
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
                          Última actividad: {activityText(row.status?.lastActivity)}
                        </span>
                        {row.link.permissions.training && (
                          <span className="coach-muted">
                            Último entreno: {activityText(row.status?.lastWorkout)} · Próxima
                            semana:{' '}
                            {row.status?.nextWeekStatus === 'SCHEDULED'
                              ? 'publicada'
                              : row.status?.nextWeekStatus === 'DRAFT'
                                ? 'borrador'
                                : 'sin preparar'}
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
                    <RegisterLink linkId={row.link.linkId} listQuery={params.toString()} />
                    <QuickLinks row={row} listQuery={params.toString()} />
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

function quickOptions({ link }: Pick<CoachRow, 'link'>) {
  const services = link.setup?.services;
  return [
    {
      section: 'entrenos',
      label: 'Entrenos',
      icon: Dumbbell,
      visible: link.permissions.training && services?.training !== false,
    },
    {
      section: 'comidas',
      label: 'Comidas',
      icon: Utensils,
      visible: link.permissions.nutrition && services?.nutrition !== false,
    },
    {
      section: 'pasos',
      label: 'Pasos',
      icon: Footprints,
      visible: link.permissions.body && services?.progress !== false,
    },
    {
      section: 'peso',
      label: 'Peso',
      icon: Scale,
      visible: link.permissions.body && services?.progress !== false,
    },
  ].filter((option) => option.visible);
}

function QuickLinks({ row, listQuery }: { row: CoachRow; listQuery: string }) {
  const options = quickOptions(row);
  if (!options.length) return null;
  const query = listQuery ? `?${new URLSearchParams({ lista: listQuery })}` : '';
  const athletePath = `/entrenador/atletas/${encodeURIComponent(row.link.linkId)}`;
  return (
    <div
      className="coach-quick-links"
      role="group"
      aria-label={`Consulta semanal de ${personName(row.link.client)}`}
    >
      {options.map(({ section, label, icon: Icon }) => (
        <Link
          key={section}
          to={`${athletePath}/${section}${query}`}
          aria-label={`Ver ${label.toLocaleLowerCase('es')} de esta semana de ${personName(row.link.client)}`}
        >
          <Icon size={15} aria-hidden />
          {label}
        </Link>
      ))}
    </div>
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
  if (tasks.length === 0) {
    const pendingWeek =
      row.link.setup?.services.training &&
      row.link.permissions.training &&
      row.status?.nextWeekStatus !== 'SCHEDULED';
    return (
      <span className="coach-roster-quiet">
        {row.link.followup?.schedule.paused ? (
          <>
            <Clock3 size={15} aria-hidden /> En pausa
          </>
        ) : !row.status ? (
          'Seguimiento no disponible'
        ) : pendingWeek ? (
          'Semana pendiente'
        ) : (
          <>
            <Check size={15} aria-hidden /> Al día
          </>
        )}
      </span>
    );
  }
  return (
    <ul className="coach-roster-tasks">
      {tasks.map((task, index) => (
        <li key={task.id}>
          <Link
            className={`coach-roster-action${index === 0 ? ' coach-roster-action-primary' : ''}`}
            to={href(row.link.linkId, task.section)}
            title={task.detail}
          >
            {task.id === 'reply' ? (
              <ClipboardCheck size={16} aria-hidden />
            ) : (
              <Clock3 size={16} aria-hidden />
            )}
            <span>{task.id === 'reply' ? 'Responder seguimiento' : task.title}</span>
            {task.id === 'reply' && (
              <span
                className="coach-roster-reply-count"
                aria-label={`${row.status?.pendingReplies} pendientes`}
              >
                {row.status?.pendingReplies}
              </span>
            )}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function WeekStatus({
  row,
  href,
}: {
  row: CoachRow;
  href: (id: string, section: string) => string;
}) {
  if (!row.link.permissions.training) return <span className="coach-muted">—</span>;
  if (!row.status) return <span className="coach-muted">No disponible</span>;
  const state = row.status.nextWeekStatus;
  if (!state) return <span className="coach-muted">—</span>;
  return (
    <Link className="coach-roster-week" data-state={state} to={href(row.link.linkId, 'semana')}>
      {state === 'SCHEDULED' ? <Check size={15} aria-hidden /> : <Clock3 size={15} aria-hidden />}
      <span>
        {state === 'SCHEDULED' ? 'Publicada' : state === 'DRAFT' ? 'Borrador' : 'Sin preparar'}
      </span>
      <ArrowRight size={14} aria-hidden />
    </Link>
  );
}

function RegisterLink({ linkId, listQuery }: { linkId: string; listQuery: string }) {
  return (
    <Link
      className="coach-register-link"
      to={`/entrenador/atletas/${linkId}/registro?${new URLSearchParams({ lista: listQuery })}`}
    >
      <CalendarDays size={14} aria-hidden /> Resumen
    </Link>
  );
}
