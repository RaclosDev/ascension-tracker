import React, { useState, useRef, useEffect } from 'react';
import { Timer, ChevronDown, Check } from 'lucide-react';
import { formatRestFriendly } from '../../lib/workout/format';
import { cn } from '../../lib/utils';

export interface RestTimerSelectProps {
  value: number;
  onChange: (seconds: number) => void;
  className?: string;
  presetDurations?: number[];
}

const DEFAULT_REST_PRESETS = [30, 60, 90, 120, 150, 180, 240, 300];

export function RestTimerSelect({
  value,
  onChange,
  className,
  presetDurations = DEFAULT_REST_PRESETS,
}: RestTimerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (sec: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(sec);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Liquid Glass Pill Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Tiempo de descanso para este ejercicio"
        title="Tiempo de descanso"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer',
          'backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/25',
          'text-white shadow-[0_2px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)]',
          isOpen &&
            'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 shadow-[0_0_15px_var(--accent-glow)] bg-white/[0.12]',
          className,
        )}
      >
        <Timer
          size={12}
          className="text-[var(--accent-primary)] shrink-0 transition-transform duration-200"
          style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }}
        />
        <span className="font-semibold text-white tracking-tight">{formatRestFriendly(value)}</span>
        <ChevronDown
          size={11}
          className={cn(
            'text-gray-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-[var(--accent-primary)]',
          )}
        />
      </button>

      {/* Accessible native select for test automation & screen readers */}
      <select
        className="exercise-card-rest-select"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Tiempo de descanso para este ejercicio"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        tabIndex={-1}
      >
        {presetDurations.map((sec) => (
          <option key={sec} value={sec}>
            {formatRestFriendly(sec)}
          </option>
        ))}
      </select>

      {/* Floating Liquid Glass Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label="Seleccionar tiempo de descanso"
          className="absolute right-0 top-full mt-1.5 z-50 p-1.5 rounded-2xl backdrop-blur-2xl bg-[#12121a]/95 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(0,133,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.1)] min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 border-b border-white/10 mb-1">
            Descanso entre series
          </div>

          <div className="flex flex-col gap-0.5">
            {presetDurations.map((sec) => {
              const isSelected = sec === value;
              return (
                <div
                  key={sec}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(e) => handleSelect(sec, e)}
                  className={cn(
                    'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150',
                    isSelected
                      ? 'bg-gradient-to-r from-[var(--accent-primary)]/30 to-[var(--accent-primary)]/10 text-white font-semibold border border-[var(--accent-primary)]/40 shadow-[0_0_12px_rgba(0,133,255,0.25)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.08]',
                  )}
                >
                  <span>{formatRestFriendly(sec)}</span>
                  {isSelected && (
                    <Check
                      size={13}
                      className="text-[var(--accent-primary)] shrink-0 animate-in zoom-in"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
