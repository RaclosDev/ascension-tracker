import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';

export function useCoachFilters() {
  const [urlParams, setUrlParams] = useSearchParams();
  const [params, setParams] = useState(urlParams);
  const location = useLocation();
  const navigation = useNavigationType();
  const pending = useRef(params);
  const navigating = useRef(new Set<string>());
  useLayoutEffect(() => {
    const query = urlParams.toString();
    // An intermediate URL commit must not overwrite newer edits. POP is always external.
    if (navigation !== 'POP' && navigating.current.has(query)) {
      if (query === pending.current.toString()) navigating.current.clear();
      return;
    }
    navigating.current.clear();
    pending.current = urlParams;
    setParams(urlParams);
  }, [urlParams, location.key, navigation]);

  const commit = (next: URLSearchParams) => {
    pending.current = next;
    navigating.current.add(next.toString());
    // Controlled inputs and destination links cannot wait for the router's transition.
    setParams(next);
    setUrlParams(next, { replace: true });
  };

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(pending.current);
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  };

  const clear = () => {
    commit(new URLSearchParams());
  };

  return { params, update, clear };
}
