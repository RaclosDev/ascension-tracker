import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
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
import { CheckinUpdateForm } from '../components/coach/CheckinUpdateForm';
import { PushToggle } from '../components/coach/PushToggle';
import { nextReviewLabel, scheduleLabel } from '../lib/coach/coachSchedule';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { useSessionDraft } from '../hooks/useSessionDraft';
import { isAxiosError } from 'axios';

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
        {current.isError &&
          (isAxiosError(current.error) && current.error.response?.status === 404 ? (
            <p role="alert">
              Ya no estás vinculado con este entrenador. Puedes consultar las semanas anteriores.
            </p>
          ) : (
            <QueryErrorNotice retry={() => void current.refetch()} pending={current.isFetching} />
          ))}
        {current.data && (
          <>
            {current.data.followup && (
              <section className="card">
                <h2>Tu horario de revisión</h2>
                <p>{scheduleLabel(current.data.followup.schedule)}</p>
                <p className="coach-description">
                  {current.data.followup.schedule.paused
                    ? 'El seguimiento está en pausa. Puedes enviar un check-in, pero no recibirás recordatorios.'
                    : current.data.followup.nextDueAt
                      ? `Próxima fecha: ${nextReviewLabel(current.data.followup)}. Puedes enviarlo antes.`
                      : 'Tu entrenador está preparando el seguimiento. Aún no hay una fecha de revisión confirmada.'}
                </p>
              </section>
            )}
            <PushToggle text="Activa los avisos para recibir el recordatorio en el horario acordado y saber cuándo te responde tu entrenador." />
          </>
        )}
        {current.data &&
          (current.data.current?.coachReply ? (
            <section className="card">
              <h2 className="card-title">Esta semana</h2>
              <CheckinCard checkin={current.data.current} />
              <CheckinUpdateForm linkId={linkId} checkin={current.data.current} />
            </section>
          ) : (
            <CheckinForm
              key={`${linkId}:${current.data.weekStart}:${current.data.current?.updatedAt ?? JSON.stringify(current.data.questions)}`}
              linkId={linkId}
              data={current.data}
            />
          ))}
        {history.isError && (
          <QueryErrorNotice retry={() => void history.refetch()} pending={history.isFetching} />
        )}
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

type CheckinDraft = { scores: Partial<Scores>; answers: string[]; notes: string };
function isCheckinDraft(value: unknown): value is CheckinDraft {
  if (
    !value ||
    typeof value !== 'object' ||
    !('scores' in value) ||
    !('answers' in value) ||
    !('notes' in value)
  )
    return false;
  return (
    !!value.scores &&
    typeof value.scores === 'object' &&
    Object.entries(value.scores).every(
      ([key, score]) =>
        SCORE_KEYS.includes(key as keyof Scores) &&
        (score === null ||
          (typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 5)),
    ) &&
    Array.isArray(value.answers) &&
    value.answers.length <= 10 &&
    value.answers.every((answer: unknown) => typeof answer === 'string' && answer.length <= 1000) &&
    typeof value.notes === 'string' &&
    value.notes.length <= 2000
  );
}

function CheckinForm({ linkId, data }: { linkId: string; data: ClientCheckin }) {
  const send = useSendCheckin(linkId);
  const sent = data.current;
  const [submissionStatus, setSubmissionStatus] = useState<'PARTIAL' | 'FINAL'>(
    sent?.submissionStatus ?? 'FINAL',
  );
  const draft = useSessionDraft<CheckinDraft>(
    `checkin:${linkId}:${data.weekStart}:${sent?.updatedAt ?? JSON.stringify(data.questions)}`,
    {
      scores: sent
        ? {
            energy: sent.energy,
            sleep: sent.sleep,
            trainingAdherence: sent.trainingAdherence,
            dietAdherence: sent.dietAdherence,
          }
        : {},
      answers: data.questions.map((_, i) => sent?.answers[i]?.answer ?? ''),
      notes: sent?.notes ?? '',
    },
    isCheckinDraft,
  );
  const { scores, answers, notes } = draft.value;
  const scoreKeys = data.scoreKeys ?? SCORE_KEYS;
  const complete = scoreKeys.every((k) => scores[k] != null);

  return (
    <form
      className="card flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete || send.isPending) return;
        send.mutate(
          {
            energy: scores.energy!,
            sleep: scores.sleep!,
            trainingAdherence: scoreKeys.includes('trainingAdherence')
              ? (scores.trainingAdherence ?? null)
              : null,
            dietAdherence: scoreKeys.includes('dietAdherence')
              ? (scores.dietAdherence ?? null)
              : null,
            answers,
            notes,
            submissionStatus,
          },
          {
            onSuccess: () => {
              draft.clear();
              toast.success('Check-in enviado');
            },
            onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo enviar el check-in')),
          },
        );
      }}
    >
      <h2 className="card-title">{sent ? 'Tu check-in de esta semana' : '¿Qué tal la semana?'}</h2>
      <label>
        Tipo de envío
        <select
          value={submissionStatus}
          onChange={(event) => setSubmissionStatus(event.target.value as 'PARTIAL' | 'FINAL')}
        >
          <option value="FINAL">Revisión final de la semana</option>
          <option value="PARTIAL">Avance parcial; quedan sesiones o datos</option>
        </select>
      </label>
      {sent && (
        <p className="text-sm" style={muted}>
          Puedes cambiarlo hasta que tu entrenador responda.
        </p>
      )}
      {draft.notice && (
        <p role="status" className="text-sm">
          {draft.notice}
        </p>
      )}
      {scoreKeys.map((key) => (
        <fieldset key={key} className="flex min-w-0 flex-col gap-1" disabled={send.isPending}>
          <legend className="text-sm mb-1" style={muted}>
            {SCORE_LABELS[key]} (1 = muy mal, 5 = muy bien)
          </legend>
          <div className="grid grid-cols-5 gap-2 max-w-sm">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={`btn ${scores[key] === value ? 'btn-primary' : 'btn-secondary'} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2`}
                style={{ paddingInline: 0 }}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={key}
                  value={value}
                  checked={scores[key] === value}
                  onChange={() =>
                    draft.setValue({ ...draft.value, scores: { ...scores, [key]: value } })
                  }
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
            disabled={send.isPending}
            value={answers[i] ?? ''}
            onChange={(e) =>
              draft.setValue({
                ...draft.value,
                answers: data.questions.map((_, j) =>
                  j === i ? e.target.value : (answers[j] ?? ''),
                ),
              })
            }
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
          disabled={send.isPending}
          value={notes}
          onChange={(e) => draft.setValue({ ...draft.value, notes: e.target.value })}
        />
      </label>
      {draft.dirty && (
        <button
          type="button"
          className="btn btn-secondary self-start"
          disabled={send.isPending}
          onClick={draft.clear}
        >
          Descartar borrador
        </button>
      )}
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
