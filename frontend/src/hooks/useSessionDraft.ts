import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { readDraft, removeDraft, writeDraft } from '../lib/sessionDrafts';

export function useSessionDraft<T>(
  scope: string,
  initial: T,
  validate: (value: unknown) => value is T,
) {
  const { user } = useAuth();
  const key = `${user?.email ?? 'anonymous'}:${scope}`;
  const restore = () => {
    const restored = user ? readDraft(key, validate) : null;
    return {
      key,
      value: restored?.value ?? initial,
      dirty: restored !== null,
      persisted: restored?.persisted ?? true,
    };
  };
  const [state, setState] = useState(restore);
  // Reset before rendering a different account or record, even if its form stays mounted.
  if (state.key !== key) setState(restore());
  useEffect(() => {
    if (!state.dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.dirty]);

  const setValue = (value: T) => {
    const persisted = user ? writeDraft(key, value) : false;
    setState({ key, value, dirty: true, persisted });
  };
  const clear = () => {
    removeDraft(key);
    setState({ key, value: initial, dirty: false, persisted: true });
  };
  return {
    value: state.dirty ? state.value : initial,
    setValue,
    clear,
    dirty: state.dirty,
    notice: state.dirty
      ? state.persisted
        ? 'Borrador guardado en esta pestaña. Puedes salir y volver antes de cerrarla.'
        : 'Borrador conservado mientras la app siga abierta. No cierres ni recargues la pestaña.'
      : null,
  };
}
