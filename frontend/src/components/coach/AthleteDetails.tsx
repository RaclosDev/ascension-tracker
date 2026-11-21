import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CoachClient } from '../../lib/coach/api';

type Place = { top: number; left: number; width: number };

/** Where the card goes: beside the rail on a wide screen, under the trigger otherwise. */
function placeNear(trigger: HTMLElement): Place {
  const rail = trigger.closest('.athlete-rail')?.getBoundingClientRect();
  const box = trigger.getBoundingClientRect();
  const width = Math.min(360, window.innerWidth - 16);
  if (rail && window.innerWidth >= 1024)
    return { top: Math.max(8, box.top - 8), left: rail.right + 8, width };
  return {
    top: box.bottom + 6,
    left: Math.max(8, Math.min(box.left, window.innerWidth - width - 8)),
    width,
  };
}

/** Floating card with the athlete's goal, equipment and pinned note in full. */
export function useAthleteDetails() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return {
    open: anchor != null,
    toggle: (trigger: HTMLElement) => setAnchor((current) => (current ? null : trigger)),
    close: () => setAnchor(null),
    anchor,
  };
}

export function AthleteDetails({
  link,
  anchor,
  onClose,
}: {
  link: CoachClient;
  anchor: HTMLElement;
  onClose: () => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place>(() => placeNear(anchor));
  useLayoutEffect(() => setPlace(placeNear(anchor)), [anchor]);

  useEffect(() => {
    const away = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!card.current?.contains(target) && !anchor.contains(target)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onClose();
      anchor.focus();
    };
    const move = () => setPlace(placeNear(anchor));
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', move);
    window.addEventListener('scroll', move, true);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', move);
      window.removeEventListener('scroll', move, true);
    };
  }, [anchor, onClose]);

  const rows = [
    { label: 'Objetivo', text: link.setup?.goal },
    { label: 'Material', text: link.setup?.equipment },
    { label: 'Nota fijada', text: link.notes?.pinnedNote },
  ].filter((row) => row.text);

  // Portalled: the rail clips its overflow, and the card has to sit over the work beside it.
  return createPortal(
    <div
      ref={card}
      id="athlete-details"
      className="athlete-details"
      role="dialog"
      aria-label="Ficha del atleta completa"
      style={{ top: place.top, left: place.left, width: place.width }}
    >
      <button
        type="button"
        className="athlete-details-close"
        aria-label="Cerrar"
        onClick={() => {
          onClose();
          anchor.focus();
        }}
      >
        <X size={14} aria-hidden />
      </button>
      <dl>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.text}</dd>
          </div>
        ))}
      </dl>
    </div>,
    document.body,
  );
}
