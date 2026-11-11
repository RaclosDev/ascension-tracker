import { useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useCoachFilters() {
  const [params, setParams] = useSearchParams();
  const pending = useRef(params);
  useLayoutEffect(() => {
    pending.current = params;
  }, [params]);

  const update = (key: string, value: string) => {
    // Router setters do not queue updates: keep edits made before navigation commits.
    const next = new URLSearchParams(pending.current);
    if (value) next.set(key, value);
    else next.delete(key);
    pending.current = next;
    setParams(next, { replace: true });
  };

  const clear = () => {
    pending.current = new URLSearchParams();
    setParams(pending.current, { replace: true });
  };

  return { params, update, clear };
}
