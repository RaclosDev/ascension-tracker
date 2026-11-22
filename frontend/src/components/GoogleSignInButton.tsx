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
      <div className="flex h-10 w-full min-w-0 justify-center overflow-hidden">
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
