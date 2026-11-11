import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { COACH_TOUR_STEPS } from './steps';
import type { TourRect } from './useTourTarget';

export function tourPopupPosition(
  rect: TourRect | null,
  width: number,
  height: number,
  viewport: { width: number; height: number },
) {
  const margin = 12;
  let left = (viewport.width - width) / 2;
  let top = (viewport.height - height) / 2;
  if (rect) {
    if (rect.left + rect.width + width + margin * 2 <= viewport.width) {
      left = rect.left + rect.width + margin;
      top = rect.top;
    } else if (rect.left >= width + margin * 2) {
      left = rect.left - width - margin;
      top = rect.top;
    } else {
      left = rect.left;
      top =
        rect.top + rect.height + height + margin * 2 <= viewport.height
          ? rect.top + rect.height + margin
          : rect.top - height - margin;
    }
  }
  return {
    left: Math.max(margin, Math.min(left, viewport.width - width - margin)),
    top: Math.max(margin, Math.min(top, viewport.height - height - margin)),
  };
}

interface Props {
  index: number;
  rect: TourRect | null;
  error: boolean;
  go: (index: number) => void;
  close: (completed?: boolean) => void;
  retry: () => void;
}

export default function CoachTourOverlay({ index, rect, error, go, close, retry }: Props) {
  const step = COACH_TOUR_STEPS[index];
  const popup = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [size, setSize] = useState({ width: 360, height: 300 });
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const last = index === COACH_TOUR_STEPS.length - 1;
  const ready = rect !== null;
  const next = () => (last ? close(true) : go(index + 1));
  useLayoutEffect(() => {
    const element = popup.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setSize({ width: element.offsetWidth, height: element.offsetHeight }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [index, ready]);
  return (
    <div
      className="coach-tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-tour-title"
      aria-describedby="coach-tour-body"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
        if (event.key === 'Tab') {
          const controls = [
            ...(popup.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select') ??
              []),
          ];
          const first = controls[0];
          const end = controls.at(-1);
          if (
            event.shiftKey &&
            (document.activeElement === first || document.activeElement === heading.current)
          ) {
            event.preventDefault();
            end?.focus();
          } else if (!event.shiftKey && document.activeElement === end) {
            event.preventDefault();
            first?.focus();
          }
        }
        if ((event.target as HTMLElement).tagName !== 'SELECT') {
          if (event.key === 'ArrowRight' && rect) {
            event.preventDefault();
            next();
          }
          if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            go(index - 1);
          }
        }
      }}
    >
      <div className={`coach-tour-shield${rect ? '' : ' coach-tour-shield--loading'}`} />
      {rect && (
        <button
          className="coach-tour-spotlight"
          style={rect}
          tabIndex={-1}
          aria-label={`Continuar: ${step.title}`}
          onClick={next}
        />
      )}
      <div
        ref={popup}
        className="coach-tour-popover"
        style={tourPopupPosition(rect, size.width, size.height, viewport)}
      >
        <button className="coach-tour-close" aria-label="Cerrar tour" onClick={() => close()}>
          <X size={20} />
        </button>
        <p className="coach-tour-eyebrow">
          Tour · {index + 1}/{COACH_TOUR_STEPS.length} · {step.chapter}
        </p>
        <h1 id="coach-tour-title" ref={heading} tabIndex={-1}>
          {step.title}
        </h1>
        <p id="coach-tour-body">{step.body}</p>
        <p className="coach-tour-example">Pantallas reales · datos de ejemplo</p>
        {!rect && !error && <p role="status">Abriendo esta pantalla…</p>}
        {error && (
          <div role="alert">
            <p>No hemos podido abrir este paso.</p>
            <button className="btn btn-secondary" onClick={retry}>
              Reintentar
            </button>
          </div>
        )}
        <div className="coach-tour-actions">
          <button
            className="btn btn-secondary"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            Anterior
          </button>
          <button className="btn btn-primary" disabled={!rect} onClick={next}>
            {last ? 'Terminar tour' : 'Siguiente'}
          </button>
        </div>
        <label className="coach-tour-jump">
          Ir a un paso
          <select value={index} onChange={(event) => go(Number(event.target.value))}>
            {COACH_TOUR_STEPS.map((item, position) => (
              <option key={item.id} value={position}>
                {position + 1}. {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
