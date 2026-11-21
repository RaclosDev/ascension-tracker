import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PowerProfile } from '../../lib/coach/powerlifting';
import { meetTotals, newPowerMeet, usePowerMeets } from '../../lib/coach/powerMeets';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { PowerMeetForm } from './PowerMeetForm';

export function PowerMeets({
  linkId,
  profile,
  canEdit,
}: {
  linkId: string;
  profile: PowerProfile;
  canEdit: boolean;
}) {
  const meets = usePowerMeets(linkId);
  const [params, setParams] = useSearchParams();
  const selected = params.get('competicion');
  const [showArchived, setShowArchived] = useState(false);
  const choose = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('competicion', id);
    else next.delete('competicion');
    setParams(next);
  };
  if (meets.isPending) return <p role="status">Cargando competiciones…</p>;
  if (meets.isError)
    return <QueryErrorNotice pending={meets.isFetching} retry={() => void meets.refetch()} />;
  const saved =
    selected === 'nueva' && canEdit
      ? newPowerMeet(linkId, profile)
      : meets.data.find((m) => m.id === selected);
  const today = new Date().toLocaleDateString('sv-SE');
  return (
    <div className="flex flex-col gap-5">
      {selected ? (
        <>
          <button className="btn btn-secondary self-start" onClick={() => choose(null)}>
            Volver a competiciones
          </button>
          {saved ? (
            <PowerMeetForm
              key={`${saved.id}:${saved.version}:${canEdit}`}
              saved={saved}
              canEdit={canEdit}
              reload={() => void meets.refetch()}
              onSaved={choose}
            />
          ) : (
            <p role="alert">Competición no disponible.</p>
          )}
        </>
      ) : (
        <>
          <div className="pw-toolbar">
            <div className="pw-toolbar-text">
              <h3>Calendario de competiciones</h3>
            </div>
            <label className="pw-check">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Mostrar archivadas
            </label>
            {canEdit && (
              <button className="btn btn-primary" onClick={() => choose('nueva')}>
                Nueva competición
              </button>
            )}
          </div>
          {meets.data.filter((m) => showArchived || !m.content.archived).length === 0 && (
            <p className="pw-empty">
              No hay competiciones en esta vista. Añade una fecha para organizar la preparación y
              los intentos.
            </p>
          )}
          <ul className="pw-meets">
            {meets.data
              .filter((m) => showArchived || !m.content.archived)
              .map((meet) => {
                const totals = meetTotals(meet.content.attempts);
                return (
                  <li key={meet.id}>
                    <button className="card pw-meet" onClick={() => choose(meet.id)}>
                      <span className="pw-meet-date">
                        {new Date(`${meet.content.date}T12:00:00`).toLocaleDateString('es-ES')}
                        <span
                          className="pw-status"
                          data-status={
                            !meet.content.archived && meet.content.date >= today
                              ? 'ACTIVE'
                              : undefined
                          }
                        >
                          {meet.content.archived
                            ? 'Archivada'
                            : meet.content.date < today
                              ? 'Pasada'
                              : 'Próxima'}
                        </span>
                      </span>
                      <strong>{meet.content.name}</strong>
                      <span>
                        {meet.content.blocks.length} bloques ·{' '}
                        {meet.content.category || 'Categoría sin definir'}
                      </span>
                      <span>
                        {totals.actual !== null
                          ? `${totals.finished ? 'Registrado' : 'Provisional'}: ${totals.actual} kg`
                          : 'Sin total registrado'}
                        {meet.content.targetTotal
                          ? ` · Objetivo: ${meet.content.targetTotal} kg`
                          : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </div>
  );
}
