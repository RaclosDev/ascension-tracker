import { useEffect, useRef, useState } from 'react';

const START = '/demo/dashboard';
const POSTER = '/landing/dashboard';
const DESKTOP = '(min-width: 1024px)';

// The real /demo, in a phone body, under the features. Until it is near the screen (and on phones and tablets,
// always) the phone shows a still of the same screen; on a computer the app loads behind it and fades in once it
// has painted. Phones get a button instead: there the demo already is phone-sized at full screen.
export default function LandingLiveDemo() {
  const phone = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP).matches);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = phone.current;
    if (!desktop || near || !el) return;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [desktop, near]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Show the app once it has drawn its own screen, not the blank page or the loading spinner before it.
  const waitForApp = (frame: HTMLIFrameElement, since = Date.now()) => {
    const painted = frame.contentDocument?.querySelector('.main-content');
    if (painted || Date.now() - since > 6000) {
      timer.current = window.setTimeout(() => setReady(true), 200);
      return;
    }
    timer.current = window.setTimeout(() => waitForApp(frame, since), 120);
  };

  const live = desktop && near;

  return (
    <section
      id="demo-en-vivo"
      className="fam-container mt-20 grid items-center gap-10 lg:mt-28 lg:grid-cols-12"
      aria-labelledby="live-demo-title"
    >
      <div className="lg:col-span-6 xl:col-span-5">
        <h2 id="live-demo-title" className="fam-h2 max-w-[16ch]">
          La app entera, para tocarla
        </h2>
        <p className="mt-4 max-w-[46ch] text-[var(--landing-muted)]">
          Es la demo de verdad, con datos ficticios. Abre un entreno, apunta una comida o mira cómo
          va el peso. Nada de lo que cambies se guarda.
        </p>
        <p className="mt-6">
          <a href={START} className="fam-btn">
            {desktop ? 'Abrir a pantalla completa' : 'Abrir la demo'}
          </a>
        </p>
      </div>

      <div className="flex justify-center lg:col-span-6 xl:col-span-7">
        <div ref={phone} className="landing-phone landing-live">
          <div className="landing-live__screen">
            <img
              src={`${POSTER}-520.webp`}
              srcSet={`${POSTER}-520.webp 520w, ${POSTER}.webp 860w`}
              sizes="390px"
              alt={live ? '' : 'Panel principal de la demo con el peso de hoy, el total perdido y la fecha estimada'}
              width="860"
              height="1864"
              loading="lazy"
              className="landing-live__poster"
            />
            {!desktop && (
              // On phones the still itself opens the demo too; the button above is the accessible way in.
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
      </div>
    </section>
  );
}
