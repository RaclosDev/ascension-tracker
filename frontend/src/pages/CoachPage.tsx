import { useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { APP_MODULE_OPTIONS } from '../lib/appModules';
import { Link } from 'react-router-dom';
import { CheckinTemplateEditor } from '../components/coach/CheckinTemplateEditor';
import { PushToggle } from '../components/coach/PushToggle';
import { SegmentedControl } from '../components/ui/segmented-control';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  LEVEL_COLORS,
  LEVEL_LABELS,
  LEVEL_ORDER,
  signalText,
  useClientStatus,
  type ClientStatus,
} from '../lib/coach/clientStatus';
import toast from 'react-hot-toast';
import { ChevronRight, Copy, Share2, Trash2, UserPlus } from 'lucide-react';
import {
  PERMISSION_LABELS,
  apiErrorMessage,
  formatCoachDate,
  scopeDisabled,
  sharedScopes,
  withScope,
  type CoachClient,
  type CoachPermissions,
  type InvitationRequest,
  invitationUrl,
  personName,
  useActivateCoach,
  useCoachClients,
  useCoachInvitations,
  useCoachProfile,
  useCreateInvitation,
  useRevokeInvitation,
} from '../lib/coach/api';

type Tab = 'clients' | 'template';
const TABS = [
  { value: 'clients', label: 'Alumnos' },
  { value: 'template', label: 'Plantilla de check-in' },
];

export default function CoachPage() {
  const profile = useCoachProfile();
  const isCoach = profile.data?.coach === true;
  const [tab, setTab] = useState<Tab>('clients');
  const [inviting, setInviting] = useState(false);

  return (
    <div className="fade-in coach-page">
      <h1 className="page-title-desktop">Entrenador</h1>
      {profile.isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>}
      {profile.isError && <p role="alert">No se pudo cargar tu perfil de entrenador.</p>}
      {profile.data && !isCoach && <ActivateCoach />}
      {isCoach && (
        <div className="flex flex-col gap-5">
          <div className="coach-toolbar">
            <SegmentedControl
              options={TABS}
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              className="coach-tabs"
            />
            <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>
              <UserPlus size={16} aria-hidden /> Invitar alumno
            </button>
          </div>
          {tab === 'clients' ? (
            <>
              <PushToggle text="Activa los avisos para saber cuándo un alumno te envía su check-in." />
              <ClientInbox onInvite={() => setInviting(true)} />
              <PendingInvitations />
            </>
          ) : (
            <CheckinTemplateEditor />
          )}
          <InviteDialog open={inviting} onOpenChange={setInviting} />
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

type Filter = 'all' | 'attention' | 'noProgram' | 'checkin';

interface Row {
  link: CoachClient;
  status: ClientStatus | undefined;
}

const MATCHES: Record<Filter, (row: Row) => boolean> = {
  all: () => true,
  attention: ({ status }) => !!status && status.level !== 'GREEN',
  noProgram: ({ status }) => !!status?.signals.some((s) => s.reason === 'NO_PROGRAM'),
  checkin: ({ status }) => (status?.pendingReplies ?? 0) > 0,
};

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todos',
  attention: 'Atención',
  noProgram: 'Sin programa',
  checkin: 'Check-in pendiente',
};

const kgFmt = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

const weightText = (change: number | null | undefined) =>
  change == null ? '—' : `${kgFmt.format(change)} kg`;

function activityText(iso: string | null | undefined) {
  if (!iso) return 'Sin actividad';
  const days = differenceInCalendarDays(new Date(), parseISO(iso));
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

function ClientInbox({ onInvite }: { onInvite: () => void }) {
  const clients = useCoachClients(true);
  const status = useClientStatus(true);
  const [filter, setFilter] = useState<Filter>('all');
  const statusById = new Map(status.data?.map((s) => [s.linkId, s]));
  // Who needs attention first; the rest keep the alphabetical order from the server.
  const rows: Row[] = (clients.data ?? [])
    .map((link) => ({ link, status: statusById.get(link.linkId) }))
    .sort(
      (a, b) => LEVEL_ORDER[a.status?.level ?? 'GREEN'] - LEVEL_ORDER[b.status?.level ?? 'GREEN'],
    );
  const visible = rows.filter(MATCHES[filter]);
  const count = (f: Filter) => rows.filter(MATCHES[f]).length;
  const attention = count('attention');
  const pendingReplies = rows.reduce((sum, r) => sum + (r.status?.pendingReplies ?? 0), 0);
  const upToDate = rows.filter((r) => r.status?.level === 'GREEN').length;

  if (clients.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (clients.isError) return <p role="alert">No se pudo cargar la lista de alumnos.</p>;
  if (rows.length === 0) {
    return (
      <section className="card">
        <h2 className="card-title">Aún no tienes alumnos</h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Crea un enlace de invitación y envíaselo. Cada alumno decide qué te comparte.
        </p>
        <button type="button" className="btn btn-primary" onClick={onInvite}>
          <UserPlus size={16} aria-hidden /> Invitar alumno
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="coach-inbox-title" className="flex flex-col gap-4">
      <h2 id="coach-inbox-title" className="sr-only">
        Alumnos
      </h2>
      <dl className="coach-counters">
        <div>
          <dt>Necesitan atención</dt>
          <dd style={attention ? { color: 'var(--color-danger)' } : undefined}>{attention}</dd>
        </div>
        <div>
          <dt>Check-ins por responder</dt>
          <dd>{pendingReplies}</dd>
        </div>
        <div>
          <dt>Al día</dt>
          <dd>
            {upToDate}
            <span className="coach-counter-total"> de {rows.length}</span>
          </dd>
        </div>
      </dl>

      <div className="coach-chips" role="group" aria-label="Filtrar alumnos">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className="coach-chip"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]} <span className="coach-chip-count">{count(f)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="card" style={{ color: 'var(--text-secondary)' }}>
          Ningún alumno en «{FILTER_LABELS[filter]}».
        </p>
      ) : (
        <>
          <div className="card coach-table-wrap">
            <table className="coach-table">
              <thead>
                <tr>
                  <th scope="col">Alumno</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Última actividad</th>
                  <th scope="col">Peso (4 sem.)</th>
                  <th scope="col">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ link, status: st }) => (
                  <tr key={link.linkId}>
                    <td>
                      <Link to={`/entrenador/alumnos/${link.linkId}`} className="coach-row-link">
                        {personName(link.client)}
                      </Link>
                      <span className="coach-muted">{sharedScopes(link.permissions)}</span>
                    </td>
                    <td>
                      <StatusCell status={st} />
                    </td>
                    <td className="coach-num">{activityText(st?.lastActivity)}</td>
                    <td className="coach-num">{weightText(st?.weightChange)}</td>
                    <td>
                      <CheckinCell status={st} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="card coach-cards">
            {visible.map(({ link, status: st }) => (
              <li
                key={link.linkId}
                style={{ borderLeftColor: st ? LEVEL_COLORS[st.level] : 'var(--border-subtle)' }}
              >
                <Link to={`/entrenador/alumnos/${link.linkId}`} className="coach-card-link">
                  <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <span className="coach-card-name">{personName(link.client)}</span>
                    <StatusCell status={st} />
                    <span className="coach-muted">
                      {activityText(st?.lastActivity)} · Peso {weightText(st?.weightChange)}
                    </span>
                    <CheckinCell status={st} hideEmpty />
                  </span>
                  <ChevronRight size={18} aria-hidden className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function StatusCell({ status }: { status: ClientStatus | undefined }) {
  if (!status) return <span className="coach-muted">—</span>;
  const reason = status.signals[0];
  return (
    <span className="coach-status">
      <span className="coach-status-level" style={{ color: LEVEL_COLORS[status.level] }}>
        <span
          aria-hidden
          className="coach-dot"
          style={{ background: LEVEL_COLORS[status.level] }}
        />
        {LEVEL_LABELS[status.level]}
      </span>
      {reason && <span className="coach-muted">{signalText(reason)}</span>}
    </span>
  );
}

function CheckinCell({
  status,
  hideEmpty = false,
}: {
  status: ClientStatus | undefined;
  hideEmpty?: boolean;
}) {
  const pending = status?.pendingReplies ?? 0;
  if (pending === 0) return hideEmpty ? null : <span className="coach-muted">—</span>;
  return (
    <span className="coach-pending">
      {pending === 1 ? '1 por responder' : `${pending} por responder`}
    </span>
  );
}

function InviteDialog({
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
        <InvitationForm />
      </DialogContent>
    </Dialog>
  );
}

function InvitationForm() {
  const create = useCreateInvitation();
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
    <div className="flex flex-col gap-4">
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
            <span className="text-foreground">Yo ahora: solo tendrá que aceptar y registrarse</span>
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
      )}
    </div>
  );
}

function PendingInvitations() {
  const invitations = useCoachInvitations(true);
  const revoke = useRevokeInvitation();
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
