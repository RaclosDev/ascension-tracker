import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import '../../styles/info-tip.css';

/**
 * La «i» que guarda una explicación: se abre al pasar el ratón, enfocar o tocar,
 * y se cierra con Escape, al salir o al tocar fuera.
 */
export function InfoTip({
  label,
  children,
  align = 'end',
}: {
  /** Qué explica, para lectores de pantalla («Qué significan las líneas»). */
  label: string;
  children: ReactNode;
  /** Lado por el que se ancla el cartel: «end» lo abre hacia la izquierda. */
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  return (
    <span
      ref={root}
      className="info-tip"
      data-align={align}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="info-tip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <Info size={16} aria-hidden="true" />
      </button>
      {open && (
        <span className="info-tip-pop" role="tooltip" id={id}>
          {children}
        </span>
      )}
    </span>
  );
}
