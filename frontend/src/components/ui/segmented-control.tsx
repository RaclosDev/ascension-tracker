import React from 'react';
import { cn } from '../../lib/utils';

export interface SegmentedControlOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn(className)}
      style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '0.35rem',
        borderRadius: '20px',
        position: 'relative',
        width: '100%'
      }}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '16px',
              background: isActive ? 'var(--bg-card)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 500,
              boxShadow: isActive ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
              border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
              transition: 'all 0.25s ease',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
