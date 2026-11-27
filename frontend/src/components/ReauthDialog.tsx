import { useEffect, useState, type FormEvent } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { Reauth } from '../auth/reauth';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

/**
 * Asks to confirm the identity again before a sensitive action. It accepts the password or, for
 * accounts that only sign in with Google, a fresh Google credential. The password lives in this
 * state only while it is typed: it is cleared on submit and on close, and it is never stored.
 *
 * `onConfirm` resolves to the error message to show here (the dialog stays open) or to null when
 * it is done and the dialog can close.
 */
export default function ReauthDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (proof: Reauth) => Promise<string | null>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  const submit = async (proof: Reauth) => {
    setBusy(true);
    setError('');
    try {
      const message = await onConfirm(proof);
      if (message) setError(message);
      else onClose();
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password && !busy) void submit({ password });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="reauth-password" className="text-sm font-bold">
            Contraseña
          </label>
          <input
            id="reauth-password"
            className="form-input min-h-11"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
          />
          {error && (
            <p role="alert" className="text-sm text-[#b91c1c]">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || password === ''}>
              {busy ? 'Un momento…' : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
        <div
          className="flex flex-col items-center gap-2 pt-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ¿Tu cuenta entra solo con Google? Confírmalo con tu cuenta de Google.
          </p>
          <GoogleLogin
            onSuccess={({ credential }) => {
              if (credential) void submit({ googleCredential: credential });
              else setError('Google no ha devuelto ninguna credencial.');
            }}
            onError={() => setError('Confirmación con Google cancelada o fallida.')}
            theme="outline"
            size="large"
            shape="rectangular"
            text="continue_with"
            width="280"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
