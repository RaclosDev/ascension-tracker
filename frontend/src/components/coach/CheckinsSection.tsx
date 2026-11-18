import { useState } from 'react';
import { SegmentedControl } from '../ui/segmented-control';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { CalendarPlus, Pin } from 'lucide-react';
import { apiErrorMessage, formatCoachDate, type CoachClient } from '../../lib/coach/api';
import { confirmAction } from '../../lib/confirmation';
import { useSaveCoachNotes } from '../../lib/coach/setup';
import { shiftWeek } from '../../lib/coach/weeks';
import { useAthleteLinks } from './AthleteShell';
import { NOTE_MAX } from './AthleteNote';
import {
  useClientCheckins,
  useReplyCheckin,
  needsReply,
  type Checkin,
} from '../../lib/coach/checkins';
import { CheckinCard } from './CheckinCard';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { useSessionDraft } from '../../hooks/useSessionDraft';
import { useClientStatus } from '../../lib/coach/clientStatus';
import { useQueryClient } from '@tanstack/react-query';

const matches = (filter: string, item: Checkin) =>
  filter === 'all' || (filter === 'pending' ? needsReply(item) : !needsReply(item));

/** Unanswered seguimientos first, then newest week within each group. */
export function CheckinsSection({ link }: { link: CoachClient }) {
  const linkId = link.linkId;
  const checkins = useClientCheckins(linkId);
  // The athlete header already asks for this; here it is only read.
  const missing = useClientStatus(false, linkId).data?.[0]?.signals.find(
    (signal) => signal.reason === 'CHECKIN_MISSING',
  );
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
          {missing && (
            <p className="coach-description">
              {missing.value === 1
                ? 'El atleta aún no ha enviado el seguimiento de esta semana.'
                : `El atleta lleva ${missing.value} semanas sin enviar su seguimiento.`}{' '}
              No hay nada que responder hasta que lo envíe.
            </p>
          )}
          {all.length > 0 && !(missing && pending === 0) && (
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
                footer={
                  <>
                    {open && <ReplyForm linkId={linkId} checkin={c} />}
                    <CheckinActions link={link} checkin={c} />
                  </>
                }
              />
            );
            // With several weeks on screen, answered ones fold so the open ones stand out.
            return open || visible.length === 1 ? (
              <div key={c.id}>{card}</div>
            ) : (
              <details key={c.id} className="checkin-folded" open={index === 0}>
                <summary>
                  <strong>Semana del {formatCoachDate(c.weekStart)}</strong>
                  <span className="checkin-brief">{brief(c)}</span>
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

const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

/** The week at a glance, for the folded row. */
const brief = (c: Checkin) =>
  [
    `Energía ${c.energy}/5`,
    `Sueño ${c.sleep}/5`,
    `Entreno ${c.trainingAdherence}/5`,
    c.weightAvg != null && `${kg.format(c.weightAvg)} kg`,
  ]
    .filter(Boolean)
    .join(' · ');

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
