import type { ReactNode } from 'react';
import { formatCoachDate } from '../../lib/coach/api';
import { SCORE_KEYS, SCORE_LABELS, type Checkin } from '../../lib/coach/checkins';
import '../../styles/coach-athlete.css';

const muted = { color: 'var(--text-secondary)' };
const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

/** One weekly seguimiento as both sides read it: scores, weight, answers, notes and the coach's reply. */
export function CheckinCard({
  checkin,
  footer,
  status,
}: {
  checkin: Checkin;
  footer?: ReactNode;
  /** Short state shown next to the week, e.g. whether it still needs a reply. */
  status?: ReactNode;
}) {
  return (
    <article
      data-tour="checkin-card"
      className={`checkin-card rounded-lg p-3 border${footer ? ' checkin-card-reply' : ''}`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="checkin-card-body flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-bold flex flex-wrap items-center gap-2">
            Semana del {formatCoachDate(checkin.weekStart)}
            {status}
          </h3>
          {checkin.weightAvg != null && (
            <span className="text-sm" style={muted}>
              Peso medio: <strong>{kg.format(checkin.weightAvg)} kg</strong>
            </span>
          )}
        </div>
        <p className="text-xs" style={muted}>
          {checkin.submissionStatus === 'PARTIAL' ? 'Avance parcial · ' : 'Seguimiento final · '}
          Enviado: {dateTime.format(new Date(checkin.createdAt))}
          {checkin.updatedAt !== checkin.createdAt &&
            ` · Editado: ${dateTime.format(new Date(checkin.updatedAt))}`}
        </p>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCORE_KEYS.filter((key) => checkin[key] != null).map((key) => (
            <div key={key}>
              <dt className="text-xs" style={muted}>
                {SCORE_LABELS[key]}
              </dt>
              <dd className="text-lg font-bold">{checkin[key]}/5</dd>
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
                <dd className="whitespace-pre-line">{a.answer || 'Sin respuesta'}</dd>
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
        {checkin.coachReply && !checkin.updates?.length && (
          <div className="checkin-message rounded-lg p-3">
            <div className="text-xs mb-1" style={muted}>
              <span>Respuesta del entrenador</span>
              {checkin.repliedAt && (
                <>
                  {' '}
                  ·{' '}
                  <time dateTime={checkin.repliedAt}>
                    {dateTime.format(new Date(checkin.repliedAt))}
                  </time>
                </>
              )}
            </div>
            <p className="whitespace-pre-line">{checkin.coachReply}</p>
          </div>
        )}
        {!!checkin.updates?.length && (
          <details open>
            <summary>Historial del seguimiento</summary>
            <ol className="flex flex-col gap-2 mt-2">
              {[
                ...checkin.updates,
                ...(checkin.coachReply
                  ? [
                      {
                        role: 'COACH',
                        body: checkin.coachReply,
                        createdAt: checkin.repliedAt ?? checkin.updatedAt,
                      },
                    ]
                  : []),
              ]
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((update, i) => (
                  <li key={`${update.createdAt}:${i}`} className="checkin-message rounded-lg p-3">
                    <p className="text-xs" style={muted}>
                      {update.role === 'CLIENT' ? 'Atleta' : 'Entrenador'} ·{' '}
                      <time dateTime={update.createdAt}>
                        {dateTime.format(new Date(update.createdAt))}
                      </time>
                    </p>
                    <p className="whitespace-pre-line">{update.body}</p>
                  </li>
                ))}
            </ol>
          </details>
        )}
      </div>
      {footer && <div className="checkin-card-footer min-w-0">{footer}</div>}
    </article>
  );
}
