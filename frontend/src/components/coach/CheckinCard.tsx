import type { ReactNode } from 'react';
import { formatCoachDate } from '../../lib/coach/api';
import { SCORE_KEYS, SCORE_LABELS, type Checkin } from '../../lib/coach/checkins';

const muted = { color: 'var(--text-secondary)' };
const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

/** One weekly check-in as both sides read it: scores, weight, answers, notes and the coach's reply. */
export function CheckinCard({ checkin, footer }: { checkin: Checkin; footer?: ReactNode }) {
  return (
    <article
      className="rounded-lg p-3 border flex flex-col gap-3"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold text-white">Semana del {formatCoachDate(checkin.weekStart)}</h3>
        {checkin.weightAvg != null && (
          <span className="text-sm" style={muted}>
            Peso medio: <span className="text-white">{kg.format(checkin.weightAvg)} kg</span>
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCORE_KEYS.map((key) => (
          <div key={key}>
            <dt className="text-xs" style={muted}>
              {SCORE_LABELS[key]}
            </dt>
            <dd className="text-lg font-bold text-white">{checkin[key]}/5</dd>
          </div>
        ))}
      </dl>
      {checkin.answers.length > 0 && (
        <dl className="flex flex-col gap-2">
          {checkin.answers.map((a, i) => (
            <div key={i}>
              <dt className="text-sm" style={muted}>
                {a.question}
              </dt>
              <dd className="text-white whitespace-pre-line">{a.answer || 'Sin respuesta'}</dd>
            </div>
          ))}
        </dl>
      )}
      {checkin.notes && (
        <p className="whitespace-pre-line">
          <span style={muted}>Notas: </span>
          {checkin.notes}
        </p>
      )}
      {checkin.coachReply && (
        <div className="rounded-lg p-3 bg-black/20">
          <div className="text-xs mb-1" style={muted}>
            Respuesta del entrenador
          </div>
          <p className="text-white whitespace-pre-line">{checkin.coachReply}</p>
        </div>
      )}
      {footer}
    </article>
  );
}
