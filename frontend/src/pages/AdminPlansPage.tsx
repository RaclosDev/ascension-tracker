import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../lib/coach/api';
import {
  useAdminCoaches,
  useIsAdmin,
  useSetCoachPlan,
  type AdminCoach,
  type PlanInfo,
} from '../lib/admin/plans';

const PLAN_NAMES: Record<string, string> = {
  FREE: 'Gratis',
  STARTER: 'Básico',
  PRO: 'Pro',
  ELITE: 'Élite',
};
const STATUS_NAMES: Record<string, string> = {
  TRIALING: 'En prueba',
  ACTIVE: 'Pagado',
  PAST_DUE: 'Pago pendiente',
  CANCELED: 'Cancelado',
  FREE: 'Gratis',
};
const FREE_PLAN = 'FREE';

const planName = (id: string) => PLAN_NAMES[id] ?? id;
const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }) : '—';

/** Today plus one month minus one day, in local time, as yyyy-mm-dd: a month paid from today. */
function defaultPaidUntil(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Back office: set a coach's plan by hand after their bank transfer arrives. */
export default function AdminPlansPage() {
  const isAdmin = useIsAdmin();
  const overview = useAdminCoaches(isAdmin.data === true);

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 pt-2 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight">Planes de entrenadores</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Cuando llegue la transferencia, elige el plan y hasta qué día está pagado. Al pasar esa
          fecha, el entrenador vuelve al plan gratis sin perder alumnos.
        </p>
      </header>

      {(isAdmin.isLoading || overview.isLoading) && (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>
      )}
      {isAdmin.data === false && <p role="alert">Esta página es solo para administradores.</p>}
      {(isAdmin.isError || overview.isError) && (
        <p role="alert">
          {apiErrorMessage(overview.error ?? isAdmin.error, 'No se pudieron cargar los planes.')}
        </p>
      )}
      {overview.data?.coaches.length === 0 && (
        <section className="card">
          <p style={{ color: 'var(--text-secondary)' }}>Aún no hay entrenadores.</p>
        </section>
      )}
      <ul className="flex flex-col gap-3">
        {overview.data?.coaches.map((coach) => (
          <CoachRow key={coach.coachId} coach={coach} plans={overview.data.plans} />
        ))}
      </ul>
    </div>
  );
}

function CoachRow({ coach, plans }: { coach: AdminCoach; plans: PlanInfo[] }) {
  const setPlan = useSetCoachPlan();
  const [plan, setPlanId] = useState(coach.status === 'ACTIVE' ? coach.plan : 'STARTER');
  const [paidUntil, setPaidUntil] = useState(defaultPaidUntil());
  const free = plan === FREE_PLAN;
  const until = coach.status === 'TRIALING' ? coach.trialEndsAt : coach.currentPeriodEnd;

  const save = () =>
    setPlan.mutate(
      { coachId: coach.coachId, change: free ? { plan } : { plan, paidUntil } },
      {
        onSuccess: () => toast.success('Plan guardado'),
        onError: (error) => toast.error(apiErrorMessage(error, 'No se pudo guardar el plan.')),
      },
    );

  return (
    <li className="card flex flex-col gap-3">
      <div className="min-w-0">
        <p className="font-bold text-white truncate">{coach.name || coach.email}</p>
        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
          {coach.email}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {planName(coach.plan)} · {STATUS_NAMES[coach.status] ?? coach.status}
          {until && ` hasta el ${formatDate(until)}`} · Aplica: {planName(coach.effectivePlan)} ·{' '}
          {coach.activeClients}/{coach.maxClients} alumnos
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Plan</span>
          <select
            className="rounded-lg px-3 py-2 bg-black/20 border"
            style={{ borderColor: 'var(--border-subtle)' }}
            aria-label={`Plan de ${coach.email}`}
            value={plan}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {planName(p.id)} ({p.maxClients} alumnos)
              </option>
            ))}
          </select>
        </label>
        {!free && (
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Pagado hasta (incluido)</span>
            <input
              type="date"
              className="rounded-lg px-3 py-2 bg-black/20 border"
              style={{ borderColor: 'var(--border-subtle)' }}
              aria-label={`Pagado hasta para ${coach.email}`}
              value={paidUntil}
              onChange={(e) => setPaidUntil(e.target.value)}
            />
          </label>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={setPlan.isPending || (!free && !paidUntil)}
          onClick={save}
        >
          Guardar plan
        </button>
      </div>
    </li>
  );
}
