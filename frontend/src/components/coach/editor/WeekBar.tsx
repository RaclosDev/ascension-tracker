import { useState } from 'react';
import { Copy } from 'lucide-react';
import { inputClass, inputStyle } from './fields';
export function WeekBar({
  weeks,
  current,
  onSelect,
  onCopy,
}: {
  weeks: number;
  current: number;
  onSelect: (week: number) => void;
  onCopy: (to: number) => void;
}) {
  const [target, setTarget] = useState('');
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="Semanas" className="flex flex-wrap gap-1">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
          <button
            key={w}
            type="button"
            role="tab"
            aria-selected={w === current}
            className={w === current ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onSelect(w)}
          >
            S{w}
          </button>
        ))}
      </div>
      {weeks > 1 && (
        <div className="flex items-center gap-2 ml-auto">
          <select
            aria-label={`Copiar la semana ${current} a`}
            className={inputClass}
            style={inputStyle}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">Copiar semana {current} a…</option>
            {Array.from({ length: weeks }, (_, i) => i + 1)
              .filter((w) => w !== current)
              .map((w) => (
                <option key={w} value={w}>
                  Semana {w}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            aria-label={`Copiar semana ${current}`}
            disabled={!target}
            onClick={() => {
              onCopy(Number(target));
              setTarget('');
            }}
          >
            <Copy size={16} aria-hidden /> Copiar
          </button>
        </div>
      )}
    </div>
  );
}
