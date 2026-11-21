import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export const GRIPS = ['Prono', 'Supino', 'Neutro', 'Mixto', 'Estrecho', 'Ancho'];
export const MACHINES = [
  'Barra',
  'Mancuernas',
  'Polea',
  'Máquina guiada',
  'Multipower',
  'Kettlebell',
  'Banda',
];

/** A tag that reads "Agarre" or its value and opens a short list, with room for the coach's own. */
export function VariantChip({
  label,
  what,
  value,
  options,
  last,
  onChange,
}: {
  label: string;
  /** Accessible name, e.g. "Agarre de Sentadilla". */
  what: string;
  value: string | null | undefined;
  options: string[];
  /** What the athlete used the last time, offered first. */
  last?: string;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState('');
  const box = useRef<HTMLSpanElement>(null);
  const listId = useId();
  const choices = [...new Set([last, value, ...options].filter((o): o is string => !!o))];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      box.current?.querySelector('button')?.focus();
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const pick = (next: string | null) => {
    onChange(next);
    setOwn('');
    setOpen(false);
  };

  return (
    <span className="variant-chip" ref={box}>
      <button
        type="button"
        className="variant-chip-trigger"
        aria-label={`${what}: ${value || 'sin indicar'}`}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-set={value ? '' : undefined}
        title={value ? `${label}: ${value}` : label}
        onClick={() => setOpen(!open)}
      >
        {value || label}
        <ChevronDown size={12} aria-hidden />
      </button>
      {open && (
        <div className="variant-chip-menu" id={listId} role="group" aria-label={what}>
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={choice === value}
              onClick={() => pick(choice === value ? null : choice)}
            >
              {choice}
              {choice === last && choice !== value && <small>última vez</small>}
              {choice === value && <Check size={13} aria-hidden />}
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (own.trim()) pick(own.trim());
            }}
          >
            <input
              className="form-input"
              aria-label={`Otro: ${what.toLowerCase()}`}
              placeholder="Otro…"
              maxLength={255}
              value={own}
              onChange={(e) => setOwn(e.target.value)}
            />
          </form>
          {value && (
            <button type="button" className="variant-chip-clear" onClick={() => pick(null)}>
              Quitar
            </button>
          )}
        </div>
      )}
    </span>
  );
}
