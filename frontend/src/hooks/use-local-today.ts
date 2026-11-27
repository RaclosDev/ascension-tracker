import { useEffect, useState } from 'react';
import { getLocalDateString } from '../utils/dateHelper';

const msUntilMidnight = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

/**
 * The device's calendar day, kept up to date: a screen left open past midnight re-renders with the new
 * day, so what the user logs or weighs goes into the day they are living, not the one the page opened on.
 * Timers are throttled or frozen while the tab sleeps, so it also re-checks when the tab comes back.
 */
export function useLocalToday(): string {
  const [today, setToday] = useState(() => getLocalDateString());

  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => {
      setToday(getLocalDateString());
      window.clearTimeout(timer);
      // +1 s so the timer never fires just before the clock rolls over.
      timer = window.setTimeout(refresh, msUntilMidnight() + 1000);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return today;
}
