import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { enablePushNotifications } from '../../lib/workout/notifications';

type State = 'unsupported' | 'off' | 'on' | 'blocked';

const currentState = (): State => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' ? 'on' : 'off';
};

/** Turns on push notices on this device for check-ins: reminders, new check-ins and replies. */
export function PushToggle({ text, unsupportedText }: { text: string; unsupportedText?: string }) {
  const [state, setState] = useState<State>(currentState);

  // Permission already granted: make sure this device is registered, without asking again.
  useEffect(() => {
    if (currentState() === 'on') void enablePushNotifications();
  }, []);

  if (state === 'unsupported') {
    return unsupportedText ? <p className="coach-description">{unsupportedText}</p> : null;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span style={{ color: 'var(--text-secondary)' }}>
        {state === 'on' && 'Avisos activados en este dispositivo.'}
        {state === 'off' && text}
        {state === 'blocked' &&
          'Los avisos están bloqueados. Actívalos en los ajustes del navegador.'}
      </span>
      {state === 'off' && (
        <button
          type="button"
          className="btn btn-secondary inline-flex items-center gap-1.5 shrink-0"
          onClick={async () => {
            await enablePushNotifications();
            setState(currentState());
          }}
        >
          <Bell size={16} aria-hidden /> Activar avisos
        </button>
      )}
    </div>
  );
}
