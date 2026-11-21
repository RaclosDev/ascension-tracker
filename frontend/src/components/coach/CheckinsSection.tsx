import { useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronDown, Pin } from 'lucide-react';
import { apiErrorMessage, formatCoachDate, type CoachClient } from '../../lib/coach/api';
import { confirmAction } from '../../lib/confirmation';
import { useSaveCoachNotes } from '../../lib/coach/setup';
import { shiftWeek, weekDate } from '../../lib/coach/weeks';
import { useAthleteLinks } from './AthleteShell';
import { NOTE_MAX } from './AthleteNote';
import {
  useClientCheckins,
  useReplyCheckin,
  needsReply,
  SCORE_KEYS,
  SCORE_LABELS,
  type Checkin,
} from '../../lib/coach/checkins';
import { CheckinWeekDays } from './CheckinWeekDays';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { useClientStatus } from '../../lib/coach/clientStatus';
import { useQueryClient } from '@tanstack/react-query';

const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const stamp = (iso: string) => format(new Date(iso), 'EEE d MMM, HH:mm', { locale: es });

/** «9 – 15 nov»: the week as a coach says it, with the year only when it is not this one. */
function weekRange(week: string) {
  const start = parseISO(week);
  const end = addDays(start, 6);
  const year = end.getFullYear() === new Date().getFullYear() ? '' : ` ${end.getFullYear()}`;
  const from = format(start, start.getMonth() === end.getMonth() ? 'd' : 'd MMM', { locale: es });
  return `${from} – ${format(end, 'd MMM', { locale: es })}${year}`;
}

/** Short names for the one-line summary of a past week. */
const BRIEF_LABELS: Record<(typeof SCORE_KEYS)[number], string> = {
  energy: 'Energía',
  sleep: 'Sueño',
  trainingAdherence: 'Entreno',
  dietAdherence: 'Dieta',
};

/** This week on top, day by day; the weeks before it folded below. */
export function CheckinsSection({ link }: { link: CoachClient }) {
  const linkId = link.linkId;
  const checkins = useClientCheckins(linkId);
  // The athlete header already asks for this; here it is only read.
  const missing = useClientStatus(false, linkId).data?.[0]?.signals.find(
    (signal) => signal.reason === 'CHECKIN_MISSING',
  );
  const current = weekDate();
  const all = [...(checkins.data ?? [])].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const now = all.find((item) => item.weekStart === current);
  const past = all.filter((item) => item.weekStart !== current);
  const pending = all.filter(needsReply).length;

  return (
    <section className="athlete-checkins">
      <div className="athlete-section-title">
        <h2>Seguimientos semanales</h2>
        {all.length > 0 && (
          <p className="coach-description">
            {pending === 0 ? 'Todo respondido' : `${pending} por responder`}
          </p>
        )}
      </div>
      {checkins.isLoading ? (
        <p role="status" className="coach-description">
          Cargando…
        </p>
      ) : checkins.isError ? (
        <QueryErrorNotice retry={() => void checkins.refetch()} pending={checkins.isFetching} />
      ) : (
        <>
          <section className="checkin-week" data-tour="checkin-card" aria-labelledby="checkin-now">
            <header className="checkin-week-head">
              <h3 id="checkin-now">Semana actual</h3>
              <p>{weekRange(current)}</p>
              {now && <Status checkin={now} />}
            </header>
            {now ? (
              <WeekBody link={link} checkin={now} />
            ) : (
              <>
                <p className="checkin-week-empty">
                  Tu atleta aún no ha enviado el seguimiento de esta semana
                  {missing && missing.value > 1 ? ` (lleva ${missing.value} sin enviarlo)` : ''}.
                </p>
                <CheckinWeekDays link={link} week={current} />
              </>
            )}
          </section>
          {past.length > 0 && (
            <section className="checkin-past" aria-labelledby="checkin-past">
              <h3 id="checkin-past">Semanas anteriores</h3>
              <ul>
                {past.map((item) => (
                  <PastWeek key={item.id} link={link} checkin={item} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function Status({ checkin }: { checkin: Checkin }) {
  const open = needsReply(checkin);
  return (
    <span className={`checkin-status${open ? ' checkin-status-pending' : ''}`}>
      {!open ? 'Respondido' : checkin.coachReply ? 'Actualizado por el atleta' : 'Por responder'}
    </span>
  );
}

/** A past week in one line; it opens on its own while it still waits for an answer. */
function PastWeek({ link, checkin }: { link: CoachClient; checkin: Checkin }) {
  const [open, setOpen] = useState(() => needsReply(checkin));
  const id = `checkin-week-${checkin.id}`;
  return (
    <li>
      <button
        type="button"
        className="checkin-past-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <b>{weekRange(checkin.weekStart)}</b>
        <span className="checkin-brief">
          {[
            ...SCORE_KEYS.filter((key) => checkin[key] != null).map(
              (key) => `${BRIEF_LABELS[key]} ${checkin[key]}/5`,
            ),
            ...(checkin.weightAvg != null ? [`${kg.format(checkin.weightAvg)} kg`] : []),
          ].join(' · ')}
        </span>
        <Status checkin={checkin} />
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <div id={id} className="checkin-past-body">
          <WeekBody link={link} checkin={checkin} />
        </div>
      )}
    </li>
  );
}

/** What the athlete sent and how the week went on one side; the coach's answer on the other. */
function WeekBody({ link, checkin }: { link: CoachClient; checkin: Checkin }) {
  const open = needsReply(checkin);
  const thread = [
    ...(checkin.updates ?? []),
    ...(checkin.coachReply
      ? [
          {
            role: 'COACH',
            body: checkin.coachReply,
            createdAt: checkin.repliedAt ?? checkin.updatedAt,
          },
        ]
      : []),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div className={`checkin-week-body${open ? ' checkin-week-split' : ''}`}>
      <div className="checkin-week-main">
        <dl className="checkin-scores">
          {SCORE_KEYS.filter((key) => checkin[key] != null).map((key) => (
            <div key={key}>
              <dt>{SCORE_LABELS[key]}</dt>
              <dd>
                {checkin[key]}
                <small>/5</small>
              </dd>
            </div>
          ))}
          {checkin.weightAvg != null && (
            <div>
              <dt>Peso medio</dt>
              <dd>{kg.format(checkin.weightAvg)} kg</dd>
            </div>
          )}
        </dl>
        {(checkin.answers.length > 0 || checkin.notes) && (
          <dl className="checkin-answers">
            {checkin.answers.map((item, index) => (
              <div key={index}>
                <dt>{item.question}</dt>
                <dd>{item.answer || 'Sin respuesta'}</dd>
              </div>
            ))}
            {checkin.notes && (
              <div>
                <dt>Notas</dt>
                <dd>{checkin.notes}</dd>
              </div>
            )}
          </dl>
        )}
        <p className="checkin-meta">
          {checkin.submissionStatus === 'PARTIAL' ? 'Avance parcial, enviado' : 'Enviado'} el{' '}
          {stamp(checkin.createdAt)}
          {checkin.updatedAt !== checkin.createdAt && ` · editado el ${stamp(checkin.updatedAt)}`}
        </p>
        {thread.length > 0 && (
          <ol className="checkin-thread">
            {thread.map((message, index) => (
              <li key={`${message.createdAt}:${index}`}>
                <p>
                  {message.role === 'CLIENT' ? 'Atleta' : 'Respuesta del entrenador'} ·{' '}
                  <time dateTime={message.createdAt}>{stamp(message.createdAt)}</time>
                </p>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
        )}
        <CheckinWeekDays link={link} week={checkin.weekStart} />
      </div>
      <div className="checkin-week-side">
        {open && <ReplyForm linkId={link.linkId} checkin={checkin} />}
        <CheckinActions link={link} checkin={checkin} />
      </div>
    </div>
  );
}

/** What the coach does after reading a seguimiento: keep what matters and plan the next week. */
function CheckinActions({ link, checkin }: { link: CoachClient; checkin: Checkin }) {
  const save = useSaveCoachNotes(link.linkId);
  const { sectionHref } = useAthleteLinks(link.linkId);
  const said = checkin.notes?.trim() || checkin.answers?.find((a) => a.answer?.trim())?.answer;
  return (
    <div className="checkin-actions">
      {said && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={save.isPending}
          onClick={async () => {
            const current = link.notes?.pinnedNote?.trim();
            const added = `Seguimiento del ${formatCoachDate(checkin.weekStart)}: ${said.trim()}`;
            const joined = current ? `${current}\n${added}` : added;
            const fits = joined.length <= NOTE_MAX;
            const pinnedNote = (fits ? joined : added).slice(0, NOTE_MAX);
            if (
              !(await confirmAction({
                title: !current
                  ? 'Fijar como nota'
                  : fits
                    ? 'Añadir a la nota fijada'
                    : 'Sustituir la nota fijada',
                description: `${
                  !current
                    ? 'Se fijará en la cabecera del atleta'
                    : fits
                      ? 'Se añadirá a tu nota actual'
                      : `No cabe junto a tu nota actual («${current.slice(0, 80)}»), así que la sustituirá`
                }: «${added.slice(0, 200)}${added.length > 200 ? '…' : ''}». Solo la ves tú y puedes editarla después.`,
                confirmLabel: !current
                  ? 'Fijar nota'
                  : fits
                    ? 'Añadir a la nota'
                    : 'Sustituir nota',
              }))
            )
              return;
            save.mutate(
              {
                pinnedNote,
                avoidedExercises: link.notes?.avoidedExercises ?? [],
              },
              {
                onSuccess: () => toast.success('Fijado como nota en la cabecera del atleta'),
                onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo fijar la nota')),
              },
            );
          }}
        >
          <Pin size={15} aria-hidden /> Fijar como nota
        </button>
      )}
      {link.permissions.training && (
        <Link
          className="btn btn-secondary"
          to={`${sectionHref('semana')}&semana=${shiftWeek(checkin.weekStart, 1)}`}
        >
          <CalendarPlus size={15} aria-hidden /> Ver la semana siguiente
        </Link>
      )}
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
      className="checkin-reply"
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
      <label htmlFor={`reply-${checkin.id}`}>Tu respuesta</label>
      <textarea
        id={`reply-${checkin.id}`}
        className="form-input min-w-0"
        rows={5}
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
