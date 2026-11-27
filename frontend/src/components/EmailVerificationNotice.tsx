import { useState } from 'react';
import toast from 'react-hot-toast';
import { MailWarning } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dismissEmailNotice, getEmailStatus, resendVerificationEmail } from '../auth/accountAccess';
import { apiErrorMessage } from '../lib/coach/api';
import { DEMO } from '../demo/mode';
import { Button } from './ui/button';

/**
 * Tells the account when its email is not verified yet (it cannot link a coach or get push notifications
 * until then) and, once, when the real owner of the address took the account over.
 */
export function EmailVerificationNotice() {
  const { data } = useQuery({
    queryKey: ['account', 'email'],
    queryFn: getEmailStatus,
    enabled: !DEMO,
    retry: false,
    staleTime: 60_000,
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const notice = !dismissed && data?.notice ? data.notice : null;
  const unverified = data?.verified === false;
  if (!notice && !unverified) return null;

  const resend = async () => {
    setBusy(true);
    try {
      await resendVerificationEmail();
      setSent(true);
      toast.success('Enlace enviado: revisa tu correo.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se ha podido enviar el enlace.'));
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    setDismissed(true);
    try {
      await dismissEmailNotice();
    } catch {
      // It reappears on the next visit; nothing else depends on it.
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-3">
      {notice && (
        <section
          role="status"
          className="passkey-strip flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <MailWarning size={20} className="shrink-0" aria-hidden="true" />
          <p className="m-0 min-w-0 flex-1 basis-56 text-sm font-semibold">{notice}</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => void dismiss()}>
            Entendido
          </Button>
        </section>
      )}
      {unverified && (
        <section
          role="status"
          aria-label="Email sin verificar"
          className="passkey-strip flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <MailWarning size={20} className="shrink-0" aria-hidden="true" />
          <p className="m-0 min-w-0 flex-1 basis-56 text-sm font-semibold">
            Verifica tu email.{' '}
            <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>
              Hasta entonces no puedes vincular un entrenador ni recibir avisos. Te enviamos un
              enlace al registrarte.
            </span>
          </p>
          <Button type="button" size="sm" disabled={busy || sent} onClick={() => void resend()}>
            {sent ? 'Enlace enviado' : busy ? 'Enviando…' : 'Reenviar enlace'}
          </Button>
        </section>
      )}
    </div>
  );
}
