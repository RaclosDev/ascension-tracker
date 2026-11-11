import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { personName } from '../lib/coach/api';
import { signalText } from '../lib/coach/clientStatus';
import { clientHref, searchName, useCoachRoster } from '../lib/coach/workspace';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { QueryErrorNotice } from '../components/QueryErrorNotice';

export default function CoachReviewsPage() {
  return (
    <CoachWorkspace>
      <Reviews />
    </CoachWorkspace>
  );
}

function Reviews() {
  const { clients, status, rows, ready } = useCoachRoster();
  const [params, setParams] = useSearchParams();
  const waiting = params.get('vista') === 'esperando';
  const search = params.get('q') ?? '';
  const pending = rows.filter((r) => (r.status?.pendingReplies ?? 0) > 0);
  const missing = rows.filter((r) => r.status?.signals.some((s) => s.reason === 'CHECKIN_MISSING'));
  const visible = (waiting ? missing : pending).filter((r) =>
    searchName(personName(r.link.client)).includes(searchName(search.trim())),
  );
  const count = pending.reduce((n, row) => n + (row.status?.pendingReplies ?? 0), 0);
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
  return (
    <>
      <CoachPageHeader
        title="Revisiones"
        description="Responde a los check-ins y consulta quién tiene semanas pendientes."
      >
        <Link className="btn btn-secondary" to="/entrenador/ajustes">
          Configurar check-in
        </Link>
      </CoachPageHeader>
      <div className="coach-chips" role="group" aria-label="Filtrar revisiones">
        <button
          type="button"
          className="coach-chip"
          aria-pressed={!waiting}
          onClick={() => update('vista', '')}
        >
          Por responder <span className="coach-chip-count">{ready ? count : '—'}</span>
        </button>
        <button
          type="button"
          className="coach-chip"
          aria-pressed={waiting}
          onClick={() => update('vista', 'esperando')}
        >
          Pendiente del alumno{' '}
          <span className="coach-chip-count">{ready ? missing.length : '—'}</span>
        </button>
      </div>
      {clients.isError ? (
        <QueryErrorNotice retry={() => void clients.refetch()} pending={clients.isFetching} />
      ) : status.isError ? (
        <QueryErrorNotice retry={() => void status.refetch()} pending={status.isFetching} />
      ) : !ready ? (
        <p role="status">
          {clients.isPending || status.isPending
            ? 'Cargando revisiones…'
            : 'Falta información de seguimiento. Vuelve a cargar los datos.'}
        </p>
      ) : (
        <>
          <p className="coach-description">
            {waiting
              ? 'Alumnos sin check-in en semanas ya terminadas. Consulta su situación antes de hacer seguimiento.'
              : `${count} ${count === 1 ? 'check-in' : 'check-ins'} por responder de ${pending.length} ${pending.length === 1 ? 'alumno' : 'alumnos'}.`}
          </p>
          <label className="coach-search">
            <Search size={18} aria-hidden />
            <span className="sr-only">Buscar revisión por alumno</span>
            <input
              type="search"
              placeholder="Buscar alumno"
              value={search}
              onChange={(e) => update('q', e.target.value)}
            />
          </label>
          <section
            className="card coach-worklist"
            aria-label={waiting ? 'Pendiente del alumno' : 'Check-ins por responder'}
          >
            {visible.length === 0 ? (
              <div className="coach-empty-inline">
                <h2>
                  {search
                    ? 'No hay coincidencias'
                    : waiting
                      ? 'Sin semanas pendientes'
                      : 'No hay check-ins por responder'}
                </h2>
                <p>
                  {search
                    ? 'Prueba con otro nombre.'
                    : 'Puedes consultar el historial desde la ficha de cada alumno.'}
                </p>
                <Link to="/entrenador/alumnos">Ver alumnos</Link>
              </div>
            ) : (
              <ul className="coach-action-list">
                {visible.map(({ link, status: state }) => {
                  const missingSignal = state?.signals.find((s) => s.reason === 'CHECKIN_MISSING');
                  return (
                    <li key={link.linkId}>
                      <Link
                        to={`${clientHref(link.linkId, 'revisiones')}&origen=revisiones&lista=${encodeURIComponent(params.toString())}`}
                      >
                        <span className="coach-avatar" aria-hidden>
                          {personName(link.client).slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{personName(link.client)}</strong>
                          <small>
                            {waiting && missingSignal
                              ? signalText(missingSignal)
                              : `${state?.pendingReplies} por responder`}
                          </small>
                        </span>
                        <span className="coach-row-action">
                          {waiting ? 'Ver historial' : 'Revisar'}{' '}
                          <ArrowUpRight size={16} aria-hidden />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
