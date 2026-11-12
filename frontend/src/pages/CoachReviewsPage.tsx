import { Link } from 'react-router-dom';
import { useCoachFilters } from '../lib/coach/useCoachFilters';
import { ArrowUpRight, Search } from 'lucide-react';
import { personName } from '../lib/coach/api';
import { signalText } from '../lib/coach/clientStatus';
import { clientHref, searchName, useCoachRoster } from '../lib/coach/workspace';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { CoachReviewAgenda } from '../components/coach/CoachReviewAgenda';

export default function CoachReviewsPage() {
  return (
    <CoachWorkspace>
      <Reviews />
    </CoachWorkspace>
  );
}

function Reviews() {
  const { clients, status, rows, ready } = useCoachRoster();
  const { params, update } = useCoachFilters();
  const waiting = params.get('vista') === 'esperando';
  const agenda = params.get('vista') === 'agenda';
  const search = params.get('q') ?? '';
  const pending = rows.filter((r) => (r.status?.pendingReplies ?? 0) > 0);
  const missing = rows.filter((r) => r.status?.signals.some((s) => s.reason === 'CHECKIN_MISSING'));
  const visible = (waiting ? missing : pending).filter((r) =>
    searchName(personName(r.link.client)).includes(searchName(search.trim())),
  );
  const count = pending.reduce((n, row) => n + (row.status?.pendingReplies ?? 0), 0);
  return (
    <>
      <CoachPageHeader title="Revisiones">
        <Link className="btn btn-secondary" to="/entrenador/ajustes">
          Configurar check-in
        </Link>
      </CoachPageHeader>
      <div className="coach-chips coach-review-tabs" role="group" aria-label="Filtrar revisiones">
        <button
          type="button"
          className="coach-chip"
          aria-pressed={!waiting && !agenda}
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
          Pendiente del atleta{' '}
          <span className="coach-chip-count">{ready ? missing.length : '—'}</span>
        </button>
        <button
          type="button"
          className="coach-chip"
          aria-pressed={agenda}
          onClick={() => update('vista', 'agenda')}
        >
          Agenda semanal
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
          {!agenda && (
            <p className="coach-description">
              {waiting
                ? 'Atletas que han superado la fecha acordada sin enviar su check-in. Consulta su situación antes de hacer seguimiento.'
                : `${count} ${count === 1 ? 'check-in' : 'check-ins'} por responder de ${pending.length} ${pending.length === 1 ? 'atleta' : 'atletas'}.`}
            </p>
          )}
          <label className="coach-search">
            <Search size={18} aria-hidden />
            <span className="sr-only">Buscar revisión por atleta</span>
            <input
              type="search"
              placeholder="Buscar atleta"
              value={search}
              onChange={(e) => update('q', e.target.value)}
            />
          </label>
          {agenda ? (
            <CoachReviewAgenda rows={rows} search={search} />
          ) : (
            <section
              className="card coach-worklist"
              aria-label={waiting ? 'Pendiente del atleta' : 'Check-ins por responder'}
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
                      : 'Puedes consultar el historial desde la ficha de cada atleta.'}
                  </p>
                  <Link to="/entrenador/atletas">Ver atletas</Link>
                </div>
              ) : (
                <ul className="coach-action-list">
                  {visible.map(({ link, status: state }) => {
                    const missingSignal = state?.signals.find(
                      (s) => s.reason === 'CHECKIN_MISSING',
                    );
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
          )}
        </>
      )}
    </>
  );
}
