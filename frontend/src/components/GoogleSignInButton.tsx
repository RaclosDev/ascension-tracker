import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from './ui/button';
import './GoogleSignInButton.css';

const SIGN_IN_EVENT = 'ascension:google-sign-in';

// Lets any call to action on the page (nav "Entrar", "Empezar ahora") open the Google sign-in
// dialog directly instead of following its #entrar link down to the hero button.
export function requestGoogleSignIn(event?: { preventDefault: () => void }) {
  event?.preventDefault();
  window.dispatchEvent(new Event(SIGN_IN_EVENT));
}

// Google's multicolour "G" mark, as its branding guidelines require for sign-in buttons.
function GoogleLogo() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" width="18" height="18">
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

export default function GoogleSignInButton({
  onCredential,
  className,
}: {
  onCredential: (credential: string) => Promise<void>;
  /** Estilo del botón visible; sin él, el botón de contorno a todo el ancho. */
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
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
  const uxMode = standalone ? 'redirect' : 'popup';

  const handleSuccess = useCallback(
    async ({ credential }: CredentialResponse) => {
      if (!credential) {
        if (!dialog.current?.open) dialog.current?.showModal();
        setError('Google no ha devuelto ninguna credencial.');
        return;
      }
      setError('');
      setPending(true);
      try {
        await onCredential(credential);
        dialog.current?.close();
      } catch {
        if (!dialog.current?.open) dialog.current?.showModal();
        setError('No se ha podido iniciar sesión con Google. Inténtalo de nuevo.');
      } finally {
        setPending(false);
      }
    },
    [onCredential],
  );

  // Opens the dialog with Google's own rendered button. One Tap (`prompt()`) is not used on
  // click: it goes silent for hours after a dismissal, needs FedCM or third-party cookies,
  // and with FedCM it does not report when it is not shown, so the click did nothing.
  const start = useCallback(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  useEffect(() => {
    window.addEventListener(SIGN_IN_EVENT, start);
    return () => window.removeEventListener(SIGN_IN_EVENT, start);
  }, [start]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={className ?? 'w-full'}
        style={{ paddingInline: '1rem' }}
        onClick={start}
      >
        <GoogleLogo />
        Continuar con Google
      </Button>
      {redirectFailed && (
        <p role="alert" className="text-sm text-destructive">
          No se ha podido iniciar sesión con Google. Vuelve a intentarlo.
        </p>
      )}
      <dialog
        ref={dialog}
        className="google-sign-in-dialog"
        aria-labelledby={titleId}
        onClose={() => setError('')}
      >
        <h2 id={titleId}>Iniciar sesión con Google</h2>
        <p>Elige tu cuenta para continuar.</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="google-sign-in-close"
          aria-label="Cerrar"
          onClick={() => dialog.current?.close()}
        >
          <span aria-hidden="true">×</span>
        </Button>
        <div className="flex justify-center" style={{ paddingBlock: '1rem' }} aria-busy={pending}>
          <div hidden={pending}>
            <GoogleLogin
              ux_mode={uxMode}
              login_uri={loginUri}
              onSuccess={handleSuccess}
              onError={() =>
                setError('Inicio de sesión cancelado o fallido. Puedes volver a intentarlo.')
              }
              theme="outline"
              shape="pill"
              text="continue_with"
            />
          </div>
          {pending && <p role="status">Iniciando sesión…</p>}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </dialog>
    </>
  );
}
