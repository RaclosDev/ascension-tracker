import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../lib/coach/api';
import { resetPassword } from '../auth/accountAccess';
import '../components/landing/landing.css';

/** Reads the token from the fragment, so it never reaches server logs or the Referer header. */
function tokenFromLocation(): string {
  return new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
}

/** Page the reset email links to: choose a new password and sign in with it. */
export default function ResetPasswordPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const ids = useId();
  const [token] = useState(tokenFromLocation);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== repeat) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const session = await resetPassword(token, password);
      // Drop the token from the address bar and history before entering the app.
      window.history.replaceState(null, '', window.location.pathname);
      await login(session);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'No se ha podido cambiar la contraseña.'));
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full min-h-11 rounded-[4px] border-2 border-[var(--landing-ink)] bg-[var(--paper)] px-3 text-base';

  return (
    <div className="landing">
      <main className="mx-auto flex max-w-sm flex-col gap-4 px-5 py-16">
        <h1 className="landing-display text-[2rem] font-bold">Nueva contraseña</h1>
        {!token ? (
          <p role="alert">
            El enlace no es válido o ha caducado.{' '}
            <Link to="/login" className="font-bold underline">
              Pide otro desde la pantalla de acceso
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
            <p className="text-[0.95rem] text-[var(--landing-muted)]">
              Al cambiarla se cierran las demás sesiones y se borran tus llaves de acceso.
            </p>
            <label htmlFor={`${ids}-new`} className="text-sm font-bold">
              Contraseña nueva
            </label>
            <input
              id={`${ids}-new`}
              className={field}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor={`${ids}-repeat`} className="text-sm font-bold">
              Repítela
            </label>
            <input
              id={`${ids}-repeat`}
              className={field}
              type="password"
              autoComplete="new-password"
              required
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm text-[#b91c1c]">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="landing-google-cta w-full"
              disabled={busy || !password || !repeat}
            >
              {busy ? 'Guardando…' : 'Guardar y entrar'}
            </button>
            <Link to="/login" className="min-h-11 text-center text-[0.85rem] font-bold underline">
              Volver
            </Link>
          </form>
        )}
      </main>
    </div>
  );
}
