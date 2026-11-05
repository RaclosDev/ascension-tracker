import React from 'react';
import { ClipboardList, MessageSquare, Users } from 'lucide-react';
import DripButton from './DripButton';
import { requestGoogleSignIn } from '../GoogleSignInButton';

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

// Mirrors app.coach.plans in the backend's application.yml.
const plans = [
  { name: 'Gratis', price: 0, clients: 1 },
  { name: 'Básico', price: 19, clients: 10 },
  { name: 'Pro', price: 39, clients: 25 },
  { name: 'Élite', price: 69, clients: 50 },
];

export default function LandingCoaches() {
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

      <ul
        className="mt-6 grid grid-cols-2 gap-px border border-[var(--landing-steel)] bg-[var(--landing-steel)] lg:grid-cols-4"
        aria-label="Planes para entrenadores"
      >
        {plans.map((p) => (
          <li key={p.name} className="bg-[var(--landing-bg)] p-5">
            <p className="landing-display text-[0.8rem] tracking-[0.1em] text-[var(--landing-muted)]">
              {p.name}
            </p>
            <p className="landing-display mt-2 text-[1.8rem] font-bold text-white">
              {p.price === 0 ? 'Gratis' : `${p.price} €`}
              {p.price > 0 && (
                <span className="text-[0.9rem] font-normal text-[var(--landing-muted)]">/mes</span>
              )}
            </p>
            <p className="mt-1 text-[0.9rem] text-[var(--landing-muted)]">
              Hasta {p.clients} {p.clients === 1 ? 'alumno' : 'alumnos'}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.9rem] text-[var(--landing-muted)]">
        Pagando el año entero, dos meses gratis.
      </p>

      <div className="mt-8 flex flex-col gap-6 border border-[var(--landing-steel)] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="landing-display text-[1.4rem] font-semibold text-white">
            ¿Más de 50 alumnos o un plan a medida?
          </h3>
          <p className="mt-2 max-w-[56ch] text-[0.95rem] text-[var(--landing-muted)]">
            Gimnasios, equipos de entrenadores o cualquier duda: entra con tu cuenta de Google y
            escríbenos desde Modo entrenador › Plan y facturación. Te respondemos por email.
          </p>
        </div>
        <DripButton href="#entrar" onClick={requestGoogleSignIn} className="shrink-0">
          Probar 14 días gratis
        </DripButton>
      </div>
    </section>
  );
}
