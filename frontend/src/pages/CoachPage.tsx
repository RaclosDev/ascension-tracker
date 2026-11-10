import { useState } from 'react';
import { APP_MODULE_OPTIONS } from '../lib/appModules';
import { Link } from 'react-router-dom';
import { CheckinTemplateEditor } from '../components/coach/CheckinTemplateEditor';
import { PushToggle } from '../components/coach/PushToggle';
import { ClientStatusBadge } from '../components/coach/ClientStatusBadge';
import { LEVEL_ORDER, useClientStatus } from '../lib/coach/clientStatus';
import toast from 'react-hot-toast';
import { Copy, Link2, Share2, Trash2, UserMinus, Users } from 'lucide-react';
import {
  PERMISSION_LABELS,
  apiErrorMessage,
  formatCoachDate,
  scopeDisabled,
  sharedScopes,
  withScope,
  type CoachPermissions,
  type InvitationRequest,
  invitationUrl,
  personName,
  useActivateCoach,
  useCoachClients,
  useCoachInvitations,
  useCoachProfile,
  useCreateInvitation,
  useEndClient,
  useRevokeInvitation,
} from '../lib/coach/api';

export default function CoachPage() {
  const profile = useCoachProfile();
  const isCoach = profile.data?.coach === true;

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 pt-2 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Modo entrenador</h1>
      </header>
      {profile.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {profile.isError && <p role="alert">No se pudo cargar tu perfil de entrenador.</p>}
      {profile.data && !isCoach && <ActivateCoach />}
      {isCoach && (
        <div className="flex flex-col gap-6">
          <PushToggle text="Activa los avisos para saber cuándo un alumno te envía su check-in." />
          <Clients />
          <Invitations />
          <CheckinTemplateEditor />
        </div>
      )}
    </div>
  );
}

function ActivateCoach() {
  const activate = useActivateCoach();
  return (
    <section className="card">
      <h2 className="card-title">Lleva a tus alumnos desde Ascension</h2>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Invita a tus alumnos con un enlace. Cada alumno elige qué te comparte (cuerpo, entrenamiento
        o nutrición) y puede cambiarlo o terminar la relación cuando quiera. Esta cuenta pasa a ser
        solo de entrenador: para llevar tu propio seguimiento usa otra cuenta.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={activate.isPending}
        onClick={() =>
          activate.mutate(undefined, {
            onError: (e) =>
              toast.error(apiErrorMessage(e, 'No se pudo activar el modo entrenador')),
          })
        }
      >
        Activar modo entrenador
      </button>
    </section>
  );
}

function Invitations() {
  const invitations = useCoachInvitations(true);
  const create = useCreateInvitation();
  const revoke = useRevokeInvitation();
  const [link, setLink] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [asks, setAsks] = useState<CoachPermissions>(ASK_ALL);
  const [fillIn, setFillIn] = useState(false);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);

  const createLink = (e: React.FormEvent) => {
    e.preventDefault();
    const request: InvitationRequest = {
      clientName: clientName.trim() || undefined,
      permissions: asks,
      profile: fillIn ? toProfile(profile) : undefined,
    };
    create.mutate(request, {
      onSuccess: (created) => {
        setLink(invitationUrl(created.token));
        setClientName('');
        setProfile(EMPTY_PROFILE);
        setFillIn(false);
      },
      onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo crear la invitación')),
    });
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar; cópialo a mano');
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const share = async (value: string) => {
    try {
      await navigator.share({
        title: 'Invitación a Ascension',
        text: 'Te invito a Ascension para llevar tu seguimiento conmigo:',
        url: value,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      await copy(value);
    }
  };

  return (
    <section className="card">
      <h2 className="card-title flex items-center gap-2">
        <Link2 size={18} aria-hidden /> Invitaciones
      </h2>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Cada enlace sirve para un alumno y caduca a los 7 días. Solo se muestra una vez: cópialo o
        compártelo. Ábrelo con la cuenta de tu alumno, no con la tuya.
      </p>
      <form onSubmit={createLink} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="form-label">Nombre del alumno (opcional, solo lo ves tú)</span>
          <input
            className="form-input"
            maxLength={80}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej.: Ana López"
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="form-label mb-1">Qué le pides compartir</legend>
          {SCOPES.map((scope) => (
            <label key={scope} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={asks[scope]}
                disabled={scopeDisabled(asks, scope)}
                onChange={(e) => setAsks((p) => withScope(p, scope, e.target.checked))}
              />
              <span className="text-white">{PERMISSION_LABELS[scope].title}</span>
            </label>
          ))}
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Le llegará marcado; tu alumno decide al aceptar.
          </span>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="form-label mb-1">¿Quién rellena sus datos?</legend>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="invitation-fill"
              checked={!fillIn}
              onChange={() => setFillIn(false)}
            />
            <span className="text-white">Mi alumno, al registrarse</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="invitation-fill"
              checked={fillIn}
              onChange={() => setFillIn(true)}
            />
            <span className="text-white">Yo ahora: solo tendrá que aceptar y registrarse</span>
          </label>
        </fieldset>
        {fillIn && <ProfileFields value={profile} onChange={setProfile} />}
        <div>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            Crear enlace de invitación
          </button>
        </div>
      </form>

      {link && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            aria-label="Enlace de invitación"
            value={link}
            className="flex-1 min-w-0 rounded-lg px-3 py-2 bg-black/20 border"
            style={{ borderColor: 'var(--border-subtle)' }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button type="button" className="btn btn-secondary" onClick={() => copy(link)}>
            <Copy size={16} aria-hidden /> Copiar
          </button>
          {canShare && (
            <button type="button" className="btn btn-primary" onClick={() => share(link)}>
              <Share2 size={16} aria-hidden /> Compartir
            </button>
          )}
        </div>
      )}

      {invitations.data && invitations.data.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {invitations.data.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-white">{inv.clientName ?? 'Sin nombre'}</span>
                <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Pendiente · caduca el {formatCoachDate(inv.expiresAt)}
                  {inv.prefilled && ' · datos rellenados'}
                </span>
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                aria-label="Revocar invitación"
                disabled={revoke.isPending}
                onClick={() =>
                  revoke.mutate(inv.id, {
                    onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo revocar')),
                  })
                }
              >
                <Trash2 size={16} aria-hidden /> Revocar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Clients() {
  const clients = useCoachClients(true);
  const status = useClientStatus(true);
  const end = useEndClient();
  const statusById = new Map(status.data?.map((s) => [s.linkId, s]));
  // Who needs attention first; the rest keep the alphabetical order from the server.
  const sorted = [...(clients.data ?? [])].sort(
    (a, b) =>
      LEVEL_ORDER[statusById.get(a.linkId)?.level ?? 'GREEN'] -
      LEVEL_ORDER[statusById.get(b.linkId)?.level ?? 'GREEN'],
  );

  return (
    <section className="card">
      <h2 className="card-title flex items-center gap-2">
        <Users size={18} aria-hidden /> Alumnos
      </h2>
      {clients.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {clients.data?.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>
          Aún no tienes alumnos. Envía un enlace de invitación.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {sorted.map((link) => (
          <li key={link.linkId} className="flex items-center justify-between gap-3">
            <Link to={`/entrenador/alumnos/${link.linkId}`} className="min-w-0 flex-1">
              <div className="font-bold text-white truncate">{personName(link.client)}</div>
              <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                {sharedScopes(link.permissions)} · desde {formatCoachDate(link.since)}
              </div>
              {statusById.has(link.linkId) && (
                <ClientStatusBadge status={statusById.get(link.linkId)!} />
              )}
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              aria-label={`Terminar relación con ${personName(link.client)}`}
              disabled={end.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    `¿Terminar la relación con ${personName(link.client)}? Dejarás de ver sus datos.`,
                  )
                )
                  return;
                end.mutate(link.linkId, {
                  onError: (e) =>
                    toast.error(apiErrorMessage(e, 'No se pudo terminar la relación')),
                });
              }}
            >
              <UserMinus size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const SCOPES = Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[];
const ASK_ALL: CoachPermissions = {
  training: true,
  nutrition: true,
  body: true,
  editTraining: true,
  editNutrition: true,
};

interface ProfileForm {
  sex: '' | 'M' | 'F';
  age: string;
  heightCm: string;
  startWeight: string;
  goalWeight: string;
  activityFactor: string;
  appModules: string;
}

const EMPTY_PROFILE: ProfileForm = {
  sex: '',
  age: '',
  heightCm: '',
  startWeight: '',
  goalWeight: '',
  activityFactor: '',
  appModules: 'FULL',
};

const num = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(n) ? n : null;
};

const toProfile = (f: ProfileForm): InvitationRequest['profile'] => ({
  sex: f.sex || null,
  age: num(f.age),
  heightCm: num(f.heightCm),
  startWeight: num(f.startWeight),
  goalWeight: num(f.goalWeight),
  activityFactor: num(f.activityFactor),
  appModules: f.appModules || null,
});

const NUMBER_FIELDS = [
  { key: 'age', label: 'Edad', min: 10, max: 120, step: 1 },
  { key: 'heightCm', label: 'Altura (cm)', min: 50, max: 300, step: 1 },
  { key: 'startWeight', label: 'Peso (kg)', min: 1, max: 1000, step: 0.1 },
  { key: 'goalWeight', label: 'Peso objetivo (kg)', min: 1, max: 1000, step: 0.1 },
] as const;

function ProfileFields({
  value,
  onChange,
}: {
  value: ProfileForm;
  onChange: (f: ProfileForm) => void;
}) {
  const set = (key: keyof ProfileForm) => (e: { target: { value: string } }) =>
    onChange({ ...value, [key]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex flex-col gap-1">
        <span className="form-label">Sexo</span>
        <select className="form-input" value={value.sex} onChange={set('sex')}>
          <option value="">—</option>
          <option value="M">Hombre</option>
          <option value="F">Mujer</option>
        </select>
      </label>
      {NUMBER_FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="form-label">{f.label}</span>
          <input
            className="form-input"
            type="number"
            inputMode="decimal"
            min={f.min}
            max={f.max}
            step={f.step}
            value={value[f.key]}
            onChange={set(f.key)}
          />
        </label>
      ))}
      <label className="flex flex-col gap-1">
        <span className="form-label">Actividad</span>
        <select
          className="form-input"
          value={value.activityFactor}
          onChange={set('activityFactor')}
        >
          <option value="">—</option>
          <option value="1.2">Sedentario</option>
          <option value="1.375">Ligero</option>
          <option value="1.55">Moderado</option>
          <option value="1.725">Alto</option>
          <option value="1.9">Muy alto</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 col-span-2">
        <span className="form-label">Qué usará en la app</span>
        <select className="form-input" value={value.appModules} onChange={set('appModules')}>
          {APP_MODULE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
