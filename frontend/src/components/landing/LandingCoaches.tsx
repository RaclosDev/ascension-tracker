import { ClipboardList, MessageSquare, Users } from 'lucide-react';
import DripButton from './DripButton';
import { requestEmailAccess } from './emailAccessEvents';
import { planName } from '../../lib/coach/plan';
import { usePublicInfo } from '../../lib/publicInfo';

const features = [
  {
    icon: Users,
    title: 'Tus alumnos, en un panel',
    text: 'Invítalos con un enlace. Cada uno elige qué te comparte y un semáforo te dice a quién atender primero.',
  },
  {
    icon: ClipboardList,
    title: 'Programas y recetas',
    text: 'Monta programas por semanas y días, asígnalos y pauta comidas con tus recetas y sus macros.',
  },
  {
    icon: MessageSquare,
    title: 'Check-in semanal',
    text: 'Tus preguntas cada semana, fotos de progreso y avisos en el móvil cuando te responden.',
  },
];

export default function LandingCoaches() {
  // Prices come from the backend (app.coach.plans); without them the list is just left out.
  const { data } = usePublicInfo();
  const plans = data?.plans ?? [];
  const top = plans.reduce((max, p) => Math.max(max, p.maxClients), 0);
  const freeMonths = data && data.annualMonths < 12 ? 12 - data.annualMonths : 0;
  const email = data?.contactEmail;
  return (
    <section
      id="entrenadores"
      className="mx-auto mt-20 max-w-6xl px-5 sm:px-8 lg:mt-28"
      aria-labelledby="coaches-title"
    >
      <p className="landing-display text-[0.85rem] tracking-[0.12em] text-[var(--landing-blue)]">
        Para entrenadores
      </p>
      <h2
        id="coaches-title"
        className="landing-display mt-3 max-w-[18ch] text-[clamp(2.2rem,6vw,4rem)] font-bold text-white"
      >
        Lleva a tus alumnos desde la misma app
      </h2>
      <p className="mt-4 max-w-[52ch] text-[var(--landing-muted)]">
        Tus alumnos registran entreno, comida y peso en Ascension, y tú lo ves todo en un panel.
        Prueba el plan Pro 14 días gratis, sin tarjeta.
      </p>

      <ul className="mt-10 grid gap-px border border-[var(--landing-steel)] bg-[var(--landing-steel)] md:grid-cols-3">
        {features.map((f) => (
          <li key={f.title} className="bg-[var(--landing-bg)] p-6">
            <f.icon size={22} className="text-[var(--landing-blue)]" aria-hidden="true" />
            <h3 className="landing-display mt-4 text-[1.4rem] font-semibold text-white">
              {f.title}
            </h3>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--landing-muted)]">
              {f.text}
            </p>
          </li>
        ))}
      </ul>

      {plans.length > 0 && (
        <ul
          className="mt-6 grid grid-cols-2 gap-px border border-[var(--landing-steel)] bg-[var(--landing-steel)] lg:grid-cols-4"
          aria-label="Planes para entrenadores"
        >
          {plans.map((p) => (
            <li key={p.id} className="bg-[var(--landing-bg)] p-5">
              <p className="landing-display text-[0.8rem] tracking-[0.1em] text-[var(--landing-muted)]">
                {planName(p.id)}
              </p>
              <p className="landing-display mt-2 text-[1.8rem] font-bold text-white">
                {p.monthlyPriceEur === 0 ? 'Gratis' : `${p.monthlyPriceEur} €`}
                {p.monthlyPriceEur > 0 && (
                  <span className="text-[0.9rem] font-normal text-[var(--landing-muted)]">
                    /mes
                  </span>
                )}
              </p>
              <p className="mt-1 text-[0.9rem] text-[var(--landing-muted)]">
                Hasta {p.maxClients} {p.maxClients === 1 ? 'alumno' : 'alumnos'}
              </p>
            </li>
          ))}
        </ul>
      )}
      {plans.length > 0 && freeMonths > 0 && (
        <p className="mt-3 text-[0.9rem] text-[var(--landing-muted)]">
          Pagando el año entero, {freeMonths === 1 ? 'un mes gratis' : `${freeMonths} meses gratis`}
          .
        </p>
      )}

      <div className="mt-8 flex flex-col gap-6 border border-[var(--landing-steel)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="landing-display text-[1.4rem] font-semibold text-white">
            {top > 0
              ? `¿Más de ${top} alumnos o un plan a medida?`
              : '¿Necesitas un plan a medida?'}
          </h3>
          <p className="mt-2 max-w-[56ch] text-[0.95rem] text-[var(--landing-muted)]">
            Gimnasios, equipos de entrenadores o cualquier duda:{' '}
            {email ? (
              <>
                escríbenos a{' '}
                <a href={`mailto:${email}`} className="text-white underline underline-offset-4">
                  {email}
                </a>{' '}
                o, con tu cuenta, desde Modo entrenador › Plan y facturación.
              </>
            ) : (
              <>
                entra con tu cuenta y escríbenos desde Modo entrenador › Plan y facturación.
              </>
            )}{' '}
            Te respondemos por email.
          </p>
        </div>
        <DripButton href="#entrar" onClick={requestEmailAccess('register')} className="shrink-0">
          Probar 14 días gratis
        </DripButton>
      </div>
    </section>
  );
}
