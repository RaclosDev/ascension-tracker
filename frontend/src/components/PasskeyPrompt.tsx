import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Fingerprint } from 'lucide-react';
import { addPasskeyOnThisDevice, listPasskeys } from '../auth/accountAccess';
import { reauthMessage, type Reauth } from '../auth/reauth';
import { apiErrorMessage } from '../lib/coach/api';
import { markPasskeyPromptAnswered, passkeyPromptAnswered } from '../utils/passkeyPrompt';
import {
  isDuplicatePasskey,
  isPasskeyCancel,
  passkeysSupported,
  platformPasskeyAvailable,
} from '../utils/webauthn';
import ReauthDialog from './ReauthDialog';
import { Button } from './ui/button';

/** Offers, once per account and device, to sign in with the fingerprint next time. */
export function PasskeyPrompt({ email }: { email: string }) {
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let active = true;
    if (!passkeysSupported() || passkeyPromptAnswered(email)) return;
    void Promise.all([platformPasskeyAvailable(), listPasskeys()])
      .then(([available, passkeys]) => {
        if (active && available && passkeys.length === 0) setVisible(true);
      })
      .catch(() => {
        // If the account cannot be checked, avoid offering a duplicate registration.
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

  /** Message to show in the confirmation dialog, or null when it is over (saved, duplicate or cancelled). */
  const activate = async (proof: Reauth): Promise<string | null> => {
    try {
      await addPasskeyOnThisDevice(proof);
      toast.success('Listo: la próxima vez entra con la huella');
      close();
      return null;
    } catch (err) {
      const confirmation = reauthMessage(err);
      if (confirmation) return confirmation;
      if (isDuplicatePasskey(err)) {
        close();
        return null;
      }
      if (isPasskeyCancel(err)) return null;
      return apiErrorMessage(err, 'No se ha podido activar la huella.');
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
        <Button type="button" size="sm" onClick={() => setConfirming(true)}>
          Activar huella
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={close}>
          Ahora no
        </Button>
      </div>
      <ReauthDialog
        open={confirming}
        title="Confirma que eres tú"
        description="Para activar la huella en este dispositivo, confirma tu identidad."
        confirmLabel="Confirmar"
        onConfirm={activate}
        onClose={() => setConfirming(false)}
      />
    </section>
  );
}
