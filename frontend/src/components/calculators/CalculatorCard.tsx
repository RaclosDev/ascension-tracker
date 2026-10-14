import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { haptics } from '@/lib/haptics';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CalculatorCard({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    haptics.medium();
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`card accordion-card transition-all duration-300 ease-out ${isOpen ? 'open' : ''}`}
      style={{
        background: 'var(--bg-card, #1C1C1E)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: isOpen ? '1.15rem 1.25rem' : '0.875rem 1.15rem',
      }}
    >
      <button
        className="accordion-header flex justify-between items-center w-full cursor-pointer select-none text-left p-0 border-none bg-transparent"
        onClick={toggle}
        aria-expanded={isOpen}
        type="button"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="card-title m-0 text-base font-semibold text-white truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{subtitle}</div>
            )}
          </div>
        </div>
        <span
          className={`text-xs text-[var(--text-secondary)] transition-transform duration-300 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          <ChevronDown size={18} />
        </span>
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            className="accordion-content"
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
