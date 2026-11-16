import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  disablePushNotifications,
  enablePushNotifications,
  pushNotificationsPaused,
} from '../../lib/workout/notifications';

type State = 'unsupported' | 'off' | 'on' | 'blocked' | 'checking' | 'error';

const currentState = (): State => {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator)
  )
    return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' && !pushNotificationsPaused() ? 'checking' : 'off';
};

export function PushToggle({ text, unsupportedText }: { text: string; unsupportedText?: string }) {
  const [state, setState] = useState<State>(currentState);
  const [busy, setBusy] = useState(false);
  const [disableError, setDisableError] = useState(false);

  useEffect(() => {
    let active = true;
    if (currentState() === 'checking') {
      void enablePushNotifications()
        .then((registered) => {
          if (active) setState(registered ? 'on' : 'error');
        })
        .catch(() => {
          if (active) setState('error');
        });
    }
    return () => {
      active = false;
    };
  }, []);

  async function update() {
    if (busy) return;
    setBusy(true);
    setDisableError(false);
    try {
      if (state === 'on') {
        await disablePushNotifications();
        setState('off');
      } else {
        const registered = await enablePushNotifications();
        setState(registered ? 'on' : Notification.permission === 'denied' ? 'blocked' : 'error');
      }
    } catch {
      if (state === 'on') setDisableError(true);
      else setState('error');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'unsupported') {
    return unsupportedText ? <p className="coach-description">{unsupportedText}</p> : null;
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span role="status" style={{ color: 'var(--text-secondary)' }}>
          {state === 'on' && 'Avisos activados en este dispositivo.'}
          {state === 'off' && text}
          {state === 'checking' && 'Comprobando avisos de este dispositivo…'}
          {state === 'error' &&
            'No se han podido activar los avisos. Comprueba la conexión y vuelve a intentarlo.'}
          {state === 'blocked' &&
            'Los avisos están bloqueados. Actívalos en los ajustes del navegador y recarga esta página.'}
        </span>
        {['off', 'on', 'error'].includes(state) && (
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
            disabled={busy}
            onClick={() => void update()}
          >
            <Bell size={16} aria-hidden />
            {busy
              ? 'Guardando…'
              : state === 'on'
                ? 'Desactivar en este dispositivo'
                : state === 'error'
                  ? 'Reintentar activación'
                  : 'Activar avisos'}
          </button>
        )}
      </div>
      <p className="coach-description">
        Esta opción afecta a los avisos de seguimientos y descansos en este navegador. Los demás
        dispositivos conservan sus avisos.
      </p>
      {disableError && (
        <p role="alert">No se han podido desactivar los avisos. Vuelve a intentarlo.</p>
      )}
    </div>
  );
}
