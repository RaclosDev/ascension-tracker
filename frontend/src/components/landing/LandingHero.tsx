import GoogleSignInButton from '../GoogleSignInButton';
import { Crown, ArrowDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import EmailAccess from './EmailAccess';

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

// The page is /login: the poster on the left says what the app is, and the access sheet on the
// right is pinned where the eye lands, with email first and Google as the other way in.
export default function LandingHero() {
  const { login } = useAuth();

  return (
    <section
      id="inicio"
      className="relative mx-auto grid max-w-6xl items-start gap-10 px-5 pb-16 pt-8 sm:px-8 sm:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-24"
    >
      <div className="landing-rise lg:col-span-7 lg:pt-7">
        <p className="landing-display flex items-center gap-2 text-[1.15rem] tracking-[0.08em] text-[var(--landing-blue)]">
          <Crown size={20} aria-hidden="true" />
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
        <p className="max-w-[46ch] text-[1.02rem] leading-relaxed text-[var(--landing-muted)]">
          Récords por ejercicio y por variante, comidas registradas con una foto, peso y pasos cada
          día. Una PWA gratuita en español que funciona sin conexión y se instala en el móvil.
        </p>
        <a
          href="#funciones"
          className="landing-display mt-6 hidden min-h-11 items-center gap-2 text-[0.85rem] tracking-[0.1em] text-[var(--landing-muted)] hover:text-white focus-visible:text-white lg:inline-flex"
        >
          Ver qué incluye
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </div>

      <div
        id="entrar"
        className="landing-rise landing-rise-2 landing-sheet w-full max-w-md justify-self-center p-5 sm:p-7 lg:col-span-5 lg:justify-self-end"
        aria-labelledby="entrar-title"
        role="region"
      >
        <h2 id="entrar-title" className="landing-display text-[1.9rem] font-bold text-white">
          Entra en Ascension
        </h2>
        <p className="mt-1 mb-5 text-[0.9rem] text-[var(--landing-muted)]">
          Gratis para uso personal, sin anuncios y sin tarjeta.
        </p>
        <EmailAccess
          alternatives={
            <GoogleSignInButton
              className="landing-alt-cta w-full"
              onCredential={async (credential) => {
                const res = await api.post<{ token?: string }>('/auth/login', {
                  token: credential,
                });
                if (!res.data.token) throw new Error('Invalid authentication response');
                login(res.data.token);
              }}
            />
          }
        />
      </div>
    </section>
  );
}
