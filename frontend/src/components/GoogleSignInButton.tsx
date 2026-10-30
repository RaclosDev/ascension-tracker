import { useId, useRef, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from './ui/button';
import './GoogleSignInButton.css';

export default function GoogleSignInButton({
  onCredential,
}: {
  onCredential: (credential: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const handleSuccess = async ({ credential }: CredentialResponse) => {
    if (!credential) {
      setError('Google no ha devuelto ninguna credencial.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await onCredential(credential);
      dialog.current?.close();
    } catch {
      setError('No se ha podido iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        style={{ paddingInline: '1rem' }}
        onClick={() => dialog.current?.showModal()}
      >
        Continuar con Google
      </Button>
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
