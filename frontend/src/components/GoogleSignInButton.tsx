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
