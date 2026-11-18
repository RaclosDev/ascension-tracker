import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { personName } from '../../lib/coach/api';
import { activityText, clientHref, type CoachRow } from '../../lib/coach/workspace';
import { clientTasks } from '../../lib/coach/tasks';
import {
  daysUntilText,
  kilos,
  nextWeekDeadline,
  shortDate,
  useCoachHome,
} from '../../lib/coach/home';
import { getExerciseMap, useExerciseCatalog } from '../../lib/workout/exercises';

const SHOWN = 6;

/** What is due, in three columns by urgency: weeks to deliver, logging and follow-ups. */
export function CoachHomeBoard({ rows }: { rows: CoachRow[] }) {
  const deadline = nextWeekDeadline();
  const weeks = rows.filter(
    (row) =>
      row.link.permissions.training &&
      (row.status?.nextWeekStatus === 'MISSING' || row.status?.nextWeekStatus === 'DRAFT'),
  );
  const logs = [...rows].sort((a, b) =>
    (a.status?.lastActivity ?? '').localeCompare(b.status?.lastActivity ?? ''),
  );
  const replies = rows.filter((row) => (row.status?.pendingReplies ?? 0) > 0);
  const late = rows.filter(
    (row) =>
      !replies.includes(row) &&
      !row.link.followup?.schedule.paused &&
      row.status?.signals.some((signal) => signal.reason === 'CHECKIN_MISSING'),
  );
  const pending = replies.reduce((sum, row) => sum + (row.status?.pendingReplies ?? 0), 0);
  const setup = rows.flatMap((row) =>
    clientTasks(row)
      .filter((task) => task.id === 'setup' || task.id === 'onboarding')
      .map((task) => ({ link: row.link, task })),
  );

  return (
    <>
      <div className="coach-home-columns">
        <Column
          title="Semanas por entregar"
          count={weeks.length}
          note={`Semana del ${deadline.range} · ${deadline.dueText}`}
          urgent={weeks.length > 0 && deadline.daysLeft <= 1}
          empty="Todas las semanas están publicadas."
          more={
            weeks.length > SHOWN && (
              <Link to="/entrenador/atletas?filtro=nextWeek">Ver las {weeks.length}</Link>
            )
          }
        >
          {weeks.slice(0, SHOWN).map((row) => (
            <Item
              key={row.link.linkId}
              to={`${clientHref(row.link.linkId, 'semana')}&semana=${deadline.weekStart}`}
              name={personName(row.link.client)}
              detail={row.status?.nextWeekStatus === 'DRAFT' ? 'Borrador' : 'Sin preparar'}
              action={row.status?.nextWeekStatus === 'DRAFT' ? 'Terminar' : 'Preparar'}
            />
          ))}
        </Column>
        <Column
          title="Registro al día"
          note="Último registro de cada atleta"
          empty="Aún no hay atletas."
          more={rows.length > SHOWN && <Link to="/entrenador/atletas">Ver todos los atletas</Link>}
        >
          {logs.slice(0, SHOWN).map((row) => (
            <Item
              key={row.link.linkId}
              to={`/entrenador/atletas/${encodeURIComponent(row.link.linkId)}/registro`}
              name={personName(row.link.client)}
              detail={activityText(row.status?.lastActivity)}
              warn={row.status?.signals.some((signal) => signal.reason === 'INACTIVE')}
            />
          ))}
        </Column>
        <Column
          title="Seguimientos"
          count={pending}
          note={pending === 1 ? '1 por responder' : `${pending} por responder`}
          empty="No tienes seguimientos por responder."
          more={<Link to="/entrenador/revisiones">Ver todos los seguimientos</Link>}
        >
          {replies.map((row) => (
            <Item
              key={row.link.linkId}
              to={clientHref(row.link.linkId, 'revisiones')}
              name={personName(row.link.client)}
              detail={
                row.status?.lastCheckin
                  ? `Enviado el ${shortDate(row.status.lastCheckin)}`
                  : 'Pendiente de respuesta'
              }
              action="Responder"
            />
          ))}
          {late.map((row) => {
            const weeksLate =
              row.status?.signals.find((signal) => signal.reason === 'CHECKIN_MISSING')?.value ?? 1;
            return (
              <Item
                key={row.link.linkId}
                to={clientHref(row.link.linkId, 'revisiones')}
                name={personName(row.link.client)}
                detail={
                  weeksLate === 1
                    ? 'Sin enviar · 1 semana tarde'
                    : `Sin enviar · ${weeksLate} semanas tarde`
                }
                warn
              />
            );
          })}
        </Column>
      </div>
      {setup.length > 0 && (
        <section className="coach-home-setup" aria-label="Por configurar">
          <h2>Por configurar</h2>
          <ul>
            {setup.map(({ link, task }) => (
              <li key={`${link.linkId}:${task.id}`}>
                <Link to={clientHref(link.linkId, task.section)}>
                  <strong>{personName(link.client)}</strong>
                  <span>{task.title}</span>
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <KeyLifts rows={rows} />
    </>
  );
}

function Column({
  title,
  count,
  note,
  urgent,
  empty,
  more,
  children,
}: {
  title: string;
  count?: number;
  note: string;
  urgent?: boolean;
  empty: string;
  more?: ReactNode;
  children: ReactNode[];
}) {
  const items = children.flat().filter(Boolean);
  return (
    <section className="coach-home-column" aria-label={title}>
      <header>
        <h2>
          {title}
          {count !== undefined && <span className="coach-home-count">{count}</span>}
        </h2>
        <p data-urgent={urgent || undefined}>{note}</p>
      </header>
      {items.length === 0 ? <p className="coach-home-empty">{empty}</p> : <ul>{items}</ul>}
      {more && <p className="coach-home-more">{more}</p>}
    </section>
  );
}

function Item({
  to,
  name,
  detail,
  action,
  warn,
}: {
  to: string;
  name: string;
  detail: string;
  action?: string;
  warn?: boolean;
}) {
  return (
    <li>
      <Link to={to} className="coach-home-item">
        <span>
          <strong>{name}</strong>
          <small data-warn={warn || undefined}>{detail}</small>
        </span>
        {action ? (
          <span className="coach-home-action">{action}</span>
        ) : (
          <ArrowRight size={15} aria-hidden />
        )}
      </Link>
    </li>
  );
}

function KeyLifts({ rows }: { rows: CoachRow[] }) {
  const home = useCoachHome(true);
  const catalog = useExerciseCatalog();
  const exercises = useMemo(() => getExerciseMap([], catalog.data ?? []), [catalog.data]);
  const names = new Map(rows.map((row) => [row.link.linkId, personName(row.link.client)]));
  const lifts = (home.data?.lifts ?? []).filter((lift) => names.has(lift.linkId));
  const meets = (home.data?.meets ?? []).filter((meet) => names.has(meet.linkId));
  if (lifts.length === 0 && meets.length === 0) return null;
  return (
    <>
      {lifts.length > 0 && (
        <section className="coach-home-lifts" aria-label="Levantamientos clave">
          <div className="coach-section-heading">
            <h2>Levantamientos clave</h2>
            <span>Últimas 6 semanas</span>
          </div>
          <ul>
            {lifts.map((lift) => {
              const Trend =
                lift.trend === null || lift.trend === 0
                  ? Minus
                  : lift.trend > 0
                    ? TrendingUp
                    : TrendingDown;
              return (
                <li key={lift.linkId}>
                  <Link
                    to={`/entrenador/atletas/${encodeURIComponent(lift.linkId)}/entrenos/${encodeURIComponent(lift.workoutId)}`}
                  >
                    <strong>{names.get(lift.linkId)}</strong>
                    <span>
                      {lift.customName ?? exercises.get(lift.exerciseId)?.name ?? 'Ejercicio'} ·{' '}
                      {kilos(lift.weight)} × {lift.reps}
                    </span>
                    <span className="coach-home-e1rm">
                      1RM est. {kilos(lift.e1rm)}
                      <span
                        className="coach-home-trend"
                        data-trend={
                          lift.trend === null || lift.trend === 0
                            ? 'flat'
                            : lift.trend > 0
                              ? 'up'
                              : 'down'
                        }
                      >
                        <Trend size={14} aria-hidden />
                        {lift.trend === null
                          ? 'Sin comparación'
                          : `${lift.trend > 0 ? '+' : ''}${kilos(lift.trend)}`}
                      </span>
                    </span>
                    <small>Mejor serie el {shortDate(lift.date)}</small>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {meets.length > 0 && (
        <section className="coach-home-meets" aria-label="Próximas competiciones">
          <div className="coach-section-heading">
            <h2>Próximas competiciones</h2>
          </div>
          <ul>
            {meets.map((meet) => (
              <li key={meet.id}>
                <Link to={clientHref(meet.linkId, 'powerlifting')} className="coach-home-item">
                  <span>
                    <strong>{meet.name}</strong>
                    <small>
                      {names.get(meet.linkId)} · {shortDate(meet.date)}
                    </small>
                  </span>
                  <span className="coach-home-action">{daysUntilText(meet.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
