import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PERMISSION_LABELS,
  scopeDisabled,
  withScope,
  apiErrorMessage,
  clearPendingInvitation,
  personName,
  useAcceptInvitation,
  useInvitationPreview,
  type CoachPermissions,
} from '../lib/coach/api';

const NONE: CoachPermissions = {
  training: false,
  nutrition: false,
  body: false,
  editTraining: false,
  editNutrition: false,
};
const SCOPES = Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[];

export default function InvitationPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const preview = useInvitationPreview(token);
  const accept = useAcceptInvitation(token);
  // Nothing is shared until the client ticks it.
  const [permissions, setPermissions] = useState<CoachPermissions>(NONE);
  // The invitation is now on screen, so it must not reopen on the next sign-in.
  useEffect(clearPendingInvitation, []);
  const anySelected = SCOPES.some((scope) => permissions[scope]);

  const submit = () => {
    if (!anySelected) return;
    accept.mutate(permissions, {
      onSuccess: () => {
        toast.success('Ya estás vinculado con tu entrenador');
        navigate('/settings?section=coach', { replace: true });
      },
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo aceptar la invitación')),
    });
  };

  return (
    <div className="fade-in max-w-xl mx-auto px-4 pt-2 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Invitación de entrenador</h1>
      </header>

      {preview.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}

      {preview.isError && (
        <section className="card" role="alert">
          <p className="mb-4">
            {apiErrorMessage(preview.error, 'Esta invitación no es válida o ha caducado.')}
          </p>
          <Link to="/dashboard" className="btn btn-secondary">
            Ir al inicio
          </Link>
        </section>
      )}

      {preview.data?.alreadyLinked && (
        <section className="card">
          <p className="mb-4">Ya estás vinculado con {personName(preview.data.coach)}.</p>
          <Link to="/settings?section=coach" className="btn btn-secondary">
            Ver mis entrenadores
          </Link>
        </section>
      )}

      {preview.data && !preview.data.alreadyLinked && (
        <section className="card">
          <p className="mb-1 text-white">
            <strong>{personName(preview.data.coach)}</strong> quiere ser tu entrenador.
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {preview.data.coach.email}
          </p>
          <fieldset className="flex flex-col gap-3 mb-4">
            <legend className="mb-2 font-bold text-white">¿Qué quieres compartir?</legend>
            {SCOPES.map((scope) => (
              <label key={scope} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={permissions[scope]}
                  disabled={scopeDisabled(permissions, scope)}
                  onChange={(e) => setPermissions((p) => withScope(p, scope, e.target.checked))}
                />
                <span>
                  <span className="block text-white">{PERMISSION_LABELS[scope].title}</span>
                  <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {PERMISSION_LABELS[scope].detail}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Solo podrá ver lo que marques y nunca modificará lo que registras. Con «Pautar
            entrenamiento» podrá asignarte programas. Puedes cambiarlo o terminar la relación cuando
            quieras desde Ajustes → Entrenador.
          </p>
          {!anySelected && (
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Marca al menos una opción para aceptar.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!anySelected || accept.isPending}
              onClick={submit}
            >
              Aceptar
            </button>
            <Link to="/dashboard" className="btn btn-secondary">
              Ahora no
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
