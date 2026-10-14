import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CalculatorCard({ title, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div
      className="card accordion-card"
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        transition: 'all 0.25s ease',
      }}
    >
      <button
        className="accordion-header"
        onClick={toggle}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          border: 'none',
          background: 'none',
          textAlign: 'left',
          width: '100%',
          padding: 0,
        }}
      >
        <span
          className="card-title"
          style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </span>
        <ChevronDown
          size={18}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        />
      </button>
      {isOpen && (
        <div
          className="accordion-content fade-in"
          style={{
            marginTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
