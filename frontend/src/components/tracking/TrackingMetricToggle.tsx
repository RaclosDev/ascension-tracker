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

const OPTION_STYLE: React.CSSProperties = {
  minWidth: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
};

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
      className="segmented"
      style={{ marginBottom: 'var(--space-xl)', overflowX: 'auto' }}
      role="toolbar"
      aria-label="Filtro de métricas mostradas en el calendario"
    >
      <button
        type="button"
        className="segmented-option"
        onClick={onToggleWeight}
        aria-pressed={showWeight}
        style={OPTION_STYLE}
      >
        <Scale className="w-4 h-4 inline-block" aria-hidden="true" /> Peso
      </button>
      <button
        type="button"
        className="segmented-option"
        onClick={onToggleSteps}
        aria-pressed={showSteps}
        style={OPTION_STYLE}
      >
        <Footprints className="w-4 h-4 inline-block" aria-hidden="true" /> Pasos
      </button>
      <button
        type="button"
        className="segmented-option"
        onClick={onToggleCalories}
        aria-pressed={showCalories}
        style={OPTION_STYLE}
      >
        <Apple className="w-4 h-4 inline-block" aria-hidden="true" /> Kcal
      </button>
    </div>
  );
};
