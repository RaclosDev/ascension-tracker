import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export default function GoogleSignInButton({
  onCredential,
}: {
  onCredential: (credential: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch {
      setError('No se ha podido iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setError('');
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" style={{ paddingInline: '1rem' }}>
          Continuar con Google
        </Button>
      </DialogTrigger>
      <DialogContent style={{ padding: '1.5rem' }}>
        <DialogHeader>
          <DialogTitle>Iniciar sesión con Google</DialogTitle>
          <DialogDescription>Elige tu cuenta para continuar.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center" style={{ paddingBlock: '1rem' }} aria-busy={pending}>
          {pending ? (
            <p role="status">Iniciando sesión…</p>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() =>
                setError('Inicio de sesión cancelado o fallido. Puedes volver a intentarlo.')
              }
              theme="outline"
              shape="pill"
              text="continue_with"
            />
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
