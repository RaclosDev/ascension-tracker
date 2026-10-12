import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface RenameExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string | null;
  currentName: string;
  onSave: (id: string, alias: string) => void;
}

export function RenameExerciseModal({
  isOpen,
  onClose,
  exerciseId,
  currentName,
  onSave,
}: RenameExerciseModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentName);
    }
  }, [isOpen, currentName]);

  function handleSave() {
    if (exerciseId && inputValue.trim()) {
      onSave(exerciseId, inputValue.trim());
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="card"
        style={{
          padding: '1.5rem',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          maxWidth: '400px',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Renombrar Ejercicio
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Este nombre se mostrará en lugar del original.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <label htmlFor="rename-exercise-input" className="sr-only">
            Nuevo nombre o alias del ejercicio
          </label>
          <input
            id="rename-exercise-input"
            aria-label="Nuevo nombre del ejercicio"
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ej: Press Pecho Multipower"
            style={{ width: '100%', padding: '0.75rem' }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              disabled={!inputValue.trim()}
            >
              Guardar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
