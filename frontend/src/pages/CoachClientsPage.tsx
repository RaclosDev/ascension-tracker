import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { personName, sharedScopes } from '../lib/coach/api';
import { LEVEL_COLORS, signalText } from '../lib/coach/clientStatus';
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

type Filter = 'all' | 'attention' | 'checkin' | 'noProgram';
const FILTERS: { value: Filter; label: string; matches: (row: CoachRow) => boolean }[] = [
  { value: 'all', label: 'Todos', matches: () => true },
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
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.find((f) => f.value === params.get('filtro')) ?? FILTERS[0];
  const search = params.get('q') ?? '';
  const sort = params.get('orden') ?? 'priority';
  const showWeight = params.get('peso') === 'si';
  const update = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
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
  const href = (linkId: string, section = 'resumen') =>
    `${clientHref(linkId, section)}&lista=${encodeURIComponent(params.toString())}`;

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
          <div className="coach-list-controls">
            <label className="coach-search">
              <Search size={18} aria-hidden />
              <span className="sr-only">Buscar alumno</span>
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
          </div>
          <div className="coach-chips" role="group" aria-label="Filtrar alumnos">
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
                : 'El seguimiento de algunos alumnos no está disponible.'}
            </p>
          )}
          {filter.value === 'noProgram' && (
            <p className="coach-description">
              Alumnos que permiten pautar entrenamiento y no tienen un programa activo. Comprueba
              qué habéis acordado antes de asignarlo.
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
              <button type="button" className="btn btn-secondary" onClick={() => setParams({})}>
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
                      <th scope="col">Última actividad</th>
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
                          <span className="coach-muted">{sharedScopes(row.link.permissions)}</span>
                        </td>
                        <td>
                          <ClientState row={row} />
                        </td>
                        <td>{activityText(row.status?.lastActivity)}</td>
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
                        <span className="coach-muted">
                          Última actividad: {activityText(row.status?.lastActivity)}
                        </span>
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

function ClientState({ row }: { row: CoachRow }) {
  if (!row.status) return <span className="coach-muted">Seguimiento no disponible</span>;
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
