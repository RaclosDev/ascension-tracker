import { useState } from 'react';
import { SegmentedControl } from '../ui/segmented-control';
import toast from 'react-hot-toast';
import { apiErrorMessage, formatCoachDate } from '../../lib/coach/api';
import {
  useClientCheckins,
  useReplyCheckin,
  needsReply,
  type Checkin,
} from '../../lib/coach/checkins';
import { CheckinCard } from './CheckinCard';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { useQueryClient } from '@tanstack/react-query';

const matches = (filter: string, item: Checkin) =>
  filter === 'all' || (filter === 'pending' ? needsReply(item) : !needsReply(item));

/** Unanswered seguimientos first, then newest week within each group. */
export function CheckinsSection({ linkId }: { linkId: string }) {
  const checkins = useClientCheckins(linkId);
  const [chosen, setFilter] = useState<string | null>(null);
  const all = checkins.data ?? [];
  const pending = all.filter(needsReply).length;
  // Until the coach picks a view, open on what still needs an answer.
  const filter = chosen ?? (pending > 0 ? 'pending' : 'all');
  const visible = all
    .filter((item) => matches(filter, item))
    .sort(
      (a, b) =>
        Number(needsReply(b)) - Number(needsReply(a)) || b.weekStart.localeCompare(a.weekStart),
    );

  return (
    <section className="athlete-checkins flex flex-col gap-4">
      <div className="athlete-section-title">
        <div>
          <h2>Seguimientos semanales</h2>
          {all.length > 0 && (
            <p className="coach-description">
              {pending === 0
                ? 'Todo respondido.'
                : pending === 1
                  ? '1 seguimiento espera tu respuesta.'
                  : `${pending} seguimientos esperan tu respuesta.`}
            </p>
          )}
        </div>
        {all.length > 0 && (
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'pending', label: `Pendientes (${pending})` },
              { value: 'replied', label: `Respondidos (${all.length - pending})` },
              { value: 'all', label: `Todos (${all.length})` },
            ]}
          />
        )}
      </div>
      {checkins.isLoading ? (
        <p role="status" className="coach-description">
          Cargando…
        </p>
      ) : checkins.isError ? (
        <QueryErrorNotice retry={() => void checkins.refetch()} pending={checkins.isFetching} />
      ) : !all.length ? (
        <p className="card coach-description">Tu atleta aún no ha enviado ningún seguimiento.</p>
      ) : (
        <>
          {visible.length === 0 && (
            <p role="status" className="card coach-description">
              No hay seguimientos en esta vista.
            </p>
          )}
          {visible.map((c, index) => {
            const open = needsReply(c);
            const card = (
              <CheckinCard
                checkin={c}
                status={
                  <span className={`checkin-status${open ? ' checkin-status-pending' : ''}`}>
                    {!open
                      ? 'Respondido'
                      : c.coachReply
                        ? 'Actualizado por el atleta'
                        : 'Por responder'}
                  </span>
                }
                footer={open ? <ReplyForm linkId={linkId} checkin={c} /> : null}
              />
            );
            // With several weeks on screen, answered ones fold so the open ones stand out.
            return open || visible.length === 1 ? (
              <div key={c.id}>{card}</div>
            ) : (
              <details key={c.id} className="checkin-folded" open={index === 0}>
                <summary>
                  <strong>Semana del {formatCoachDate(c.weekStart)}</strong>
                  <span className="checkin-status">Respondido</span>
                </summary>
                {card}
              </details>
            );
          })}
        </>
      )}
    </section>
  );
}

type ReplyDraft = { text: string; version: string };
function isReplyDraft(value: unknown): value is ReplyDraft {
  return (
    !!value &&
    typeof value === 'object' &&
    'text' in value &&
    'version' in value &&
    typeof value.text === 'string' &&
    value.text.length <= 2000 &&
    typeof value.version === 'string'
  );
}

function ReplyForm({ linkId, checkin }: { linkId: string; checkin: Checkin }) {
  const reply = useReplyCheckin(linkId);
  const queryClient = useQueryClient();
  const draft = useSessionDraft(
    `reply:${linkId}:${checkin.id}`,
    { text: '', version: checkin.updatedAt },
    isReplyDraft,
  );
  const text = draft.value.text;
  const changed = draft.dirty && draft.value.version !== checkin.updatedAt;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim() || changed || reply.isPending) return;
        reply.mutate(
          { id: checkin.id, reply: text, expectedUpdatedAt: draft.value.version },
          {
            onSuccess: () => {
              draft.clear();
              toast.success('Respuesta enviada');
            },
            onError: (err) => {
              toast.error(apiErrorMessage(err, 'No se pudo enviar la respuesta'));
              void queryClient.invalidateQueries({
                queryKey: ['coach', 'client', linkId, 'checkins'],
              });
            },
          },
        );
      }}
    >
      <label className="text-sm font-semibold" htmlFor={`reply-${checkin.id}`}>
        Tu respuesta
      </label>
      <textarea
        id={`reply-${checkin.id}`}
        className="form-input min-w-0"
        rows={6}
        maxLength={2000}
        disabled={reply.isPending}
        value={text}
        onChange={(e) => draft.setValue({ ...draft.value, text: e.target.value })}
      />
      {draft.notice && (
        <p className="text-sm" role="status">
          {draft.notice}
        </p>
      )}
      {changed && (
        <div role="alert">
          <p>
            El atleta ha cambiado el seguimiento desde que empezaste la respuesta. Revisa los datos
            actualizados.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => draft.setValue({ text, version: checkin.updatedAt })}
          >
            He revisado los cambios
          </button>
        </div>
      )}
      {reply.isError && (
        <p role="alert">
          No se ha enviado la respuesta. El borrador se conserva; revisa el seguimiento antes de
          volver a enviarlo.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={reply.isPending || !text.trim() || changed}
        >
          Responder
        </button>
        {draft.dirty && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={reply.isPending}
            onClick={draft.clear}
          >
            Descartar borrador
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
          {text.length}/2000
        </span>
      </div>
    </form>
  );
}
