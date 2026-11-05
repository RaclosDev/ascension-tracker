import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { apiErrorMessage, formatCoachDate, personName } from '../lib/coach/api';
import {
  SCORE_KEYS,
  SCORE_LABELS,
  useMyCheckin,
  useMyCheckinHistory,
  useSendCheckin,
  type ClientCheckin,
  type Scores,
} from '../lib/coach/checkins';
import { CheckinCard } from '../components/coach/CheckinCard';

const muted = { color: 'var(--text-secondary)' };

/** The client's weekly check-in for one coach, plus what was sent before. */
export default function CoachCheckinPage() {
  const { linkId = '' } = useParams();
  const current = useMyCheckin(linkId);
  const history = useMyCheckinHistory(linkId);
  const past = (history.data ?? []).filter((c) => c.id !== current.data?.current?.id);

  return (
    <div className="fade-in max-w-3xl mx-auto px-4 pt-2 sm:pt-4">
      <Link to="/settings" className="inline-flex items-center gap-1 mb-3" style={muted}>
        <ArrowLeft size={16} aria-hidden /> Ajustes
      </Link>
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Check-in semanal</h1>
        {current.data && (
          <p className="text-sm" style={muted}>
            Para {personName(current.data.coach)} · semana del{' '}
            {formatCoachDate(current.data.weekStart)}
          </p>
        )}
      </header>
      <div className="flex flex-col gap-6">
        {current.isLoading && <p style={muted}>Cargando…</p>}
        {current.isError && <p role="alert">Ya no estás vinculado con este entrenador.</p>}
        {current.data &&
          (current.data.current?.coachReply ? (
            <section className="card">
              <h2 className="card-title">Esta semana</h2>
              <CheckinCard checkin={current.data.current} />
            </section>
          ) : (
            <CheckinForm
              key={current.data.current?.updatedAt ?? 'new'}
              linkId={linkId}
              data={current.data}
            />
          ))}
        {past.length > 0 && (
          <section className="card flex flex-col gap-3">
            <h2 className="card-title">Semanas anteriores</h2>
            {past.map((c) => (
              <CheckinCard key={c.id} checkin={c} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function CheckinForm({ linkId, data }: { linkId: string; data: ClientCheckin }) {
  const send = useSendCheckin(linkId);
  const sent = data.current;
  const [scores, setScores] = useState<Partial<Scores>>(
    sent
      ? {
          energy: sent.energy,
          sleep: sent.sleep,
          trainingAdherence: sent.trainingAdherence,
          dietAdherence: sent.dietAdherence,
        }
      : {},
  );
  const [answers, setAnswers] = useState(() =>
    data.questions.map((_, i) => sent?.answers[i]?.answer ?? ''),
  );
  const [notes, setNotes] = useState(sent?.notes ?? '');
  const complete = SCORE_KEYS.every((k) => scores[k] != null);

  return (
    <form
      className="card flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete) return;
        send.mutate(
          { ...(scores as Scores), answers, notes },
          {
            onSuccess: () => toast.success('Check-in enviado'),
            onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo enviar el check-in')),
          },
        );
      }}
    >
      <h2 className="card-title">{sent ? 'Tu check-in de esta semana' : '¿Qué tal la semana?'}</h2>
      {sent && (
        <p className="text-sm" style={muted}>
          Puedes cambiarlo hasta que tu entrenador responda.
        </p>
      )}
      {SCORE_KEYS.map((key) => (
        <fieldset key={key} className="flex flex-col gap-1">
          <legend className="text-sm mb-1" style={muted}>
            {SCORE_LABELS[key]} (1 = muy mal, 5 = muy bien)
          </legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={`btn ${scores[key] === value ? 'btn-primary' : 'btn-secondary'} cursor-pointer`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={key}
                  value={value}
                  checked={scores[key] === value}
                  onChange={() => setScores({ ...scores, [key]: value })}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {data.questions.map((question, i) => (
        <label key={i} className="flex flex-col gap-1">
          <span className="text-sm" style={muted}>
            {question}
          </span>
          <textarea
            className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
            style={{ borderColor: 'var(--border-subtle)' }}
            rows={2}
            maxLength={1000}
            value={answers[i]}
            onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
          />
        </label>
      ))}
      <label className="flex flex-col gap-1">
        <span className="text-sm" style={muted}>
          Notas para tu entrenador (opcional)
        </span>
        <textarea
          className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
          style={{ borderColor: 'var(--border-subtle)' }}
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="btn btn-primary self-start"
        disabled={!complete || send.isPending}
      >
        {sent ? 'Guardar cambios' : 'Enviar check-in'}
      </button>
    </form>
  );
}
