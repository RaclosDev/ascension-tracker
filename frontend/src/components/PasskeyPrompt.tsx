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
      className="card mb-4 flex flex-col gap-3"
      style={{ padding: 'var(--space-lg)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2">
        <Fingerprint size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
        <h2 id="passkey-prompt-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          ¿Entrar con la huella la próxima vez?
        </h2>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Guarda una llave de acceso en este dispositivo y entra sin contraseña. Puedes quitarla
        cuando quieras desde Ajustes.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void activate()}>
          {busy ? 'Esperando al dispositivo…' : 'Activar huella'}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={close}>
          Ahora no
        </Button>
      </div>
    </section>
  );
}
