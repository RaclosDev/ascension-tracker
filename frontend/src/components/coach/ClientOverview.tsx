import { Link } from 'react-router-dom';
import { addDays, addWeeks, parseISO } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { formatCoachDate, type CoachClient } from '../../lib/coach/api';
import { signalText, useClientStatus } from '../../lib/coach/clientStatus';
import { useClientAssignments } from '../../lib/coach/coachPrograms';
import { activityText, followupSignals } from '../../lib/coach/workspace';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { ClientSetupSummary } from './ClientSetup';
import { signalSection } from '../../lib/coach/tasks';
import { nextReviewLabel, scheduleLabel } from '../../lib/coach/coachSchedule';

export function ClientOverview({
  link,
  sectionHref,
}: {
  link: CoachClient;
  sectionHref: (section: string) => string;
}) {
  const query = useClientStatus(true, link.linkId);
  const status = query.isError ? undefined : query.data?.find((s) => s.linkId === link.linkId);
  const signals = followupSignals(status);
  return (
    <>
      <ClientSetupSummary link={link} href={sectionHref('gestion')} />
      {query.isError && (
        <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />
      )}
      <div className="coach-client-summary">
        <section className="card">
          <h2>Seguimiento</h2>
          {link.followup && (
            <p className="coach-description">
              {link.followup.schedule.paused
                ? 'Seguimiento en pausa'
                : scheduleLabel(link.followup.schedule)}
              {!link.followup.schedule.paused && <> · Próxima: {nextReviewLabel(link.followup)}</>}
              {' · '}
              <Link to={sectionHref('gestion')}>Cambiar agenda</Link>
            </p>
          )}
          {query.isPending ? (
            <p role="status">Cargando seguimiento…</p>
          ) : !status ? (
            <p>Seguimiento no disponible.</p>
          ) : (
            <>
              <dl className="coach-facts">
                <div>
                  <dt>Última actividad</dt>
                  <dd>{activityText(status.lastActivity)}</dd>
                </div>
                {link.permissions.body && (
                  <div>
                    <dt>Cambio de peso · 4 semanas</dt>
                    <dd>
                      {status.weightChange == null
                        ? 'Sin datos suficientes'
                        : `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(status.weightChange)} kg`}
                    </dd>
                  </div>
                )}
              </dl>
              {signals.length > 0 ? (
                <ul className="coach-signal-list">
                  {signals.map((s) => (
                    <li key={s.reason}>
                      <Link to={sectionHref(signalSection(s))}>{signalText(s)}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="coach-description">
                  {link.followup?.schedule.paused
                    ? 'Las alertas de seguimiento están pausadas.'
                    : link.setup
                      ? 'Sin señales de seguimiento pendientes.'
                      : 'Configura el servicio para activar las señales de seguimiento.'}
                </p>
              )}
            </>
          )}
        </section>
        <section className="card">
          <h2>Revisiones</h2>
          <p className="coach-summary-number">{status ? status.pendingReplies : '—'}</p>
          <p className="coach-description">
            {status
              ? status.pendingReplies === 1
                ? 'check-in por responder'
                : 'check-ins por responder'
              : 'Estado no disponible'}
          </p>
          <Link className="btn btn-secondary mt-4" to={sectionHref('revisiones')}>
            Abrir revisiones <ArrowUpRight size={16} aria-hidden />
          </Link>
        </section>
        {link.permissions.training && (
          <ProgramOverview link={link} href={sectionHref('entrenamiento')} />
        )}
        {link.permissions.nutrition && link.setup?.services.nutrition && (
          <section className="card">
            <h2>Nutrición</h2>
            <p className="coach-description">
              {link.permissions.editNutrition
                ? 'Puedes consultar los registros y preparar una pauta nutricional si forma parte de vuestro trabajo.'
                : 'Puedes consultar sus objetivos y registros de alimentación.'}
            </p>
            <Link className="btn btn-secondary mt-4" to={sectionHref('nutricion')}>
              Abrir nutrición <ArrowUpRight size={16} aria-hidden />
            </Link>
          </section>
        )}
      </div>
    </>
  );
}

function ProgramOverview({ link, href }: { link: CoachClient; href: string }) {
  const assignments = useClientAssignments(link.linkId);
  const active = assignments.data?.find((a) => a.status === 'ACTIVE');
  return (
    <section className="card">
      <h2>Programa asignado</h2>
      {assignments.isPending ? (
        <p role="status">Cargando programa…</p>
      ) : assignments.isError ? (
        <QueryErrorNotice
          retry={() => void assignments.refetch()}
          pending={assignments.isFetching}
        />
      ) : active ? (
        <>
          <h3>{active.programName}</h3>
          <p className="coach-description">
            {active.weeks} {active.weeks === 1 ? 'semana' : 'semanas'} · desde{' '}
            {formatCoachDate(active.startDate)}
          </p>
          <p className="coach-description">
            Fin previsto:{' '}
            {formatCoachDate(
              addDays(addWeeks(parseISO(active.startDate), active.weeks), -1).toISOString(),
            )}
          </p>
        </>
      ) : (
        <p className="coach-description">
          Sin programa activo.{' '}
          {link.permissions.editTraining
            ? 'Puedes asignar uno desde su entrenamiento.'
            : 'El atleta debe permitirte pautar entrenamiento para asignar un programa.'}
        </p>
      )}
      <Link className="btn btn-secondary mt-4" to={href}>
        Abrir entrenamiento <ArrowUpRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
