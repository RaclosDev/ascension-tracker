import { scheduleLabel } from '../lib/coach/coachSchedule';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { hasBodyTracking, hasNutrition } from '../lib/appModules';
import { serviceNames } from '../lib/coach/setup';
import type { UserSettings } from '../types/api';
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
  // Starts from what the coach asked for; nothing is shared until the client accepts.
  const [permissions, setPermissions] = useState<CoachPermissions>(NONE);
  const [requested, setRequested] = useState<CoachPermissions | null>(null);
  if (preview.data?.requested && preview.data.requested !== requested) {
    setRequested(preview.data.requested);
    setPermissions(preview.data.requested);
  }
  // The invitation is now on screen, so it must not reopen on the next sign-in.
  useEffect(clearPendingInvitation, []);
  const anySelected = SCOPES.some((scope) => permissions[scope]);
  // Si comparte algo de un módulo que tiene apagado, no verá lo que le paute el entrenador.
  const modules = useQueryClient().getQueryData<UserSettings | null>(['settings'])?.appModules;
  const hiddenModules = [
    (permissions.nutrition || permissions.editNutrition) && !hasNutrition(modules) && 'Nutrición',
    permissions.body && !hasBodyTracking(modules) && 'Peso y medidas',
  ].filter(Boolean);

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
          <p className="mb-1 text-foreground">
            <strong>{personName(preview.data.coach)}</strong> quiere ser tu entrenador.
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {preview.data.coach.email}
          </p>
          {preview.data.coach.picture && (
            <img
              src={preview.data.coach.picture}
              alt=""
              className="h-14 w-14 rounded-full object-cover mb-3"
              referrerPolicy="no-referrer"
            />
          )}
          {preview.data.coachPresentation && (
            <p className="whitespace-pre-wrap break-words mb-4">{preview.data.coachPresentation}</p>
          )}
          {preview.data.review && (
            <p className="mb-4">Seguimiento semanal: {scheduleLabel(preview.data.review)}</p>
          )}
          {preview.data.setup && (
            <div className="mb-4">
              <h2 className="font-bold">Servicio propuesto</h2>
              <p>{serviceNames(preview.data.setup)}</p>
              {preview.data.setup.goal && (
                <p className="mt-2 whitespace-pre-wrap">{preview.data.setup.goal}</p>
              )}
              {preview.data.setup.services.training && (
                <dl className="grid gap-2 mt-2 [&_dt]:font-semibold [&_dd]:whitespace-pre-wrap">
                  {preview.data.setup.experience && (
                    <div>
                      <dt>Experiencia</dt>
                      <dd>{preview.data.setup.experience}</dd>
                    </div>
                  )}
                  {preview.data.setup.trainingDays && (
                    <div>
                      <dt>Disponibilidad</dt>
                      <dd>{preview.data.setup.trainingDays} días por semana</dd>
                    </div>
                  )}
                  {preview.data.setup.equipment && (
                    <div>
                      <dt>Material</dt>
                      <dd>{preview.data.setup.equipment}</dd>
                    </div>
                  )}
                </dl>
              )}
              <p className="text-sm mt-2">
                Revisa el objetivo con tu entrenador. Tú decides a qué datos puede acceder.
              </p>
            </div>
          )}
          <fieldset className="flex flex-col gap-3 mb-4">
            <legend className="mb-2 font-bold text-foreground">¿Qué quieres compartir?</legend>
            {SCOPES.some((scope) => preview.data.requested?.[scope]) && (
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Viene marcado lo que te pide tu entrenador. Desmarca lo que no quieras compartir.
              </p>
            )}
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
          {hiddenModules.length > 0 && (
            <p className="text-sm mb-4" role="status" style={{ color: 'var(--text-secondary)' }}>
              Tienes desactivado {hiddenModules.join(' y ')}. Actívalo en{' '}
              <Link to="/settings?section=modules">Ajustes → Módulos</Link> para registrarlo y ver
              lo que te paute tu entrenador.
            </p>
          )}
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
