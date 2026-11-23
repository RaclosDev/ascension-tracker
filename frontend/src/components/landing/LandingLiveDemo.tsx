import { useEffect, useRef, useState } from 'react';

const START = '/demo/dashboard';
const POSTER = '/landing/dashboard';
const DESKTOP = '(min-width: 1024px)';

// Real width in points of an iPhone 17 screen (402 x 874): the app renders at that size and is scaled down.
const IPHONE_W = 402;

// The real /demo, in a phone body, beside the hero copy. On a computer the app loads straight away, with no still
// in front that would later be swapped for it. On phones and tablets the phone shows a still of the same screen
// that opens the demo: there it already is phone-sized at full screen.
export default function LandingLiveDemo() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const screen = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = screen.current;
    if (!el || !desktop) return;
    const fit = () => el.style.setProperty('--live-scale', String(el.clientWidth / IPHONE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [desktop]);

  return (
    <figure className="landing-live-wrap">
      <div className="landing-phone landing-live">
        <div ref={screen} className="landing-live__screen">
          {desktop ? (
            <iframe src={START} title="Demo de Ascension" className="landing-live__frame" />
          ) : (
            <>
              <img
                src={`${POSTER}-520.webp`}
                srcSet={`${POSTER}-520.webp 520w, ${POSTER}.webp 860w`}
                sizes="390px"
                alt="Panel principal de la demo con el peso de hoy, el total perdido y la fecha estimada"
                width="860"
                height="1864"
                fetchPriority="high"
                className="landing-live__poster"
              />
              {/* On phones the still itself opens the demo; «Probar la demo» beside it is the accessible way in. */}
              <a href={START} className="absolute inset-0" tabIndex={-1} aria-hidden="true" />
            </>
          )}
        </div>
      </div>
    </figure>
  );
}
