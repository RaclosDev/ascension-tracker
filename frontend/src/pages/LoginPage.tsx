import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';
import EmailAccess, { type AccessMode } from '../components/landing/EmailAccess';
import LandingFooter from '../components/landing/LandingFooter';
import SiteHeader from '../components/landing/SiteHeader';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import '../components/landing/landing.css';

// /login: one centred card, laid out like PorrApp's and LoopDeck's. ?modo=registro opens it on
// "Crear cuenta".
export default function LoginPage() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<AccessMode>(
    params.get('modo') === 'registro' ? 'register' : 'login',
  );
  const registering = mode === 'register';

  return (
    <div className="landing fam">
      <SiteHeader>
        <Link to="/" className="fam-navlink">
          ← Volver
        </Link>
      </SiteHeader>
      <main className="fam-container fam-auth">
        <section className="fam-card landing-rise" aria-labelledby="entrar-title">
          <h1 id="entrar-title" className="fam-card__title">
            {registering ? 'Crea tu cuenta en Ascension' : 'Inicia sesión en Ascension'}
          </h1>
          <p className="fam-card__sub">
            {registering
              ? 'Gratis para uso personal, sin anuncios y sin tarjeta.'
              : 'Tus entrenos, comidas y peso, tal y como los dejaste.'}
          </p>
          <EmailAccess
            initialMode={mode}
            onModeChange={setMode}
            alternatives={
              <GoogleSignInButton
                className="fam-btn fam-btn--block"
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
          <p className="fam-legal">
            Al continuar aceptas los <a href="/terminos">términos</a> y la{' '}
            <a href="/privacidad">política de privacidad</a>.
          </p>
        </section>
        <a href="/demo" className="fam-btn fam-auth__demo">
          Probar la demo sin registrarte
        </a>
      </main>
      <LandingFooter />
    </div>
  );
}
