import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, MoreVertical, Trash2 } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface Props {
  index: number;
  total: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

export function ExerciseActionsMenu({ index, total, onMove, onRemove }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = () => {
    setRect(null);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!rect) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
    const outside = (event: MouseEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      )
        setRect(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setRect(null);
        buttonRef.current?.focus();
      }
    };
    const reposition = () => setRect(null);
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [rect]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Opciones del ejercicio"
        aria-expanded={!!rect}
        aria-controls={rect ? menuId : undefined}
        className="exercise-card-action-btn"
        title="Opciones del ejercicio"
        onClick={(event) => {
          event.stopPropagation();
          haptics.light();
          setRect(rect ? null : (buttonRef.current?.getBoundingClientRect() ?? null));
        }}
      >
        <MoreVertical size={18} />
      </button>
      {rect &&
        createPortal(
          <div
            id={menuId}
            ref={menuRef}
            role="group"
            aria-label="Opciones del ejercicio"
            className="exercise-card-menu-dropdown fade-in"
            style={{
              position: 'fixed',
              top:
                rect.bottom + 140 > window.innerHeight
                  ? Math.max(10, rect.top - 130)
                  : rect.bottom + 6,
              right: Math.max(12, window.innerWidth - rect.right),
              zIndex: 9999,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              disabled={index === 0}
              aria-label="Subir"
              className="exercise-card-menu-item"
              onClick={() => {
                haptics.light();
                onMove(-1);
                close();
              }}
            >
              <ChevronUp size={16} />
              <span>Mover arriba</span>
            </button>
            <button
              type="button"
              disabled={index === total - 1}
              aria-label="Bajar"
              className="exercise-card-menu-item"
              onClick={() => {
                haptics.light();
                onMove(1);
                close();
              }}
            >
              <ChevronDown size={16} />
              <span>Mover abajo</span>
            </button>
            <button
              type="button"
              aria-label="Quitar ejercicio"
              className="exercise-card-menu-item danger"
              onClick={() => {
                close();
                onRemove();
              }}
            >
              <Trash2 size={16} />
              <span>Quitar ejercicio</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
