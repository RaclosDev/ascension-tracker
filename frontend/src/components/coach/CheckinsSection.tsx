import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../lib/coach/api';
import { useClientCheckins, useReplyCheckin, type Checkin } from '../../lib/coach/checkins';
import { CheckinCard } from './CheckinCard';

/** The client's weekly check-ins in the coach's view of a client, newest first. */
export function CheckinsSection({ linkId }: { linkId: string }) {
  const checkins = useClientCheckins(linkId);

  if (checkins.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (checkins.isError) return <p role="alert">No se pudieron cargar los check-ins.</p>;
  if (!checkins.data?.length) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>Tu alumno aún no ha enviado ningún check-in.</p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {checkins.data.map((c) => (
        <CheckinCard
          key={c.id}
          checkin={c}
          footer={c.coachReply ? null : <ReplyForm linkId={linkId} checkin={c} />}
        />
      ))}
    </div>
  );
}

function ReplyForm({ linkId, checkin }: { linkId: string; checkin: Checkin }) {
  const reply = useReplyCheckin(linkId);
  const [text, setText] = useState('');
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        reply.mutate(
          { id: checkin.id, reply: text },
          {
            onSuccess: () => toast.success('Respuesta enviada'),
            onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo enviar la respuesta')),
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
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-primary self-start"
        disabled={reply.isPending || !text.trim()}
      >
        Responder
      </button>
    </form>
  );
}
