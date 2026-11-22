import { useEffect, useRef, useState } from 'react';

const START = '/demo/dashboard';
const POSTER = '/landing/dashboard';
const DESKTOP = '(min-width: 1024px)';

// The real /demo, in a phone body, beside the hero copy. Until the app has loaded (and on phones and tablets,
// always) the phone shows a still of the same screen; on a computer the app loads behind it and fades in once it
// has painted. On phones the still opens the demo: there it already is phone-sized at full screen.
export default function LandingLiveDemo() {
  const timer = useRef(0);
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Once the landing has loaded and the browser is idle, the demo starts loading behind the still, so the page
  // itself is never kept waiting by it.
  useEffect(() => {
    if (!desktop || started) return;
    let idle = 0;
    let t = 0;
    const start = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idle = window.requestIdleCallback(() => setStarted(true), { timeout: 3000 });
      } else {
        t = window.setTimeout(() => setStarted(true), 1500);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(t);
    };
  }, [desktop, started]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Show the app once it has drawn its own screen, not the blank page or the loading spinner before it.
  const waitForApp = (frame: HTMLIFrameElement, since = Date.now()) => {
    const painted = frame.contentDocument?.querySelector('.main-content');
    if (painted) {
      timer.current = window.setTimeout(() => setReady(true), 200);
      return;
    }
    // If it never paints (blocked or failed), the still stays: better than the browser's error page.
    if (Date.now() - since > 12000) return;
    timer.current = window.setTimeout(() => waitForApp(frame, since), 120);
  };

  const live = desktop && started;

  return (
    <figure className="landing-live-wrap">
      <div className="landing-phone landing-live">
        <div className="landing-live__screen">
          <img
            src={`${POSTER}-520.webp`}
            srcSet={`${POSTER}-520.webp 520w, ${POSTER}.webp 860w`}
            sizes="390px"
            alt={
              live
                ? ''
                : 'Panel principal de la demo con el peso de hoy, el total perdido y la fecha estimada'
            }
            width="860"
            height="1864"
            fetchPriority="high"
            className="landing-live__poster"
          />
          {!desktop && (
            // On phones the still itself opens the demo; «Probar la demo» beside it is the accessible way in.
            <a href={START} className="absolute inset-0" tabIndex={-1} aria-hidden="true" />
          )}
          {live && (
            <iframe
              src={START}
              title="Demo de Ascension"
              className={`landing-live__frame${ready ? ' is-ready' : ''}`}
              onLoad={(e) => waitForApp(e.currentTarget)}
            />
          )}
        </div>
      </div>
    </figure>
  );
}
