import React, { useEffect } from 'react';
import { Trash2, Scale, Footprints, Apple, X } from 'lucide-react';
import { TrackingModalData } from '../../types/tracking';

interface TrackingEntryModalProps {
  modalData: TrackingModalData | null;
  modalWeight: string;
  modalSteps: string;
  weightDeltas: number[];
  stepsDeltas: number[];
  onWeightChange: (val: string) => void;
  onStepsChange: (val: string) => void;
  onDeltaAdjust: (metric: 'weight' | 'steps', delta: number) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const TrackingEntryModal: React.FC<TrackingEntryModalProps> = ({
  modalData,
  modalWeight,
  modalSteps,
  weightDeltas,
  stepsDeltas,
  onWeightChange,
  onStepsChange,
  onDeltaAdjust,
  onSave,
  onDelete,
  onClose,
}) => {
  useEffect(() => {
    if (!modalData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalData, onClose]);

  if (!modalData) return null;

  const hasDataToDelete = modalData.dayData.weight !== null || modalData.dayData.steps !== null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', width: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2
              id="tracking-modal-title"
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'capitalize',
                margin: 0,
              }}
            >
              {modalData.fullLabel}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Edita las métricas del día
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Cerrar modal de edición"
            style={{ padding: '0.2rem 0.6rem', borderRadius: '50%' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Weight Section */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <label
                htmlFor="modal-weight-input"
                style={{
                  fontWeight: 600,
                  color: 'var(--accent-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                }}
              >
                <Scale className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Peso
              </label>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <input
                id="modal-weight-input"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                className="form-input"
                style={{
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '0.5rem',
                  width: '120px',
                }}
                placeholder="00.00"
                value={modalWeight}
                onChange={(e) => onWeightChange(e.target.value)}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>kg</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem',
              }}
            >
              {weightDeltas.map((step) => (
                <button
                  key={step}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0' }}
                  onClick={() => onDeltaAdjust('weight', step)}
                  aria-label={`Ajustar peso en ${step > 0 ? `+${step}` : step} kg`}
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
            </div>
          </div>

          {/* Steps Section */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <label
                htmlFor="modal-steps-input"
                style={{
                  fontWeight: 600,
                  color: 'var(--accent-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                }}
              >
                <Footprints className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Pasos
              </label>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <input
                id="modal-steps-input"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input"
                style={{
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '0.5rem',
                  width: '120px',
                }}
                placeholder="0"
                value={modalSteps}
                onChange={(e) => onStepsChange(e.target.value)}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>pasos</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem',
              }}
            >
              {stepsDeltas.map((step) => (
                <button
                  key={step}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0' }}
                  onClick={() => onDeltaAdjust('steps', step)}
                  aria-label={`Ajustar pasos en ${step > 0 ? `+${step}` : step}`}
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
            </div>
          </div>

          {/* Calories Read-only Section */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: 'var(--accent-primary-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Apple className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Calorías de hoy
            </span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--accent-primary-light)',
              }}
            >
              {modalData.dayData.calories !== null
                ? `${Math.round(modalData.dayData.calories)} kcal`
                : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              opacity: hasDataToDelete ? 1 : 0,
              pointerEvents: hasDataToDelete ? 'auto' : 'none',
            }}
            aria-disabled={!hasDataToDelete}
          >
            <Trash2 size={16} aria-hidden="true" /> Borrar Ambos
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              style={{ minWidth: '110px' }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
