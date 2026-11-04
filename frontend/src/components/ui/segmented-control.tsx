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
        background: 'var(--bg-secondary)',
        padding: '0.25rem',
        border: '1px solid var(--border-medium)',
        borderRadius: '6px',
        position: 'relative',
        width: '100%',
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
              padding: '0.6rem',
              borderRadius: '3px',
              background: isActive ? '#193653' : 'transparent',
              color: isActive ? '#77bdff' : 'var(--text-secondary)',
              fontWeight: isActive ? 700 : 500,
              boxShadow: 'none',
              border: '1px solid transparent',
              transition: 'background 0.15s ease, color 0.15s ease',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
