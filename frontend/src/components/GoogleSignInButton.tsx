import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { setRedirectSignInStarted } from '../auth/sessionBoundary';

/** Google's rendered button can't be wider than 400 px. */
const GOOGLE_MAX_WIDTH = 400;

/**
 * Google's own "Continuar con Google" button, rendered inline at the card's width, exactly like
 * PorrApp's and LoopDeck's sign-in cards. Inside the installed PWA it switches to a full-page
 * redirect, since popups don't come back to a standalone window.
 */
export default function GoogleSignInButton({
  onCredential,
}: {
  onCredential: (credential: string) => Promise<void>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [standalone] = useState(
    () =>
      window.matchMedia?.('(display-mode: standalone)').matches ||
      ('standalone' in navigator && navigator.standalone === true),
  );
  const redirectFailed = new URLSearchParams(window.location.search).get('authError') === 'google';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const loginUri = standalone
    ? new URL('/api/auth/login/redirect', window.location.origin).href
    : undefined;

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => setWidth(Math.floor(row.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (standalone) setRedirectSignInStarted(true);
    return () => {
      if (standalone) setRedirectSignInStarted(false);
    };
  }, [standalone]);

  const handleSuccess = useCallback(
    async ({ credential }: CredentialResponse) => {
      if (!credential) {
        setError('Google no ha devuelto ninguna credencial.');
        return;
      }
      setError('');
      setPending(true);
      try {
        await onCredential(credential);
      } catch {
        setError('No se ha podido iniciar sesión con Google. Inténtalo de nuevo.');
      } finally {
        setPending(false);
      }
    },
    [onCredential],
  );

  const googleWidth = Math.min(GOOGLE_MAX_WIDTH, width);

  return (
    <div ref={rowRef} className="flex w-full flex-col items-center gap-2" aria-busy={pending}>
      <div className="fam-google">
        {/* Nuestra cara (borde negro y sombra, como los demás botones); el botón de Google va encima,
            casi transparente, y es el que recibe el clic. */}
        <span className="fam-btn fam-btn--block fam-google__face" aria-hidden="true">
          <GoogleLogo />
          Continuar con Google
        </span>
        <div className="fam-google__hit">
          <GoogleLogin
            ux_mode={standalone ? 'redirect' : 'popup'}
            login_uri={loginUri}
            onSuccess={handleSuccess}
            onError={() =>
              setError('Inicio de sesión cancelado o fallido. Puedes volver a intentarlo.')
            }
            theme="outline"
            size="large"
            shape="rectangular"
            text="continue_with"
            width={googleWidth > 0 ? String(googleWidth) : undefined}
          />
        </div>
      </div>
      {pending && (
        <p role="status" className="text-sm">
          Iniciando sesión…
        </p>
      )}
      {(error || redirectFailed) && (
        <p role="alert" className="text-sm text-[#b91c1c]">
          {error || 'No se ha podido iniciar sesión con Google. Vuelve a intentarlo.'}
        </p>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
