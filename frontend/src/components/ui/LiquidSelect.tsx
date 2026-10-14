import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LiquidSelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface LiquidSelectProps<T extends string | number = string | number> {
  id?: string;
  options: LiquidSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  'aria-label'?: string;
}

export function LiquidSelect<T extends string | number = string | number>({
  id,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  className,
  menuClassName,
  'aria-label': ariaLabel,
}: LiquidSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
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

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200',
          'bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20',
          'text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]',
          'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20',
          isOpen &&
            'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 shadow-[0_0_15px_var(--accent-glow)]',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[var(--accent-primary)]">{selectedOption.icon}</span>
          )}
          <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-[var(--accent-primary)]',
          )}
        />
      </button>

      {/* Floating Liquid Glass Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50 p-1.5 rounded-2xl',
            'backdrop-blur-2xl bg-[#14141e]/95 border border-white/15',
            'shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(0,133,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.1)]',
            'max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10',
            'animate-in fade-in zoom-in-95 duration-150',
            menuClassName,
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all duration-150 mb-0.5 last:mb-0',
                  isSelected
                    ? 'bg-gradient-to-r from-[var(--accent-primary)]/25 to-[var(--accent-primary)]/10 text-white border border-[var(--accent-primary)]/40 shadow-[0_0_12px_rgba(0,133,255,0.2)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.08]',
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && (
                    <span
                      className={cn(
                        'shrink-0',
                        isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-400',
                      )}
                    >
                      {option.icon}
                    </span>
                  )}
                  <div className="truncate">
                    <span className="block truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="block text-[10px] text-gray-400 font-normal truncate">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check
                    size={14}
                    className="shrink-0 text-[var(--accent-primary)] animate-in zoom-in"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
