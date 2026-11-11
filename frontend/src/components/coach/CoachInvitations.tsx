import {
  useProfessionalSettings,
  type ProfessionalSettings,
} from '../../lib/coach/professionalSettings';
import { useState } from 'react';
import { CoachSetupFields } from './CoachSetupFields';
import { emptySetup } from '../../lib/coach/setup';
import toast from 'react-hot-toast';
import { Copy, Share2, Trash2 } from 'lucide-react';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { APP_MODULE_OPTIONS } from '../../lib/appModules';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  PERMISSION_LABELS,
  apiErrorMessage,
  formatCoachDate,
  scopeDisabled,
  withScope,
  type CoachPermissions,
  type InvitationRequest,
  invitationUrl,
  useCoachInvitations,
  useCreateInvitation,
  useRevokeInvitation,
} from '../../lib/coach/api';

export function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invitar alumno</DialogTitle>
          <DialogDescription>
            Cada enlace sirve para un alumno y caduca a los 7 días. Solo se muestra una vez: cópialo
            o compártelo. Ábrelo con la cuenta de tu alumno, no con la tuya.
          </DialogDescription>
        </DialogHeader>
        <InvitationDefaults />
      </DialogContent>
    </Dialog>
  );
}

function InvitationDefaults() {
  const settings = useProfessionalSettings();
  if (settings.isPending) return <p role="status">Cargando valores de incorporación…</p>;
  if (settings.isError)
    return <QueryErrorNotice pending={settings.isFetching} retry={() => void settings.refetch()} />;
  return <InvitationForm defaults={settings.data} />;
}

function InvitationForm({ defaults }: { defaults: ProfessionalSettings }) {
  const create = useCreateInvitation();
  const [link, setLink] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [asks, setAsks] = useState<CoachPermissions>({
    training: defaults.services.training,
    editTraining: defaults.services.training,
    nutrition: defaults.services.nutrition,
    editNutrition: defaults.services.nutrition,
    body: defaults.services.progress,
  });
  const [fillIn, setFillIn] = useState(defaults.prefill);
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [setup, setSetup] = useState(() => ({
    ...emptySetup(),
    services: { ...defaults.services },
  }));

  const createLink = (e: React.FormEvent) => {
    e.preventDefault();
    const request: InvitationRequest = {
      clientName: clientName.trim() || undefined,
      permissions: asks,
      profile: fillIn ? toProfile(profile) : undefined,
      setup,
    };
    create.mutate(request, {
      onSuccess: (created) => {
        setLink(invitationUrl(created.token));
        setClientName('');
        setProfile(EMPTY_PROFILE);
        setFillIn(false);
        setSetup(emptySetup());
        setAsks(ASK_TRAINING);
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
    <div className="flex flex-col gap-4">
      {!link && (
        <form onSubmit={createLink} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="form-label">Nombre del alumno (opcional)</span>
            <input
              className="form-input"
              maxLength={80}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej.: Ana López"
            />
          </label>
          <CoachSetupFields value={setup} onChange={setSetup} />
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
                <span className="text-foreground">{PERMISSION_LABELS[scope].title}</span>
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
              <span className="text-foreground">Mi alumno, al registrarse</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="invitation-fill"
                checked={fillIn}
                onChange={() => setFillIn(true)}
              />
              <span className="text-foreground">
                Yo ahora: solo tendrá que aceptar y registrarse
              </span>
            </label>
          </fieldset>
          {fillIn && <ProfileFields value={profile} onChange={setProfile} />}
          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={create.isPending || !Object.values(setup.services).some(Boolean)}
            >
              Crear enlace de invitación
            </button>
          </div>
        </form>
      )}

      {link && (
        <section className="flex flex-col gap-4">
          <div>
            <h3>Invitación preparada</h3>
            <p className="coach-description">
              Copia o comparte el enlace antes de cerrar. Cuando el alumno lo acepte, aparecerá en
              tu cartera para revisar sus datos y preparar el primer plan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              aria-label="Enlace de invitación"
              value={link}
              className="form-input flex-1 min-w-0"
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
          <div>
            <button type="button" className="btn btn-secondary" onClick={() => setLink(null)}>
              Invitar a otro alumno
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export function PendingInvitations() {
  const invitations = useCoachInvitations(true);
  const revoke = useRevokeInvitation();
  if (invitations.isError)
    return (
      <QueryErrorNotice retry={() => void invitations.refetch()} pending={invitations.isFetching} />
    );
  if (!invitations.data || invitations.data.length === 0) return null;

  return (
    <section className="card" aria-labelledby="coach-pending-title">
      <h2 id="coach-pending-title" className="card-title">
        Invitaciones pendientes
      </h2>
      <ul className="flex flex-col gap-2">
        {invitations.data.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="block text-foreground">{inv.clientName ?? 'Sin nombre'}</span>
              <span className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                Caduca el {formatCoachDate(inv.expiresAt)}
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
    </section>
  );
}

const SCOPES = Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[];
const ASK_TRAINING: CoachPermissions = {
  training: true,
  nutrition: false,
  body: false,
  editTraining: true,
  editNutrition: false,
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
