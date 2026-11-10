import { useId, useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/coach/api';
import {
  confirmSignUp,
  requestPasswordReset,
  signInWithPassword,
  signInWithPasskey,
  startSignUp,
} from '../../auth/accountAccess';
import { isPasskeyCancel, passkeysSupported } from '../../utils/webauthn';
import { markPasskeyPromptAnswered } from '../../utils/passkeyPrompt';

type Mode = 'login' | 'register';
type Step = 'form' | 'code' | 'forgot' | 'forgot-sent';

const field =
  'landing-field w-full min-h-11 rounded-[4px] border-2 border-[var(--landing-ink)] bg-[var(--paper)] px-3 text-base text-[var(--landing-ink)]';
const primary = 'landing-google-cta w-full';
const linkButton =
  'min-h-11 bg-transparent p-0 text-[0.85rem] font-bold text-[var(--landing-ink)] underline';

/**
 * Sign-in and sign-up with email, the code that confirms a new account, the forgotten-password
 * link and the passkey button. Errors never tell whether an email has an account.
 */
export default function EmailAccess() {
  const { login } = useAuth();
  const ids = useId();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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
    if (registering) {
      void run(async () => {
        await startSignUp(email.trim(), password);
        setCode('');
        setStep('code');
      }, 'No se ha podido crear la cuenta. Inténtalo de nuevo.');
    } else {
      void run(
        async () => login(await signInWithPassword(email.trim(), password)),
        'No se ha podido iniciar sesión. Inténtalo de nuevo.',
      );
    }
  };

  const confirm = (event: FormEvent) => {
    event.preventDefault();
    void run(
      async () => login(await confirmSignUp(email.trim(), code.trim(), password)),
      'No se ha podido confirmar el código.',
    );
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
    } else {
      setStep(next);
    }
  };

  const alert = error && (
    <p role="alert" className="text-sm text-[#b91c1c]">
      {error}
    </p>
  );

  if (step === 'code') {
    return (
      <form onSubmit={confirm} className="flex w-full max-w-sm flex-col gap-3" noValidate>
        <p className="text-[0.95rem]">
          Te hemos enviado un código de 6 cifras a <strong>{email.trim()}</strong>. Escríbelo para
          crear la cuenta. Revisa también la carpeta de spam.
        </p>
        <label htmlFor={`${ids}-code`} className="text-sm font-bold">
          Código
        </label>
        <input
          id={`${ids}-code`}
          className={`${field} tracking-[0.4em]`}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        {alert}
        <button type="submit" className={primary} disabled={busy || code.length !== 6}>
          {busy ? 'Comprobando…' : 'Crear cuenta'}
        </button>
        <button type="button" className={linkButton} onClick={() => switchTo('form')}>
          Cambiar el email o pedir otro código
        </button>
      </form>
    );
  }

  if (step === 'forgot' || step === 'forgot-sent') {
    return (
      <form onSubmit={forgot} className="flex w-full max-w-sm flex-col gap-3" noValidate>
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
            <label htmlFor={`${ids}-forgot`} className="text-sm font-bold">
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
    <div className="flex w-full max-w-sm flex-col gap-3">
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <label htmlFor={`${ids}-email`} className="text-sm font-bold">
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
        <label htmlFor={`${ids}-password`} className="text-sm font-bold">
          Contraseña
        </label>
        <input
          id={`${ids}-password`}
          className={field}
          type="password"
          autoComplete={registering ? 'new-password' : 'current-password'}
          minLength={registering ? 8 : undefined}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={registering ? `${ids}-hint` : undefined}
        />
        {registering && (
          <p id={`${ids}-hint`} className="text-[0.8rem] text-[var(--landing-muted)]">
            Mínimo 8 caracteres. Mejor una frase que solo tú recuerdes.
          </p>
        )}
        {alert}
        <button type="submit" className={primary} disabled={busy || !email.trim() || !password}>
          {busy ? 'Un momento…' : registering ? 'Crear cuenta' : 'Entrar con email'}
        </button>
      </form>
      {!registering && (
        <button type="button" className={linkButton} onClick={() => switchTo('forgot')}>
          ¿Has olvidado la contraseña?
        </button>
      )}
      {!registering && passkeysSupported() && (
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 rounded-[4px] border-2 border-[var(--landing-ink)] px-4 text-[0.9rem] font-bold"
          disabled={busy}
          onClick={passkey}
        >
          <KeyRound size={16} aria-hidden="true" />
          Entrar con huella o llave de acceso
        </button>
      )}
      <p className="text-[0.85rem]">
        {registering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
        <button
          type="button"
          className={linkButton}
          onClick={() => switchTo(registering ? 'login' : 'register')}
        >
          {registering ? 'Inicia sesión' : 'Créala con tu email'}
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
