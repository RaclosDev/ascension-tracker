import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CalculatorCard({
  title,
  icon,
  description,
  defaultOpen = false,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div
      className={`card accordion-card rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent border border-white/10 hover:border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300 ease-out ${
        isOpen ? 'p-5 sm:p-7' : 'px-5 py-4 sm:px-6'
      }`}
    >
      <button
        type="button"
        className="accordion-header flex justify-between items-center w-full cursor-pointer select-none border-none bg-transparent text-left p-0"
        onClick={toggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h2 className="card-title m-0 text-base font-semibold text-white tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-normal">
                {description}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform duration-300 shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="accordion-content fade-in mt-5 pt-5 border-t border-[var(--border-subtle)]">
          {children}
        </div>
      )}
    </div>
  );
}
