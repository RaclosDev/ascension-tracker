import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { apiErrorMessage, useCoachProfile } from '../lib/coach/api';
import {
  planName,
  useCoachBilling,
  useCoachSubscription,
  useSendContactRequest,
  type CoachBilling,
  type CoachSubscription,
  type ContactTopic,
} from '../lib/coach/plan';

const STATUS_TEXT: Record<string, string> = {
  TRIALING: 'Prueba gratis',
  ACTIVE: 'Pagado',
  PAST_DUE: 'Pago pendiente',
  CANCELED: 'Cancelado',
  FREE: 'Gratis',
};
const TOPICS: { id: ContactTopic; label: string }[] = [
  { id: 'PLAN', label: 'Contratar o cambiar de plan' },
  { id: 'CUSTOM', label: 'Plan a medida' },
  { id: 'OTHER', label: 'Otra consulta' },
];
const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });

/** The coach's plan, the prices, how to pay by transfer and a way to write to us. */
export default function CoachPlanPage() {
  const profile = useCoachProfile();
  const isCoach = profile.data?.coach === true;
  const subscription = useCoachSubscription(isCoach);
  const billing = useCoachBilling(isCoach);

  return (
    <div className="fade-in max-w-5xl mx-auto px-4 pt-2 sm:pt-4">
      <header className="mb-6 pb-2 border-b border-white/5 flex items-center gap-3">
        <Link to="/entrenador" aria-label="Volver al modo entrenador" className="btn btn-secondary">
          <ArrowLeft size={16} aria-hidden />
        </Link>
        <h1 className="text-2xl font-black text-white tracking-tight">Plan y facturación</h1>
      </header>
      <div className="flex flex-col gap-6">
        {(profile.isLoading || subscription.isLoading || billing.isLoading) && (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>
        )}
        {(subscription.isError || billing.isError) && (
          <p role="alert">
            {apiErrorMessage(subscription.error ?? billing.error, 'No se pudo cargar tu plan.')}
          </p>
        )}
        {profile.data && !isCoach && (
          <section className="card">
            <p style={{ color: 'var(--text-secondary)' }}>
              Activa el modo entrenador para ver tu plan. Si tienes dudas antes, escríbenos aquí
              abajo.
            </p>
          </section>
        )}
        {subscription.data && <CurrentPlan subscription={subscription.data} />}
        {billing.data && <Plans billing={billing.data} current={subscription.data} />}
        {billing.data && <HowToPay billing={billing.data} />}
        <ContactForm />
      </div>
    </div>
  );
}

function CurrentPlan({ subscription }: { subscription: CoachSubscription }) {
  const { status, effectivePlan, trialEndsAt, currentPeriodEnd } = subscription;
  let detail: string | null = null;
  if (status === 'TRIALING' && trialEndsAt && effectivePlan !== 'FREE') {
    const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / DAY_MS));
    detail = `Te quedan ${days} ${days === 1 ? 'día' : 'días'} de prueba (hasta el ${formatDate(trialEndsAt)}).`;
  } else if (status === 'ACTIVE' && currentPeriodEnd && effectivePlan !== 'FREE') {
    detail = `Pagado hasta el ${formatDate(new Date(new Date(currentPeriodEnd).getTime() - 1).toISOString())}.`;
  } else if (effectivePlan === 'FREE' && status !== 'FREE') {
    detail = 'Tu periodo terminó y ahora estás en el plan gratis. Tus alumnos siguen ahí.';
  }
  return (
    <section className="card">
      <h2 className="card-title">Tu plan: {planName(effectivePlan)}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        {STATUS_TEXT[status] ?? status} · {subscription.activeClients} de {subscription.maxClients}{' '}
        alumnos · {subscription.aiDailyLimit} consultas de IA al día
      </p>
      {detail && <p className="mt-2 text-sm">{detail}</p>}
    </section>
  );
}

function Plans({ billing, current }: { billing: CoachBilling; current?: CoachSubscription }) {
  const free = billing.annualMonths < 12 ? 12 - billing.annualMonths : 0;
  return (
    <section className="card">
      <h2 className="card-title">Planes</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {billing.plans.map((plan) => (
          <li
            key={plan.id}
            className="rounded-lg border p-4 flex flex-col gap-1"
            style={{
              borderColor:
                current?.effectivePlan === plan.id ? 'var(--accent)' : 'var(--border-subtle)',
            }}
          >
            <p className="font-bold text-white">{planName(plan.id)}</p>
            <p className="text-xl font-black text-white">
              {plan.monthlyPriceEur === 0 ? 'Gratis' : `${plan.monthlyPriceEur} €/mes`}
            </p>
            {plan.monthlyPriceEur > 0 && free > 0 && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                o {plan.annualPriceEur} €/año ({free} meses gratis)
              </p>
            )}
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Hasta {plan.maxClients} {plan.maxClients === 1 ? 'alumno' : 'alumnos'} ·{' '}
              {plan.aiDailyLimit} IA/día
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
        ¿Más de 50 alumnos, un equipo de entrenadores o algo a medida? Escríbenos con el formulario
        de abajo y te preparamos un plan.
      </p>
    </section>
  );
}

function HowToPay({ billing }: { billing: CoachBilling }) {
  return (
    <section className="card">
      <h2 className="card-title">Cómo pagar</h2>
      {billing.transferHolder && billing.transferIban ? (
        <>
          <p style={{ color: 'var(--text-secondary)' }}>
            Haz una transferencia mensual (o anual) a esta cuenta y escríbenos abajo qué plan
            quieres. Lo activamos en cuanto llegue.
          </p>
          <dl className="mt-3 grid gap-1 text-sm">
            <div>
              <dt className="inline" style={{ color: 'var(--text-secondary)' }}>
                Titular:{' '}
              </dt>
              <dd className="inline font-bold text-white">{billing.transferHolder}</dd>
            </div>
            <div>
              <dt className="inline" style={{ color: 'var(--text-secondary)' }}>
                IBAN:{' '}
              </dt>
              <dd className="inline font-bold text-white break-all">{billing.transferIban}</dd>
            </div>
            <div>
              <dt className="inline" style={{ color: 'var(--text-secondary)' }}>
                Concepto:{' '}
              </dt>
              <dd className="inline font-bold text-white">Ascension + el email de tu cuenta</dd>
            </div>
          </dl>
        </>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>
          De momento el pago es por transferencia. Escríbenos qué plan quieres y te enviamos los
          datos.
        </p>
      )}
    </section>
  );
}

function ContactForm() {
  const [params] = useSearchParams();
  const initial = TOPICS.find((t) => t.id === params.get('tema'))?.id ?? 'PLAN';
  const [topic, setTopic] = useState<ContactTopic>(initial);
  const [message, setMessage] = useState('');
  const [clients, setClients] = useState('');
  const [sent, setSent] = useState(false);
  const send = useSendContactRequest();
  const desired = Number.parseInt(clients, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    send.mutate(
      {
        topic,
        message: message.trim(),
        ...(desired > 0 ? { desiredClients: Math.min(desired, 10000) } : {}),
      },
      {
        onSuccess: () => {
          setSent(true);
          setMessage('');
          setClients('');
        },
        onError: (error) => toast.error(apiErrorMessage(error, 'No se pudo enviar el mensaje.')),
      },
    );
  };

  return (
    <section className="card" id="contacto">
      <h2 className="card-title flex items-center gap-2">
        <Mail size={18} aria-hidden /> Escríbenos
      </h2>
      <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
        Para contratar un plan, pedir uno a medida o cualquier duda. Te respondemos al email de tu
        cuenta.
      </p>
      {sent ? (
        <p role="status">Mensaje enviado. Te responderemos pronto al email de tu cuenta.</p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Tema</span>
            <select
              className="rounded-lg px-3 py-2 bg-black/20 border"
              style={{ borderColor: 'var(--border-subtle)' }}
              value={topic}
              onChange={(e) => setTopic(e.target.value as ContactTopic)}
            >
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              ¿Cuántos alumnos llevas? (opcional)
            </span>
            <input
              type="number"
              min={1}
              max={10000}
              inputMode="numeric"
              className="rounded-lg px-3 py-2 bg-black/20 border w-40"
              style={{ borderColor: 'var(--border-subtle)' }}
              value={clients}
              onChange={(e) => setClients(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Mensaje</span>
            <textarea
              className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
              style={{ borderColor: 'var(--border-subtle)' }}
              rows={4}
              maxLength={2000}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary self-start"
            disabled={send.isPending || message.trim() === ''}
          >
            {send.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      )}
    </section>
  );
}
