import { useEffect, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { personName, type CoachClient } from '../../lib/coach/api';
import { useClientStatus } from '../../lib/coach/clientStatus';
import { nextReviewLabel, REVIEW_DAYS } from '../../lib/coach/coachSchedule';
import { usePowerProfile } from '../../lib/coach/powerlifting';
import { AthleteNote } from './AthleteNote';
import { AthleteWarmup } from './AthleteWarmup';
import { ClientAvatar } from './ClientAvatar';
import '../../styles/coach-workspace.css';
import '../../styles/coach-student.css';
import '../../styles/coach-athlete.css';

const RECORD_ROUTES = ['registro', 'entrenos', 'comidas', 'pasos', 'peso'];

/** Links between the athlete's views. Only the roster filters and the origin travel with them. */
export function useAthleteLinks(linkId: string) {
  const [params] = useSearchParams();
  const fromReviews = params.get('origen') === 'revisiones';
  const listQuery = new URLSearchParams(params.get('lista') ?? '').toString();
  const base = `/entrenador/atletas/${encodeURIComponent(linkId)}`;
  const carried = () => {
    const next = new URLSearchParams();
    if (params.has('lista')) next.set('lista', params.get('lista') ?? '');
    if (fromReviews) next.set('origen', 'revisiones');
    return next;
  };
  const sectionHref = (section: string) => {
    const next = carried();
    next.set('seccion', section);
    return `${base}?${next}`;
  };
  const recordHref = (path: string) => {
    const next = carried();
    return `${base}/${path}${next.size ? `?${next}` : ''}`;
  };
  return {
    sectionHref,
    recordHref,
    viewHref: (view: string) =>
      RECORD_ROUTES.includes(view) ? recordHref(view) : sectionHref(view),
    back: {
      to: `/entrenador/${fromReviews ? 'revisiones' : 'atletas'}${listQuery ? `?${listQuery}` : ''}`,
      label: fromReviews ? 'Volver a seguimientos' : 'Volver a atletas',
    },
  };
}

/** Which views the coach can open with the athlete's current permissions and agreed services. */
export function useAthleteViews(link: CoachClient) {
  const power = usePowerProfile(link.linkId, link.permissions.training);
  const training = link.permissions.training;
  const trainingLog = training && link.setup?.services.training !== false;
  const nutritionService = link.setup?.services.nutrition !== false;
  const nutrition = link.permissions.nutrition && nutritionService;
  const body = link.permissions.body;
  const bodyLog = body && link.setup?.services.progress !== false;
  const groups = [
    {
      id: 'entrenamiento',
      label: 'Entrenamiento',
      views: [
        { id: 'semana', label: 'Semana', visible: training },
        { id: 'entrenamiento', label: 'Programas', visible: training },
        {
          id: 'powerlifting',
          label: 'Powerlifting',
          visible: training && !!power.data?.profile.enabled,
        },
        { id: 'entrenos', label: 'Entrenos hechos', visible: trainingLog },
      ],
    },
    {
      id: 'nutricion',
      label: 'Nutrición',
      // Contracted but not shared yet: the tab stays and explains how the athlete grants it.
      views: [
        { id: 'nutricion', label: 'Pauta', visible: nutritionService },
        { id: 'comidas', label: 'Comidas registradas', visible: nutrition },
      ],
    },
    {
      id: 'progreso',
      label: 'Progreso',
      views: [
        { id: 'resumen', label: 'Resumen', visible: true },
        { id: 'registro', label: 'Registro diario', visible: true },
        { id: 'peso', label: 'Peso', visible: bodyLog },
        { id: 'pasos', label: 'Pasos', visible: bodyLog },
        { id: 'progreso', label: 'Evolución y fotos', visible: body },
      ],
    },
    {
      id: 'revisiones',
      label: 'Seguimientos',
      views: [{ id: 'revisiones', label: 'Seguimientos', visible: true }],
    },
    {
      id: 'gestion',
      label: 'Ajustes del atleta',
      views: [{ id: 'gestion', label: 'Ajustes del atleta', visible: true }],
    },
  ]
    .map((group) => ({ ...group, views: group.views.filter((view) => view.visible) }))
    .filter((group) => group.views.length > 0);
  return {
    groups,
    has: (view: string) => groups.some((g) => g.views.some((v) => v.id === view)),
    /** Views the coach can see in the menu but the athlete has not shared yet. */
    locked: (view: string) => view === 'nutricion' && nutritionService && !nutrition,
  };
}

export function AthleteShell({
  link,
  active,
  back,
  children,
}: {
  link: CoachClient;
  active: string;
  /** Overrides the link back to the roster, e.g. to return from a day to its week. */
  back?: { to: string; label: string };
  children: ReactNode;
}) {
  const links = useAthleteLinks(link.linkId);
  const { groups } = useAthleteViews(link);
  const status = useClientStatus(true, link.linkId);
  const pending = status.data?.find((s) => s.linkId === link.linkId)?.pendingReplies ?? 0;
  const activeGroup = groups.find((group) => group.views.some((view) => view.id === active));
  const setup = link.setup;
  const followup = link.followup;
  const meta = [
    setup?.trainingDays
      ? `${setup.trainingDays} ${setup.trainingDays === 1 ? 'día' : 'días'} por semana`
      : 'Sin disponibilidad definida',
    followup &&
      (followup.schedule.paused
        ? 'Seguimiento en pausa'
        : `Seguimiento los ${REVIEW_DAYS[followup.schedule.day - 1].toLocaleLowerCase('es').replace(/o$/, 'os')} · próximo ${nextReviewLabel(followup)}`),
  ].filter(Boolean);
  const goBack = back ?? links.back;

  // Fetch the other athlete pages ahead of time so switching tabs never blanks the header.
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    void import('../../pages/CoachClientPage');
    void import('../../pages/CoachClientRegisterPage');
    void import('../../pages/CoachClientWeeklyWorkoutsPage');
    void import('../../pages/CoachClientWeeklyRecordsPage');
  }, []);

  return (
    <>
      <header className="athlete-header">
        <div className="athlete-identity">
          <Link
            to={goBack.to}
            className="athlete-back"
            aria-label={goBack.label}
            title={goBack.label}
          >
            <ArrowLeft size={18} aria-hidden />
          </Link>
          <ClientAvatar client={link.client} />
          <div className="min-w-0">
            <h1 className="athlete-name">{personName(link.client)}</h1>
            <p className="athlete-meta">{meta.join(' · ')}</p>
          </div>
        </div>
        <dl className="athlete-context">
          <div>
            <dt>Objetivo</dt>
            <dd title={setup?.goal || undefined}>
              {setup?.goal || <Link to={links.sectionHref('gestion')}>Añadir objetivo</Link>}
            </dd>
          </div>
          <div>
            <dt>Material</dt>
            <dd title={setup?.equipment || undefined}>
              {setup?.equipment || <Link to={links.sectionHref('gestion')}>Añadir material</Link>}
            </dd>
          </div>
        </dl>
        {pending > 0 && active !== 'revisiones' && (
          <Link to={links.sectionHref('revisiones')} className="btn btn-primary athlete-followup">
            <MessageSquareText size={16} aria-hidden />
            Responder {pending} {pending === 1 ? 'seguimiento' : 'seguimientos'}
          </Link>
        )}
        <AthleteNote key={link.linkId} link={link} />
      </header>
      <nav className="coach-client-nav athlete-nav" aria-label="Secciones del atleta">
        <div className="athlete-tabs">
          {groups.map((group) => {
            const current = group === activeGroup;
            return (
              <Link
                key={group.id}
                to={links.viewHref(group.views[0].id)}
                aria-current={current ? (group.views.length > 1 ? 'true' : 'page') : undefined}
                data-athlete-nav={
                  current && group.views.length > 1
                    ? undefined
                    : group.views.map((view) => view.id).join(' ')
                }
              >
                {group.label}
                {group.id === 'revisiones' && pending > 0 && (
                  <span className="athlete-badge" aria-label={`${pending} por responder`}>
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        {activeGroup && activeGroup.views.length > 1 && (
          <div className="athlete-subtabs" role="group" aria-label={activeGroup.label}>
            {activeGroup.views.map((view) => (
              <Link
                key={view.id}
                to={links.viewHref(view.id)}
                aria-current={view.id === active ? 'page' : undefined}
                data-athlete-nav={view.id}
              >
                {view.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      {children}
      <AthleteWarmup link={link} />
    </>
  );
}
