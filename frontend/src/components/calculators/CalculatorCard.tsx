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
    <div className="card accordion-card" style={{ marginBottom: '16px' }}>
      <div 
        className="card-header" 
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={handleKeyDown}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}
      >
        <h3 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
        <svg 
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {isOpen && (
        <div className="card-content" style={{ padding: '0 16px 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
