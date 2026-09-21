import React, { useState } from 'react';

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CalculatorCard({ title, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => setIsOpen(!isOpen);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className="card accordion-card" style={{ padding: isOpen ? 'var(--space-lg)' : '1rem 1.25rem', transition: 'all 0.25s ease' }}>
      <div
        className="accordion-header"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={handleKeyDown}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
      >
        <span className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          ▾
        </span>
      </div>
      {isOpen && (
        <div className="accordion-content fade-in" style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}
