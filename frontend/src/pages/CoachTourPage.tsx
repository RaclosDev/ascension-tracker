import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { COACH_TOUR_STEPS } from '../components/coach/tour/steps';
import { readTourProgress, saveTourProgress } from '../components/coach/tour/progress';
import { demonstrate, initialDemo, type CoachDemo } from '../components/coach/tour/demo';
import { CoachTourScene } from '../components/coach/tour/CoachTourScene';
import '../styles/coach-tour.css';

export default function CoachTourPage() {
  const { user } = useAuth();
  return <CoachWorkspace>{user && <Tour key={user.email} account={user.email} />}</CoachWorkspace>;
}

function Tour({ account }: { account: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(() =>
    Math.min(readTourProgress(account)?.step ?? 0, COACH_TOUR_STEPS.length - 1),
  );
  const [demo, setDemo] = useState(() =>
    COACH_TOUR_STEPS.slice(0, step).reduce(
      (state, item) => demonstrate(state, item.id),
      initialDemo,
    ),
  );
  const [playing, setPlaying] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = COACH_TOUR_STEPS[step];
  const last = step === COACH_TOUR_STEPS.length - 1;

  useEffect(() => {
    saveTourProgress(account, { status: 'started', step });
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: 'nearest', behavior: 'instant' });
  }, [account, step]);

  useEffect(() => {
    if (!playing) return;
    const act = window.setTimeout(() => setDemo((state) => demonstrate(state, current.id)), 1800);
    const advance = window.setTimeout(() => {
      if (last) setPlaying(false);
      else {
        setDemo((value) => ({ ...value, feedback: '' }));
        setStep((index) => index + 1);
      }
    }, 10000);
    const pauseWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      window.clearTimeout(act);
      window.clearTimeout(advance);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, [playing, current.id, last]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (playing) setPlaying(false);
      else navigate('/entrenador');
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [playing, navigate]);

  function goTo(index: number) {
    setPlaying(false);
    setDemo((value) => ({ ...value, feedback: '' }));
    setStep(index);
  }
  function finish() {
    saveTourProgress(account, { status: 'completed', step: 0 });
    navigate('/entrenador');
  }
  function update(patch: Partial<CoachDemo>) {
    setPlaying(false);
    setDemo((value) => ({ ...value, ...patch }));
  }

  return (
    <>
      <CoachPageHeader
        title="Guía interactiva"
        description="Practica el trabajo de entrenador con una alumna de ejemplo."
      >
        <Link className="btn btn-secondary" to="/entrenador">
          <X size={16} aria-hidden /> Salir de la demo
        </Link>
      </CoachPageHeader>
      <div className="coach-tour-notice">
        <strong>Demo · datos ficticios</strong>
        <span>Los cambios de este recorrido no se envían a ningún alumno.</span>
      </div>
      <div className="coach-tour-layout">
        <aside className="coach-tour-guide" aria-label="Controles de la guía">
          <p className="coach-eyebrow">
            Paso {step + 1} de {COACH_TOUR_STEPS.length} · {current.section}
          </p>
          <progress
            max={COACH_TOUR_STEPS.length}
            value={step + 1}
            aria-label="Progreso de la guía"
          />
          <h2 ref={heading} tabIndex={-1}>
            {current.title}
          </h2>
          <p>{current.body}</p>
          <p className="coach-description">
            Prueba el control resaltado o pulsa Siguiente. En reproducción, la guía muestra las
            acciones por ti.
          </p>
          <div className="coach-tour-controls">
            <button
              className="btn btn-secondary"
              disabled={step === 0}
              onClick={() => goTo(step - 1)}
            >
              Anterior
            </button>
            <button className="btn btn-primary" onClick={() => (last ? finish() : goTo(step + 1))}>
              {last ? 'Terminar guía' : 'Siguiente'}
            </button>
          </div>
          <button
            className="btn btn-secondary"
            aria-pressed={playing}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
            {playing ? 'Pausar recorrido' : 'Reproducir recorrido'}
          </button>
          <label className="coach-tour-jump">
            Ir a un paso
            <select value={step} onChange={(event) => goTo(Number(event.target.value))}>
              {COACH_TOUR_STEPS.map((item, index) => (
                <option key={item.id} value={index}>
                  {index + 1}. {item.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setDemo(initialDemo);
              goTo(0);
            }}
          >
            <RotateCcw size={16} aria-hidden /> Reiniciar demo
          </button>
        </aside>
        <section
          className="coach-tour-scene"
          aria-label={`Demostración: ${current.section}`}
          onFocusCapture={() => setPlaying(false)}
        >
          <div className="coach-tour-scene-label">Vista de ejemplo · {current.section}</div>
          <CoachTourScene
            step={current.id}
            demo={demo}
            update={update}
            act={() => {
              setPlaying(false);
              if (last) finish();
              else setDemo((value) => demonstrate(value, current.id));
            }}
          />
          <p className="coach-tour-feedback" role="status">
            {demo.feedback}
          </p>
        </section>
      </div>
    </>
  );
}
