import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import {
  PERMISSION_LABELS,
  scopeDisabled,
  withScope,
  accessActionLabel,
  apiErrorMessage,
  formatCoachDate,
  personName,
  useCoachAccessLog,
  useEndCoach,
  useMyCoaches,
  useUpdateCoachPermissions,
  type CoachPermissions,
  type MyCoach,
} from '../../lib/coach/api';

const SCOPES = Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[];

/** The client's control panel: who coaches them, what each coach sees, and when they looked. */
export function SettingsCoachSection() {
  const coaches = useMyCoaches();
  const accessLog = useCoachAccessLog();

  return (
    <div className="card p-4 sm:p-6">
      <SettingsSectionHeader title="Entrenador" icon={GraduationCap} />
      <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-6">
        <div>
          <h3 className="form-label mb-2">Mis entrenadores</h3>
          {coaches.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
          {coaches.isError && <p role="alert">No se pudieron cargar tus entrenadores.</p>}
          {coaches.data?.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>
              No tienes entrenador. Si te envía un enlace de invitación, ábrelo para vincularte.
            </p>
          )}
          <ul className="flex flex-col gap-4">
            {coaches.data?.map((link) => (
              <CoachLink key={link.linkId} link={link} />
            ))}
          </ul>
        </div>

        {accessLog.data && accessLog.data.length > 0 && (
          <div>
            <h3 className="form-label mb-2">Qué han consultado (últimos 90 días)</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {accessLog.data.map((entry) => (
                <li
                  key={`${entry.coach.email}-${entry.action}-${entry.date}`}
                  className="flex justify-between gap-2"
                >
                  <span>
                    {personName(entry.coach)} · {accessActionLabel(entry.action)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatCoachDate(entry.date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="form-label mb-2">¿Eres entrenador?</h3>
          <Link to="/entrenador" className="btn btn-secondary">
            Abrir modo entrenador
          </Link>
        </div>
      </div>
    </div>
  );
}

function CoachLink({ link }: { link: MyCoach }) {
  const update = useUpdateCoachPermissions();
  const end = useEndCoach();
  const name = personName(link.coach);

  const toggle = (scope: keyof CoachPermissions, checked: boolean) => {
    const permissions = withScope(link.permissions, scope, checked);
    if (!SCOPES.some((s) => permissions[s])) {
      toast.error('Comparte al menos una cosa o termina la relación');
      return;
    }
    update.mutate(
      { linkId: link.linkId, permissions },
      { onError: (e) => toast.error(apiErrorMessage(e, 'No se pudieron guardar los permisos')) },
    );
  };

  return (
    <li className="rounded-lg p-3 border" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="font-bold text-white">{name}</div>
      <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {link.coach.email} · desde {formatCoachDate(link.since)}
      </div>
      <fieldset className="flex flex-col gap-2 mb-3">
        <legend className="sr-only">Qué compartes con {name}</legend>
        {SCOPES.map((scope) => (
          <label key={scope} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={link.permissions[scope]}
              disabled={update.isPending || scopeDisabled(link.permissions, scope)}
              onChange={(e) => toggle(scope, e.target.checked)}
            />
            <span>{PERMISSION_LABELS[scope].title}</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {PERMISSION_LABELS[scope].detail}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Link to={`/checkin/${encodeURIComponent(link.linkId)}`} className="btn btn-primary">
          Check-in semanal
        </Link>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={end.isPending}
          onClick={() => {
            if (
              !window.confirm(
                `¿Terminar la relación con ${name}? Dejará de ver tus datos al momento.`,
              )
            )
              return;
            end.mutate(link.linkId, {
              onSuccess: () => toast.success('Relación terminada'),
              onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
            });
          }}
        >
          Terminar relación
        </button>
      </div>
    </li>
  );
}
