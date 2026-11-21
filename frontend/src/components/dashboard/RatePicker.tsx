import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Crosshair, History, Pencil } from 'lucide-react';
import type { RateMode, RatePreference } from '../../hooks/useRatePreference';

const MODE_OPTIONS: { mode: RateMode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    mode: 'history',
    label: 'Historial real',
    icon: <History size={14} />,
    desc: 'Media calculada de todas tus semanas',
  },
  {
    mode: 'goal',
    label: 'Meta semanal',
    icon: <Crosshair size={14} />,
    desc: 'El ritmo que configuraste como objetivo',
  },
  {
    mode: 'custom',
    label: 'Personalizado',
    icon: <Pencil size={14} />,
    desc: 'Introduce el ritmo manualmente',
  },
];

interface Props {
  rate: number;
  pref: RatePreference;
  onChange: (next: Partial<RatePreference>) => void;
  weeklyGoal?: number | null;
}

/** The weekly rate the arrival date is projected with; opens a menu to pick where it comes from. */
export function RatePicker({ rate, pref, onChange, weeklyGoal }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [customInput, setCustomInput] = useState(pref.customRate.toFixed(2));
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setCustomInput(pref.customRate.toFixed(2)), [pref.customRate]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent | TouchEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    const close = () => {
      if (popoverRef.current?.contains(document.activeElement)) return;
      setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside, { passive: true });
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const saveCustom = () => {
    const val = parseFloat(customInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onChange({ mode: 'custom', customRate: val });
      setOpen(false);
    }
  };

  const width = Math.min(320, window.innerWidth - 24);
  const left = anchor ? Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12)) : 12;
  const above = anchor ? window.innerHeight - anchor.bottom < 280 && anchor.top > 280 : false;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="rate-trigger"
        aria-expanded={open}
        onClick={() => {
          if (!open && triggerRef.current) setAnchor(triggerRef.current.getBoundingClientRect());
          setOpen((o) => !o);
        }}
      >
        <span className="tabular-nums">{rate.toFixed(2)} kg/sem</span>
        <span className="sr-only">, cambiar el ritmo de la proyección</span>
        <ChevronDown size={12} aria-hidden className={open ? 'rotate-180' : ''} />
      </button>
      {open &&
        anchor &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Ritmo de la proyección"
            className="rate-popover"
            style={{
              width,
              left,
              top: above ? 'auto' : anchor.bottom + 8,
              bottom: above ? window.innerHeight - anchor.top + 8 : 'auto',
            }}
          >
            <p className="rate-popover-title">Proyectar con</p>
            <div className="flex flex-col gap-1">
              {MODE_OPTIONS.map(({ mode, label, icon, desc }) => {
                const active = pref.mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={active}
                    className="rate-option"
                    onClick={() => {
                      onChange({ mode });
                      if (mode !== 'custom') setOpen(false);
                    }}
                  >
                    <span className="rate-option-icon">{icon}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="rate-option-label">
                        {label}
                        {mode === 'goal' && weeklyGoal != null && (
                          <span className="tabular-nums opacity-70">
                            {' '}
                            ({Math.abs(weeklyGoal).toFixed(2)} kg/sem)
                          </span>
                        )}
                      </span>
                      <span className="rate-option-desc">{desc}</span>
                    </span>
                    {active && <Check size={14} className="ml-auto shrink-0" aria-hidden />}
                  </button>
                );
              })}
            </div>
            {pref.mode === 'custom' && (
              <div className="rate-custom">
                <label className="sr-only" htmlFor="rate-custom-input">
                  Ritmo personalizado en kg por semana
                </label>
                <div className="relative min-w-0 flex-1">
                  <input
                    id="rate-custom-input"
                    type="text"
                    inputMode="decimal"
                    className="form-input w-full pr-16 tabular-nums"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveCustom()}
                    placeholder="0.50"
                    autoFocus
                  />
                  <span className="rate-custom-unit">kg/sem</span>
                </div>
                <button type="button" className="btn btn-primary" onClick={saveCustom}>
                  Aplicar
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
