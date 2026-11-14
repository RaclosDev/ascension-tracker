import { Link } from 'react-router-dom';
import { addDays, addWeeks, parseISO } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { formatCoachDate, type CoachClient } from '../../lib/coach/api';
import { signalText, useClientStatus } from '../../lib/coach/clientStatus';
import { useClientAssignments } from '../../lib/coach/coachPrograms';
import { activityText, followupSignals } from '../../lib/coach/workspace';
import { weekDate } from '../../lib/coach/weeks';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { ClientSetupSummary } from './ClientSetup';
import { RegisterWeek } from './RegisterWeek';
import { signalSection } from '../../lib/coach/tasks';
import { nextReviewLabel, scheduleLabel } from '../../lib/coach/coachSchedule';

const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, signDisplay: 'exceptZero' });

/** The athlete at a glance: where they stand, what needs attention and what they logged this week. */
export function ClientOverview({
  link,
  sectionHref,
  recordHref,
}: {
  link: CoachClient;
  sectionHref: (section: string) => string;
  recordHref: (path: string) => string;
}) {
  const query = useClientStatus(true, link.linkId);
  const status = query.isError ? undefined : query.data?.find((s) => s.linkId === link.linkId);
  const signals = followupSignals(status);
  const followup = link.followup;
  const services = link.setup?.services;
  const logs =
    (link.permissions.training && services?.training !== false) ||
    (link.permissions.nutrition && services?.nutrition !== false) ||
    (link.permissions.body && services?.progress !== false);
  const registerHref = recordHref('registro');
  const search = registerHref.includes('?') ? registerHref.slice(registerHref.indexOf('?')) : '';
  return (
    <>
      {query.isError && (
        <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />
      )}
      <section aria-label="Estado del atleta">
        <dl className="athlete-stats">
          <div>
            <dt>Última actividad</dt>
            <dd>{query.isPending ? '…' : status ? activityText(status.lastActivity) : '—'}</dd>
          </div>
          {link.permissions.body && (
            <div>
              <dt>Cambio de peso · 4 semanas</dt>
              <dd>
                {query.isPending
                  ? '…'
                  : !status
                    ? '—'
                    : status.weightChange == null
                      ? 'Sin datos suficientes'
                      : `${kg.format(status.weightChange)} kg`}
              </dd>
            </div>
          )}
          <div>
            <dt>Seguimientos por responder</dt>
            <dd>
              {query.isPending ? '…' : status ? status.pendingReplies : '—'}{' '}
              <Link to={sectionHref('revisiones')}>Abrir seguimientos</Link>
            </dd>
          </div>
          <div>
            <dt>Próxima revisión</dt>
            <dd>
              {!followup
                ? 'Sin agenda'
                : followup.schedule.paused
                  ? 'En pausa'
                  : nextReviewLabel(followup)}{' '}
              <Link to={sectionHref('gestion')}>Cambiar agenda</Link>
            </dd>
            {followup && !followup.schedule.paused && (
              <dd className="athlete-stat-note">{scheduleLabel(followup.schedule)}</dd>
            )}
          </div>
        </dl>
        {query.isPending ? (
          <p role="status" className="coach-description mt-3">
            Cargando seguimiento…
          </p>
        ) : !status ? (
          <p className="coach-description mt-3">Seguimiento no disponible.</p>
        ) : signals.length > 0 ? (
          <div className="athlete-attention">
            <h2>Requiere atención</h2>
            <ul>
              {signals.map((s) => (
                <li key={s.reason}>
                  <Link to={sectionHref(signalSection(s))}>{signalText(s)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="coach-description mt-3">
            {followup?.schedule.paused
              ? 'Las alertas de seguimiento están pausadas.'
              : link.setup
                ? 'Sin señales de seguimiento pendientes.'
                : 'Configura el servicio para activar las señales de seguimiento.'}
          </p>
        )}
      </section>
      {logs && (
        <section className="coach-register-page athlete-week">
          <div className="athlete-section-title">
            <h2>Esta semana</h2>
            <Link className="btn btn-secondary" to={registerHref}>
              Abrir resumen diario <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="coach-weekly-workouts-list">
            <RegisterWeek client={link} week={weekDate()} search={search} />
          </div>
        </section>
      )}
      <div className="coach-client-summary athlete-plan-cards">
        {link.permissions.training && (
          <ProgramOverview
            link={link}
            href={sectionHref('entrenamiento')}
            weekHref={sectionHref('semana')}
          />
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
        <ClientSetupSummary link={link} href={sectionHref('gestion')} />
      </div>
    </>
  );
}

function ProgramOverview({
  link,
  href,
  weekHref,
}: {
  link: CoachClient;
  href: string;
  weekHref: string;
}) {
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
      <div className="flex flex-wrap gap-2 mt-4">
        <Link className="btn btn-secondary" to={weekHref}>
          Planificar semana
        </Link>
        <Link className="btn btn-secondary" to={href}>
          Abrir entrenamiento <ArrowUpRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
