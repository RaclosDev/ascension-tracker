import { Link, useSearchParams } from 'react-router-dom';
import { Camera, Dumbbell, Scale } from 'lucide-react';
import GoogleSignInButton from '../components/GoogleSignInButton';
import EmailAccess from '../components/landing/EmailAccess';
import LandingFooter from '../components/landing/LandingFooter';
import Wordmark from '../components/landing/Wordmark';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import '../components/landing/landing.css';

const reminders = [
  { icon: Dumbbell, text: 'Tus entrenos y récords, por ejercicio y por variante.' },
  { icon: Camera, text: 'Las comidas del día, con la foto y los macros.' },
  { icon: Scale, text: 'Peso y pasos, con la media semanal y la fecha estimada.' },
];

// /login: its own page, apart from the landing. Text on the left, the access sheet on the right
// (email first, then passkey and Google). ?modo=registro opens it on "Crear cuenta".
export default function LoginPage() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const registering = params.get('modo') === 'registro';

  return (
    <div className="landing">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" className="flex min-h-11 items-center" aria-label="Ascension, inicio">
          <Wordmark className="text-[1.6rem] sm:text-[1.85rem]" />
        </Link>
        <Link
          to="/"
          className="landing-display flex min-h-11 items-center px-3 text-[1.05rem] tracking-[0.06em] text-[var(--landing-muted)] transition-colors hover:text-[var(--landing-blue)] focus-visible:text-[var(--landing-blue)]"
        >
          Qué es Ascension
        </Link>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 sm:pt-12 lg:grid-cols-12 lg:gap-12">
        <div className="landing-rise lg:col-span-7">
          <h1 className="landing-display text-[clamp(2.8rem,7vw,5rem)] font-bold text-white">
            {registering ? 'Empieza a' : 'Sigue donde'}
            <br />
            <span className="landing-tag">{registering ? 'registrarlo todo' : 'lo dejaste'}</span>
          </h1>
          <p className="mt-6 max-w-[44ch] text-[1.02rem] leading-relaxed text-[var(--landing-muted)]">
            {registering
              ? 'Crea tu cuenta con el email o con Google y empieza a apuntar entrenos, comidas, peso y pasos.'
              : 'Todo lo que registras te espera tal y como lo dejaste, también lo que apuntaste sin conexión.'}
          </p>
          <ul className="mt-8 hidden max-w-[44ch] border-t border-[var(--landing-steel)] lg:block">
            {reminders.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 border-b border-[var(--landing-steel)] py-3"
              >
                <Icon
                  size={20}
                  className="shrink-0 text-[var(--landing-blue)]"
                  aria-hidden="true"
                />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <section
          className="landing-rise landing-rise-2 landing-sheet w-full max-w-md justify-self-center p-5 sm:p-7 lg:col-span-5 lg:justify-self-end"
          aria-labelledby="entrar-title"
        >
          <h2 id="entrar-title" className="landing-display text-[1.9rem] font-bold text-white">
            Entra en Ascension
          </h2>
          <p className="mt-1 mb-5 text-[0.9rem] text-[var(--landing-muted)]">
            Gratis para uso personal, sin anuncios y sin tarjeta.
          </p>
          <EmailAccess
            initialMode={registering ? 'register' : 'login'}
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
          <a
            href="/demo"
            className="landing-display mt-4 flex min-h-11 w-full items-center justify-center border border-white/30 text-[0.9rem] tracking-[0.08em] text-white hover:bg-white/10"
          >
            Probar la demo sin registrarte
          </a>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
