import React from 'react';
import GoogleSignInButton from '../GoogleSignInButton';
import { Crown, ArrowDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

// Marker stroke under the blue tag word, drawn by hand so it never repeats exactly.
const Stroke = () => (
  <svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
    <path
      d="M3 14c40-7 90-9 194-6M8 17c50-4 100-5 180-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
);

export default function LandingHero() {
  const { login } = useAuth();

  return (
    <section
      id="inicio"
      className="landing-hero relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-12 lg:gap-6 lg:pb-24"
    >
      <div className="landing-rise lg:col-span-7 lg:self-end">
        <p className="landing-display flex items-center gap-2 text-[0.85rem] tracking-[0.12em] text-[var(--landing-blue)]">
          <Crown size={16} aria-hidden="true" />
          Entreno · Nutrición · Peso
        </p>
        <h1 className="landing-display mt-4 mb-8 text-[clamp(3.2rem,9vw,6rem)] font-bold text-white">
          Tu progreso
          <br />
          bajo{' '}
          <span className="landing-tag">
            control
            <Stroke />
          </span>
        </h1>
      </div>

      <div className="landing-rise landing-rise-2 relative lg:col-span-5 lg:row-span-2">
        <div className="landing-vault mx-auto w-[min(100%,300px)] p-3 lg:w-[320px] lg:rotate-2">
          <img
            src="/landing/dashboard.webp"
            alt="Panel principal de Ascension con el peso de hoy, el total perdido y la fecha estimada para llegar al objetivo"
            width="470"
            height="1024"
            className="block w-full"
            fetchPriority="high"
          />
        </div>
      </div>

      <div className="landing-rise landing-rise-3 lg:col-span-7 lg:max-w-xl">
        <p className="max-w-[46ch] text-[1.02rem] leading-relaxed text-[var(--landing-muted)]">
          Récords por ejercicio y por variante, comidas registradas con una foto, peso y pasos cada
          día. Una PWA gratuita en español que funciona sin conexión y se instala en el móvil.
        </p>

        <div id="entrar" className="mt-7 flex flex-wrap items-center gap-5">
          <div className="flex min-h-11 items-center">
            <GoogleSignInButton
              onCredential={async (credential) => {
                const res = await api.post<{ token?: string }>('/auth/login', {
                  token: credential,
                });
                if (!res.data.token) throw new Error('Invalid authentication response');
                login(res.data.token);
              }}
            />
          </div>
          <a
            href="#funciones"
            className="landing-display flex min-h-11 items-center gap-2 text-[0.85rem] tracking-[0.1em] text-[var(--landing-muted)] hover:text-white focus-visible:text-white"
          >
            Ver qué incluye
            <ArrowDown size={16} aria-hidden="true" />
          </a>
        </div>
        <p className="mt-3 text-[0.8rem] text-[var(--landing-muted)]">
          Solo cuenta de Google. Sin registro, sin contraseña, sin tarjeta.
        </p>
      </div>
    </section>
  );
}
