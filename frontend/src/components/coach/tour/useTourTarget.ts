import { useEffect, useState, type RefObject } from 'react';
import type { CoachTourStep } from './steps';

export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function visibleTarget(doc: Document, selector: string) {
  return [...doc.querySelectorAll<HTMLElement>(selector)].find((element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      doc.defaultView?.getComputedStyle(element).visibility !== 'hidden'
    );
  });
}

export function useTourTarget(
  frame: RefObject<HTMLIFrameElement | null>,
  step: CoachTourStep,
  epoch: number,
) {
  const [view, setView] = useState<{ step: string; rect: TourRect | null; error: boolean }>({
    step: '',
    rect: null,
    error: false,
  });
  useEffect(() => {
    const started = Date.now();
    const clicked = new Set<string>();
    let scrolled: Element | undefined;
    let lastNavigate = 0;
    function measure() {
      const iframe = frame.current;
      const doc = iframe?.contentDocument;
      const child = iframe?.contentWindow;
      if (Date.now() - started > 15000 && !scrolled) {
        setView({ step: step.id, rect: null, error: true });
        return;
      }
      if (!iframe || !doc || !child) return;
      if (child.location.pathname + child.location.search !== step.path) {
        if (Date.now() - lastNavigate > 500) {
          child.postMessage(
            { type: 'coach-tour:navigate', path: step.path },
            window.location.origin,
          );
          lastNavigate = Date.now();
        }
        return;
      }
      const reveal = (selector: string) => {
        const element = doc.querySelector(selector);
        let parent = element?.parentElement;
        while (parent) {
          if (parent.tagName === 'DETAILS') parent.setAttribute('open', '');
          parent = parent.parentElement;
        }
      };
      reveal(step.target);
      for (const action of step.prepare ?? []) {
        reveal(action.click);
        if (visibleTarget(doc, action.until)) continue;
        const control = visibleTarget(doc, action.click);
        if (control && !control.matches(':disabled') && !clicked.has(action.click)) {
          clicked.add(action.click);
          control.click();
        }
        return;
      }
      const target = visibleTarget(doc, step.target);
      if (!target) {
        if (step.target.includes('data-tour-nav')) {
          visibleTarget(doc, '[aria-label="Más opciones"][aria-expanded="false"]')?.click();
        }
        return;
      }
      if (scrolled !== target) {
        target.scrollIntoView({
          block: window.innerWidth < 640 ? 'start' : 'center',
          inline: 'center',
          behavior: 'instant',
        });
        scrolled = target;
      }
      const bounds = target.getBoundingClientRect();
      const outer = iframe.getBoundingClientRect();
      const top = Math.max(outer.top + 6, bounds.top + outer.top - 6);
      const left = Math.max(outer.left + 6, bounds.left + outer.left - 6);
      const height = Math.min(bounds.bottom + outer.top + 6, outer.bottom - 6) - top;
      const rect = {
        top,
        left,
        width: Math.min(bounds.width + 12, outer.right - left - 6),
        height: window.innerWidth < 640 ? Math.min(height, outer.height * 0.4) : height,
      };
      setView((previous) =>
        previous.step === step.id && JSON.stringify(previous.rect) === JSON.stringify(rect)
          ? previous
          : { step: step.id, rect, error: false },
      );
    }
    const interval = window.setInterval(measure, 120);
    measure();
    return () => window.clearInterval(interval);
  }, [frame, step, epoch]);
  return view.step === step.id ? view : { rect: null, error: false };
}
