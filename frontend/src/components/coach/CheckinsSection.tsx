import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../lib/coach/api';
import { useClientCheckins, useReplyCheckin, type Checkin } from '../../lib/coach/checkins';
import { CheckinCard } from './CheckinCard';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { useQueryClient } from '@tanstack/react-query';

/** Unanswered check-ins first, then newest week within each group. */
export function CheckinsSection({ linkId }: { linkId: string }) {
  const checkins = useClientCheckins(linkId);

  if (checkins.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (checkins.isError)
    return <QueryErrorNotice retry={() => void checkins.refetch()} pending={checkins.isFetching} />;
  if (!checkins.data?.length) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>Tu alumno aún no ha enviado ningún check-in.</p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {[...checkins.data]
        .sort(
          (a, b) =>
            Number(!!a.coachReply) - Number(!!b.coachReply) ||
            b.weekStart.localeCompare(a.weekStart),
        )
        .map((c) => (
          <CheckinCard
            key={c.id}
            checkin={c}
            footer={c.coachReply ? null : <ReplyForm linkId={linkId} checkin={c} />}
          />
        ))}
    </div>
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
      <label
        className="text-sm"
        style={{ color: 'var(--text-secondary)' }}
        htmlFor={`reply-${checkin.id}`}
      >
        Tu respuesta
      </label>
      <textarea
        id={`reply-${checkin.id}`}
        className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
        style={{ borderColor: 'var(--border-subtle)' }}
        rows={3}
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
            El alumno ha cambiado el check-in desde que empezaste la respuesta. Revisa los datos
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
          No se ha enviado la respuesta. El borrador se conserva; revisa el check-in antes de volver
          a enviarlo.
        </p>
      )}
      {draft.dirty && (
        <button
          type="button"
          className="btn btn-secondary self-start"
          disabled={reply.isPending}
          onClick={draft.clear}
        >
          Descartar borrador
        </button>
      )}
      <button
        type="submit"
        className="btn btn-primary self-start"
        disabled={reply.isPending || !text.trim() || changed}
      >
        Responder
      </button>
    </form>
  );
}
