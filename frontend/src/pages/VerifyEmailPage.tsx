import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { verifyEmail } from '../auth/accountAccess';
import { apiErrorMessage } from '../lib/coach/api';
import '../components/landing/landing.css';

/** Reads the token from the fragment, so it never reaches server logs or the Referer header. */
function tokenFromLocation(): string {
  return new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
}

type Outcome = { state: 'checking' } | { state: 'done' } | { state: 'failed'; message: string };

/** Page the verification email links to: confirms that the address belongs to whoever opened it. */
export default function VerifyEmailPage() {
  const queryClient = useQueryClient();
  const [token] = useState(tokenFromLocation);
  const [outcome, setOutcome] = useState<Outcome>(
    token
      ? { state: 'checking' }
      : { state: 'failed', message: 'El enlace no es válido o ha caducado.' },
  );
  // The link works once: a second request (a remount in development) would report it as spent.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    // Drop the token from the address bar and history as soon as it is read.
    window.history.replaceState(null, '', window.location.pathname);
    verifyEmail(token).then(
      () => {
        void queryClient.invalidateQueries({ queryKey: ['account', 'email'] });
        setOutcome({ state: 'done' });
      },
      (err) =>
        setOutcome({
          state: 'failed',
          message: apiErrorMessage(err, 'No se ha podido verificar el email.'),
        }),
    );
  }, [token, queryClient]);

  return (
    <div className="landing fam">
      <main className="mx-auto flex max-w-sm flex-col gap-4 px-5 py-16">
        <h1 className="landing-display text-[2rem] font-bold">Verificar email</h1>
        {outcome.state === 'checking' && <p role="status">Comprobando el enlace…</p>}
        {outcome.state === 'done' && (
          <p role="status">Listo: tu email está verificado. Ya puedes usar todas las funciones.</p>
        )}
        {outcome.state === 'failed' && (
          <p role="alert">
            {outcome.message} Si ya has iniciado sesión, pide otro enlace desde el aviso de la app.
          </p>
        )}
        <Link to="/" className="fam-btn fam-btn--ink fam-btn--block min-h-11 text-center">
          Ir a la aplicación
        </Link>
      </main>
    </div>
  );
}
