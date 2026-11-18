import { confirmAction } from '../../lib/confirmation';
import { useNavigate } from 'react-router-dom';
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

const SECTIONS = [
  ['ajustes-servicio', 'Servicio y objetivo'],
  ['ajustes-vetados', 'Ejercicios vetados'],
  ['ajustes-seguimiento', 'Seguimiento'],
  ['ajustes-relacion', 'Permisos y relación'],
] as const;

export function ClientManagement({ link }: { link: CoachClient }) {
  const end = useEndClient();
  const navigate = useNavigate();
  return (
    <div className="athlete-manage">
      <nav className="athlete-manage-index" aria-label="Apartados de los ajustes">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <div className="athlete-manage-main">
        <div id="ajustes-servicio">
          <ClientSetupForm key={link.linkId} link={link} />
        </div>
        <div id="ajustes-vetados">
          <AvoidedExercises link={link} />
        </div>
        <div id="ajustes-seguimiento" className="athlete-manage-main">
          <ClientSchedule
            key={`${link.linkId}-${JSON.stringify(link.followup?.schedule)}`}
            link={link}
          />
          <details>
            <summary className="cursor-pointer">Preguntas del seguimiento de este atleta</summary>
            <CheckinTemplateEditor linkId={link.linkId} />
          </details>
        </div>
      </div>
      <div className="athlete-manage-side" id="ajustes-relacion">
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
        {link.permissions.training && (
          <PowerliftingToggle linkId={link.linkId} canEdit={link.permissions.editTraining} />
        )}
        <section className="card coach-end-section">
          <h2>Terminar relación</h2>
          <p className="coach-description">
            Dejarás de acceder a sus datos. El atleta conserva sus registros y los programas que ya
            tiene asignados.
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
                onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
              });
            }}
          >
            <UserMinus size={16} aria-hidden />
            {end.isPending ? 'Terminando…' : 'Terminar relación'}
          </button>
        </section>
      </div>
    </div>
  );
}
