import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/coach/api';
import {
  requestPasswordReset,
  signInWithPassword,
  signInWithPasskey,
  startSignUp,
} from '../../auth/accountAccess';
import { isPasskeyCancel, passkeysSupported } from '../../utils/webauthn';
import { markPasskeyPromptAnswered } from '../../utils/passkeyPrompt';

export type AccessMode = 'login' | 'register';
type Mode = AccessMode;
type Step = 'form' | 'forgot' | 'forgot-sent';

const field = 'fam-input';
const primary = 'fam-btn fam-btn--ink fam-btn--block';
const secondary = 'fam-btn fam-btn--block';
const linkButton = 'fam-textlink self-start text-[0.85rem]';

/**
 * Access card body in the order the three paper-and-ink apps share: Google (`alternatives`),
 * then email and password, then the passkey, and a closing line to switch between signing in and
 * creating an account. `initialMode` opens it on "Crear cuenta" when the visitor came from a
 * sign-up call to action; `onModeChange` lets the page retitle the card.
 */
export default function EmailAccess({
  alternatives,
  initialMode = 'login',
  onModeChange,
}: {
  alternatives?: ReactNode;
  initialMode?: AccessMode;
  onModeChange?: (mode: AccessMode) => void;
}) {
  const { login } = useAuth();
  const ids = useId();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  const run = async (action: () => Promise<void>, fallback: string) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      if (!isPasskeyCancel(err)) setError(apiErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Escribe tu email y tu contraseña.');
      return;
    }
    if (registering) {
      void run(async () => {
        await login(await startSignUp(email.trim(), password));
      }, 'No se ha podido crear la cuenta. Inténtalo de nuevo.');
    } else {
      void run(
        async () => login(await signInWithPassword(email.trim(), password)),
        'No se ha podido iniciar sesión. Inténtalo de nuevo.',
      );
    }
  };

  const forgot = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await requestPasswordReset(email.trim());
      setStep('forgot-sent');
    }, 'No se ha podido enviar el enlace.');
  };

  const passkey = () =>
    void run(async () => {
      const token = await signInWithPasskey();
      // This device already holds a passkey: no need to offer one after signing in.
      markPasskeyPromptAnswered(tokenEmail(token));
      await login(token);
    }, 'No se ha podido entrar con la llave de acceso.');

  const switchTo = (next: Mode | Step) => {
    setError('');
    if (next === 'login' || next === 'register') {
      setMode(next);
      setStep('form');
      onModeChange?.(next);
    } else {
      setStep(next);
    }
  };

  const alert = error && (
    <p role="alert" className="text-sm text-[#b91c1c]">
      {error}
    </p>
  );

  if (step === 'forgot' || step === 'forgot-sent') {
    return (
      <form onSubmit={forgot} className="flex w-full flex-col gap-3" noValidate>
        {step === 'forgot-sent' ? (
          <p role="status" className="text-[0.95rem]">
            Si hay una cuenta con ese email, te hemos enviado un enlace para elegir otra contraseña.
            Caduca en 30 minutos.
          </p>
        ) : (
          <>
            <p className="text-[0.95rem]">
              Escribe tu email y te mandaremos un enlace para elegir una contraseña nueva.
            </p>
            <label htmlFor={`${ids}-forgot`} className="fam-label">
              Email
            </label>
            <input
              id={`${ids}-forgot`}
              className={field}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {alert}
            <button type="submit" className={primary} disabled={busy || !email.trim()}>
              {busy ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </>
        )}
        <button type="button" className={linkButton} onClick={() => switchTo('login')}>
          Volver a iniciar sesión
        </button>
      </form>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {alternatives}
      {alternatives && <p className="fam-divider">o con tu email</p>}
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <label htmlFor={`${ids}-email`} className="fam-label">
          Email
        </label>
        <input
          id={`${ids}-email`}
          className={field}
          type="email"
          autoComplete={registering ? 'email' : 'username webauthn'}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor={`${ids}-password`} className="fam-label">
          Contraseña
        </label>
        <div className="fam-password">
          <input
            id={`${ids}-password`}
            className={field}
            type={showPassword ? 'text' : 'password'}
            autoComplete={registering ? 'new-password' : 'current-password'}
            minLength={registering ? 8 : undefined}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={registering ? `${ids}-hint` : undefined}
          />
          <button
            type="button"
            className="fam-password__toggle"
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {!registering && (
          <button
            type="button"
            className="fam-textlink fam-textlink--sm self-end"
            onClick={() => switchTo('forgot')}
          >
            ¿Has olvidado tu contraseña?
          </button>
        )}
        {registering && (
          <p id={`${ids}-hint`} className="text-[0.8rem] text-[var(--fam-muted)]">
            Mínimo 8 caracteres. Entrarás directamente al crear la cuenta.
          </p>
        )}
        {alert}
        <button
          type="submit"
          className={`${primary} fam-btn--lg mt-1`}
          disabled={busy}
        >
          {busy ? 'Un momento…' : registering ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
      {!registering && passkeysSupported() && (
        <button type="button" className={secondary} disabled={busy} onClick={passkey}>
          <KeyRound size={16} aria-hidden="true" />
          Entrar con huella o llave de acceso
        </button>
      )}
      <p className="fam-card__switch">
        {registering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
        <button
          type="button"
          className="fam-textlink"
          onClick={() => switchTo(registering ? 'login' : 'register')}
        >
          {registering ? 'Inicia sesión' : 'Crea una gratis'}
        </button>
      </p>
    </div>
  );
}

function tokenEmail(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      email?: unknown;
    };
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}
