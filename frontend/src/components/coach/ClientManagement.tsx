import { useNavigate } from 'react-router-dom';
import { UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PERMISSION_LABELS,
  formatCoachDate,
  personName,
  apiErrorMessage,
  useEndClient,
  type CoachClient,
  type CoachPermissions,
} from '../../lib/coach/api';

export function ClientManagement({ link }: { link: CoachClient }) {
  const end = useEndClient();
  const navigate = useNavigate();
  return (
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
            <dt>Alumno desde</dt>
            <dd>{formatCoachDate(link.since)}</dd>
          </div>
        </dl>
      </section>
      <section className="card">
        <h2>Permisos del alumno</h2>
        <p className="coach-description">
          El alumno controla estos permisos desde sus ajustes. Indican a qué puedes acceder; no
          definen los servicios que habéis acordado.
        </p>
        <dl className="coach-facts">
          {(Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[]).map((scope) => (
            <div key={scope}>
              <dt>{PERMISSION_LABELS[scope].title}</dt>
              <dd>{link.permissions[scope] ? 'Permitido' : 'Sin permiso'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="card coach-end-section">
        <h2>Terminar relación</h2>
        <p className="coach-description">
          Dejarás de acceder a sus datos. El alumno conserva sus registros y los programas que ya
          tiene asignados.
        </p>
        <button
          type="button"
          className="btn btn-secondary mt-4"
          disabled={end.isPending}
          onClick={() => {
            if (
              !window.confirm(
                `¿Terminar la relación con ${personName(link.client)}? Dejarás de ver sus datos.`,
              )
            )
              return;
            end.mutate(link.linkId, {
              onSuccess: () => navigate('/entrenador/alumnos'),
              onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
            });
          }}
        >
          <UserMinus size={16} aria-hidden />
          {end.isPending ? 'Terminando…' : 'Terminar relación'}
        </button>
      </section>
    </>
  );
}
