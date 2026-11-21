import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import InkButton from './InkButton';
import { SIGN_UP } from './routes';
import LandingShowcase from './LandingShowcase';

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

// The poster at the top of the landing: what the app is and the way in on the left, the real
// screens on the right. The sign-in form lives on its own page (/login).
export default function LandingHero() {
  return (
    <section
      id="inicio"
      className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-12 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-12 lg:gap-8 lg:pb-20"
    >
      <div className="landing-rise lg:col-span-6 xl:col-span-5">
        <h1 className="landing-display mb-7 text-[clamp(3.2rem,8vw,5.6rem)] font-bold xl:text-[4.7rem] text-white">
          Tu progreso
          <br />
          bajo{' '}
          <span className="landing-tag">
            control
            <Stroke />
          </span>
        </h1>
        <p className="max-w-[46ch] text-[1.02rem] leading-relaxed text-[var(--landing-muted)]">
          Récords por ejercicio y por variante, comidas registradas con una foto, peso y pasos cada
          día. Una PWA gratuita en español que funciona sin conexión y se instala en el móvil.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <InkButton to={SIGN_UP}>Crear mi cuenta</InkButton>
          <a href="/demo" className="landing-alt-cta inline-flex items-center">
            Probar la demo
          </a>
        </div>
        <p className="mt-4 text-[0.9rem] text-[var(--landing-muted)]">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-bold text-[var(--landing-ink)] underline underline-offset-4"
          >
            Inicia sesión
          </Link>
        </p>
        <a
          href="#funciones"
          className="landing-display mt-4 hidden min-h-11 items-center gap-2 text-[0.85rem] tracking-[0.1em] text-[var(--landing-muted)] hover:text-white focus-visible:text-white lg:inline-flex"
        >
          Ver qué incluye
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="landing-rise landing-rise-2 lg:col-span-6 xl:col-span-7">
        <LandingShowcase />
      </div>
    </section>
  );
}
