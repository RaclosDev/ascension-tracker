import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../lib/coach/api';
import { type Checkin, useAddCheckinUpdate } from '../../lib/coach/checkins';
import { useSessionDraft } from '../../hooks/useSessionDraft';

const validDraft = (value: unknown): value is { body: string; version: string } =>
  !!value &&
  typeof value === 'object' &&
  'body' in value &&
  typeof value.body === 'string' &&
  value.body.length <= 2000 &&
  'version' in value &&
  typeof value.version === 'string';

export function CheckinUpdateForm({ linkId, checkin }: { linkId: string; checkin: Checkin }) {
  const update = useAddCheckinUpdate(linkId);
  const draft = useSessionDraft(
    `checkin-update:${linkId}:${checkin.id}`,
    { body: '', version: checkin.updatedAt },
    validDraft,
  );
  const [finalReview, setFinalReview] = useState(false);
  const stale = draft.dirty && draft.value.version !== checkin.updatedAt;
  return (
    <form
      className="flex flex-col gap-2 mt-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (stale || !draft.value.body.trim() || update.isPending) return;
        update.mutate(
          {
            id: checkin.id,
            body: draft.value.body,
            expectedUpdatedAt: checkin.updatedAt,
            finalReview,
          },
          {
            onSuccess: () => {
              draft.clear();
              setFinalReview(false);
              toast.success('Actualización enviada');
            },
            onError: (error) =>
              toast.error(apiErrorMessage(error, 'No se pudo enviar. Tu texto se conserva.')),
          },
        );
      }}
    >
      <label className="flex flex-col gap-1 min-w-0">
        Añadir información a este seguimiento
        <textarea
          className="w-full form-input min-h-11"
          rows={3}
          maxLength={2000}
          value={draft.value.body}
          onChange={(event) => draft.setValue({ ...draft.value, body: event.target.value })}
          placeholder="Por ejemplo: he terminado el último entreno o ha cambiado mi disponibilidad."
        />
      </label>
      <p className="text-sm">Se conserva lo enviado y se avisa a tu entrenador.</p>
      {checkin.submissionStatus === 'PARTIAL' && (
        <label className="flex items-center gap-2 min-h-11">
          <input
            type="checkbox"
            checked={finalReview}
            onChange={(event) => setFinalReview(event.target.checked)}
          />{' '}
          Esta actualización completa mi seguimiento semanal
        </label>
      )}
      {stale && (
        <div role="alert">
          <p>Hay información nueva. Léela antes de enviar.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => draft.setValue({ ...draft.value, version: checkin.updatedAt })}
          >
            He revisado los cambios
          </button>
        </div>
      )}
      {draft.notice && <p role="status">{draft.notice}</p>}
      <button
        className="btn btn-primary self-start"
        disabled={stale || update.isPending || !draft.value.body.trim()}
      >
        Enviar actualización
      </button>
    </form>
  );
}
