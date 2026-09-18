import { useEffect, useState } from "react";

export function useNow(enabled = true, interval = 250) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(id);
  }, [enabled, interval]);

  return now;
}
