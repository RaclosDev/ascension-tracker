import { confirmAction } from '../../lib/confirmation';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Minus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { AvoidedExercises } from './AvoidedExercises';
import { ClientSetupForm } from './ClientSetup';
import { ClientSchedule } from './ClientSchedule';
import { PowerliftingToggle } from './PowerliftingToggle';
import { CheckinTemplateEditor } from './CheckinTemplateEditor';
import {
  PERMISSION_LABELS,
  formatCoachDate,
  personName,
  apiErrorMessage,
  useEndClient,
  type CoachClient,
  type CoachPermissions,
} from '../../lib/coach/api';

const TABS = [
  ['objetivo', 'Objetivo y disponibilidad'],
  ['servicio', 'Servicios'],
  ['vetados', 'Ejercicios vetados'],
  ['agenda', 'Agenda del seguimiento'],
  ['preguntas', 'Preguntas del seguimiento'],
  ['permisos', 'Permisos'],
  ['relacion', 'Relación'],
] as const;

/** The athlete's settings, one group at a time. */
export function ClientManagement({ link }: { link: CoachClient }) {
  const end = useEndClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tab = TABS.find(([id]) => id === params.get('ajuste'))?.[0] ?? 'objetivo';
  const href = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('ajuste', id);
    return `?${next}`;
  };
  return (
    <div className="athlete-manage">
      <nav className="athlete-manage-tabs" aria-label="Apartados de los ajustes">
        {TABS.map(([id, label]) => (
          <Link
            key={id}
            to={href(id)}
            replace
            aria-current={id === tab ? 'page' : undefined}
            ref={
              id === tab
                ? (node) => node?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="athlete-manage-panel">
        {tab === 'objetivo' && <ClientSetupForm key={link.linkId} link={link} part="objetivo" />}
        {tab === 'servicio' && (
          <>
            <ClientSetupForm key={link.linkId} link={link} part="servicio" />
            {link.permissions.training && (
              <PowerliftingToggle linkId={link.linkId} canEdit={link.permissions.editTraining} />
            )}
          </>
        )}
        {tab === 'vetados' && <AvoidedExercises link={link} />}
        {tab === 'agenda' && (
          <ClientSchedule
            key={`${link.linkId}-${JSON.stringify(link.followup?.schedule)}`}
            link={link}
          />
        )}
        {tab === 'preguntas' && <CheckinTemplateEditor linkId={link.linkId} />}
        {tab === 'permisos' && (
          <section className="card">
            <h2>Permisos del atleta</h2>
            <p className="coach-description">
              El atleta controla estos permisos desde sus ajustes. Indican a qué puedes acceder; no
              definen los servicios que habéis acordado.
            </p>
            <dl className="coach-facts">
              {(Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[]).map((scope) => (
                <div key={scope}>
                  <dt>{PERMISSION_LABELS[scope].title}</dt>
                  <dd data-granted={link.permissions[scope] ? '' : undefined}>
                    {link.permissions[scope] ? (
                      <Check size={15} aria-hidden />
                    ) : (
                      <Minus size={15} aria-hidden />
                    )}
                    {link.permissions[scope] ? 'Permitido' : 'Sin permiso'}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {tab === 'relacion' && (
          <>
            <section className="card">
              <h2>Datos de la relación</h2>
              <dl className="coach-facts">
                <div>
                  <dt>Nombre</dt>
                  <dd>{personName(link.client)}</dd>
                </div>
                <div>
                  <dt>Correo</dt>
                  <dd>{link.client.email}</dd>
                </div>
                <div>
                  <dt>Atleta desde</dt>
                  <dd>{formatCoachDate(link.since)}</dd>
                </div>
              </dl>
            </section>
            <section className="card coach-end-section">
              <h2>Terminar relación</h2>
              <p className="coach-description">
                Dejarás de acceder a sus datos. El atleta conserva sus registros y los programas que
                ya tiene asignados.
              </p>
              <button
                type="button"
                className="btn btn-secondary mt-4"
                disabled={end.isPending}
                onClick={async () => {
                  if (
                    !(await confirmAction({
                      title: 'Terminar relación con el atleta',
                      description: `¿Terminar la relación con ${personName(link.client)}? Dejarás de ver sus datos.`,
                      confirmLabel: 'Terminar relación',
                      destructive: true,
                    }))
                  )
                    return;
                  end.mutate(link.linkId, {
                    onSuccess: () => navigate('/entrenador/atletas'),
                    onError: (e) =>
                      toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
                  });
                }}
              >
                <UserMinus size={16} aria-hidden />
                {end.isPending ? 'Terminando…' : 'Terminar relación'}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
