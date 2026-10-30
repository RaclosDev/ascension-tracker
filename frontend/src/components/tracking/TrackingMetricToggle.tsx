import React from 'react';
import { Scale, Footprints, Apple } from 'lucide-react';

interface TrackingMetricToggleProps {
  showWeight: boolean;
  showSteps: boolean;
  showCalories: boolean;
  onToggleWeight: () => void;
  onToggleSteps: () => void;
  onToggleCalories: () => void;
}

export const TrackingMetricToggle: React.FC<TrackingMetricToggleProps> = ({
  showWeight,
  showSteps,
  showCalories,
  onToggleWeight,
  onToggleSteps,
  onToggleCalories,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.3rem',
        marginBottom: 'var(--space-xl)',
        padding: '0.35rem',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '14px',
        overflowX: 'auto',
        border: '1px solid rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      }}
      role="toolbar"
      aria-label="Filtro de métricas mostradas en el calendario"
    >
      <button
        type="button"
        onClick={onToggleWeight}
        aria-pressed={showWeight}
        style={{
          flex: 1,
          padding: '0.45rem 0.6rem',
          borderRadius: '10px',
          border: 'none',
          background: showWeight ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          color: showWeight ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: showWeight ? 700 : 500,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: '80px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          boxShadow: showWeight
            ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset'
            : 'none',
          transform: showWeight ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        <Scale className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Peso
      </button>
      <button
        type="button"
        onClick={onToggleSteps}
        aria-pressed={showSteps}
        style={{
          flex: 1,
          padding: '0.45rem 0.6rem',
          borderRadius: '10px',
          border: 'none',
          background: showSteps ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          color: showSteps ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: showSteps ? 700 : 500,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: '80px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          boxShadow: showSteps
            ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset'
            : 'none',
          transform: showSteps ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        <Footprints className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Pasos
      </button>
      <button
        type="button"
        onClick={onToggleCalories}
        aria-pressed={showCalories}
        style={{
          flex: 1,
          padding: '0.45rem 0.6rem',
          borderRadius: '10px',
          border: 'none',
          background: showCalories ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
          color: showCalories ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: showCalories ? 700 : 500,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: '80px',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.35rem',
          boxShadow: showCalories
            ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset'
            : 'none',
          transform: showCalories ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        <Apple className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Kcal
      </button>
    </div>
  );
};
