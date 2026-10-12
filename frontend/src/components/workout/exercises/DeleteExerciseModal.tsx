import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Exercise } from '@/lib/workout/types';

export interface DeleteExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exercise: Exercise | null;
  usageCount?: number;
  isDeleting?: boolean;
}

export function DeleteExerciseModal({
  isOpen,
  onClose,
  onConfirm,
  exercise,
  usageCount = 0,
  isDeleting = false,
}: DeleteExerciseModalProps) {
  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="card"
        style={{
          padding: '1.5rem',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          maxWidth: '440px',
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="text-red-500 shrink-0" size={22} />
            <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Eliminar Ejercicio
            </DialogTitle>
          </div>
          <DialogDescription
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}
          >
            ¿Estás seguro de que deseas eliminar{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{exercise.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 my-3">
          {usageCount > 0 ? (
            <div
              className="p-3 rounded-lg text-xs"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              Este ejercicio aparece en <strong>{usageCount}</strong> entrenamientos registrados.
              Esta acción no se puede deshacer.
            </div>
          ) : (
            <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
              Esta acción eliminará de forma permanente el ejercicio de tu catálogo.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
