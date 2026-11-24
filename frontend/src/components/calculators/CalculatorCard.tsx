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
    <div className="card calc-card" data-open={isOpen || undefined}>
      <button className="calc-head" onClick={toggle} aria-expanded={isOpen} type="button">
        {icon && (
          <span className="calc-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="calc-text">
          <span className="calc-title">{title}</span>
          {subtitle && <span className="calc-sub">{subtitle}</span>}
        </span>
        <ChevronDown size={18} aria-hidden="true" className="calc-chevron" />
      </button>

      <div className="calc-fold">
        <div className="calc-fold-inner" inert={!isOpen}>
          <div className="calc-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
