import * as DialogPrimitive from '@radix-ui/react-dialog';
import React, { useRef, useState, type ReactNode } from 'react';
import { Trash2, Scale, Footprints, Apple, X } from 'lucide-react';
import { TrackingModalData } from '../../types/tracking';
import { capitalizeFirst } from '../../utils/dateHelper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import '../../styles/tracking-entry.css';

interface TrackingEntryModalProps {
  pending?: boolean;
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
  pending = false,
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);

  if (!modalData) return null;

  const hasDataToDelete = modalData.dayData.weight !== null || modalData.dayData.steps !== null;

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-backdrop">
          <DialogPrimitive.Content
            className="modal-content te"
            aria-describedby={undefined}
            onOpenAutoFocus={() => {
              previousFocus.current =
                document.activeElement instanceof HTMLElement ? document.activeElement : null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              previousFocus.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (pending) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            <header className="te-head">
              <div>
                <p className="te-eyebrow">Registro del día</p>
                <DialogPrimitive.Title id="tracking-modal-title" className="te-title">
                  {capitalizeFirst(modalData.fullLabel)}
                </DialogPrimitive.Title>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={onClose}
                aria-label="Cerrar modal de edición"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <MetricStepper
              id="modal-weight-input"
              label="Peso"
              icon={<Scale size={16} aria-hidden="true" />}
              unit="kg"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              placeholder="00.0"
              value={modalWeight}
              onChange={onWeightChange}
              deltas={weightDeltas}
              format={(step) => (step > 0 ? `+${step.toFixed(2)}` : step.toFixed(2))}
              short={(step) =>
                `${step > 0 ? '+' : '−'}${String(Math.abs(step)).replace(/^0\./, '.')}`
              }
              ariaPrefix="Ajustar peso en"
              ariaUnit=" kg"
              onDelta={(step) => onDeltaAdjust('weight', step)}
            />
            <MetricStepper
              id="modal-steps-input"
              label="Pasos"
              icon={<Footprints size={16} aria-hidden="true" />}
              unit="pasos"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={modalSteps}
              onChange={onStepsChange}
              deltas={stepsDeltas}
              format={(step) => (step > 0 ? `+${step}` : `${step}`)}
              short={(step) =>
                Math.abs(step) >= 1000
                  ? `${step > 0 ? '+' : '−'}${Math.abs(step) / 1000}k`
                  : step > 0
                    ? `+${step}`
                    : `−${Math.abs(step)}`
              }
              ariaPrefix="Ajustar pasos en"
              ariaUnit=""
              onDelta={(step) => onDeltaAdjust('steps', step)}
            />

            <p className="te-kcal">
              <Apple size={16} aria-hidden="true" />
              <span>Calorías del día</span>
              <strong>
                {modalData.dayData.calories !== null
                  ? `${Math.round(modalData.dayData.calories)} kcal`
                  : 'Sin comidas'}
              </strong>
            </p>

            <footer className="te-foot">
              {hasDataToDelete && (
                <button
                  type="button"
                  className="te-delete"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={pending}
                >
                  <Trash2 size={16} aria-hidden="true" /> Borrar día
                </button>
              )}
              <button type="button" className="btn btn-secondary te-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary te-save"
                disabled={pending}
                onClick={onSave}
              >
                Guardar
              </button>
            </footer>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent
          className="card"
          style={{
            maxWidth: '380px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '1.25rem',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              ¿Eliminar registros del día?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Se eliminarán tanto el peso como los pasos registrados para el {modalData?.fullLabel}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <AlertDialogCancel className="btn btn-secondary">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="btn btn-danger btn-press"
              onClick={() => {
                setConfirmDeleteOpen(false);
                onDelete();
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogPrimitive.Root>
  );
};

type MetricStepperProps = {
  id: string;
  label: string;
  icon: ReactNode;
  unit: string;
  inputMode: 'decimal' | 'numeric';
  pattern: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  deltas: number[];
  format: (step: number) => string;
  short: (step: number) => string;
  ariaPrefix: string;
  ariaUnit: string;
  onDelta: (step: number) => void;
};

/** One metric: the figure in the middle, the small steps down on the left and up on the right. */
function MetricStepper({
  id,
  label,
  icon,
  unit,
  inputMode,
  pattern,
  placeholder,
  value,
  onChange,
  deltas,
  format,
  short,
  ariaPrefix,
  ariaUnit,
  onDelta,
}: MetricStepperProps) {
  const down = deltas.filter((d) => d < 0).sort((a, b) => a - b);
  const up = deltas.filter((d) => d > 0).sort((a, b) => a - b);
  const chip = (step: number) => (
    <button
      key={step}
      type="button"
      className="te-chip"
      onClick={() => onDelta(step)}
      aria-label={`${ariaPrefix} ${format(step)}${ariaUnit}`}
    >
      {short(step)}
    </button>
  );
  return (
    <section className="te-metric">
      <label htmlFor={id} className="te-label">
        {icon} {label}
      </label>
      <div className="te-row">
        <div className="te-chips">{down.map(chip)}</div>
        <div className="te-field">
          <input
            id={id}
            type="text"
            inputMode={inputMode}
            pattern={pattern}
            autoComplete="off"
            className="te-input"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="te-unit">{unit}</span>
        </div>
        <div className="te-chips">{up.map(chip)}</div>
      </div>
    </section>
  );
}
