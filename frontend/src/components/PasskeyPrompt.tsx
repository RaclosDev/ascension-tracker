import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Fingerprint } from 'lucide-react';
import { addPasskeyOnThisDevice } from '../auth/accountAccess';
import { apiErrorMessage } from '../lib/coach/api';
import { markPasskeyPromptAnswered, passkeyPromptAnswered } from '../utils/passkeyPrompt';
import {
  isDuplicatePasskey,
  isPasskeyCancel,
  passkeysSupported,
  platformPasskeyAvailable,
} from '../utils/webauthn';
import { Button } from './ui/button';

/** Offers, once per account and device, to sign in with the fingerprint next time. */
export function PasskeyPrompt({ email }: { email: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!passkeysSupported() || passkeyPromptAnswered(email)) return;
    void platformPasskeyAvailable().then((available) => {
      if (active && available) setVisible(true);
    });
    return () => {
      active = false;
    };
  }, [email]);

  if (!visible) return null;

  const close = () => {
    markPasskeyPromptAnswered(email);
    setVisible(false);
  };

  const activate = async () => {
    setBusy(true);
    try {
      await addPasskeyOnThisDevice();
      toast.success('Listo: la próxima vez entra con la huella');
      close();
    } catch (err) {
      if (isDuplicatePasskey(err)) {
        close();
      } else if (!isPasskeyCancel(err)) {
        toast.error(apiErrorMessage(err, 'No se ha podido activar la huella.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="passkey-prompt-title"
      className="passkey-strip mb-4 flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <Fingerprint size={20} className="shrink-0" aria-hidden="true" />
      <p id="passkey-prompt-title" className="m-0 min-w-0 flex-1 basis-56 text-sm font-semibold">
        ¿Entrar con la huella la próxima vez?{' '}
        <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>
          Sin contraseña en este dispositivo.
        </span>
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => void activate()}>
          {busy ? 'Esperando…' : 'Activar huella'}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={close}>
          Ahora no
        </Button>
      </div>
    </section>
  );
}
