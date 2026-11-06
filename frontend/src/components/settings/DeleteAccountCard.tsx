import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const CONFIRM_WORD = 'BORRAR';

interface DeleteAccountCardProps {
  /** Deletes the account on the server; rejects when it could not be deleted. */
  onConfirm: () => Promise<void>;
}

/** Right to erasure (GDPR art. 17): deletes the account and every piece of data it holds. */
export function DeleteAccountCard({ onConfirm }: DeleteAccountCardProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const close = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setTyped('');
      setFailed(false);
    }
  };

  const remove = async () => {
    if (!confirmed || pending) return;
    setPending(true);
    setFailed(false);
    try {
      await onConfirm();
    } catch {
      setFailed(true);
      setPending(false);
    }
  };

  return (
    <div
      className="card mt-4 mb-4"
      style={{ padding: 'var(--space-lg)', border: '1px solid rgba(239, 68, 68, 0.35)' }}
    >
      <div className="flex items-center gap-2">
        <Trash2 size={20} style={{ color: 'var(--color-danger, #ef4444)' }} />
        <span
          className="card-title"
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-danger, #ef4444)',
          }}
        >
          Borrar cuenta
        </span>
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          margin: '1rem 0',
        }}
      >
        Borra tu cuenta y todos tus datos: entrenos, comidas, peso, fotos, ajustes y vínculos con
        entrenadores. No se puede deshacer. Si quieres conservarlos, descarga antes la copia de
        seguridad.
      </p>
      <button
        type="button"
        className="btn btn-secondary min-h-11"
        style={{
          width: '100%',
          borderColor: 'rgba(239, 68, 68, 0.5)',
          color: 'var(--color-danger)',
          background: 'rgba(239, 68, 68, 0.1)',
        }}
        onClick={() => setOpen(true)}
      >
        Borrar mi cuenta
      </button>

      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent
          className="card"
          style={{
            maxWidth: '400px',
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
              ¿Borrar tu cuenta para siempre?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Se borrarán todos tus datos y se cerrarán tus sesiones en todos los dispositivos. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label
            htmlFor="delete-account-confirm"
            style={{
              display: 'block',
              marginTop: '1rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
          >
            Escribe {CONFIRM_WORD} para confirmar
          </label>
          <input
            id="delete-account-confirm"
            className="form-input min-h-11"
            style={{ width: '100%', marginTop: '0.5rem' }}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            disabled={pending}
          />
          {failed && (
            <p
              role="alert"
              style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}
            >
              No se pudo borrar la cuenta. Inténtalo de nuevo.
            </p>
          )}
          <AlertDialogFooter
            style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <AlertDialogCancel className="btn btn-secondary" disabled={pending}>
              Cancelar
            </AlertDialogCancel>
            <button
              type="button"
              className="btn btn-danger btn-press"
              style={{ opacity: !confirmed || pending ? 0.5 : 1 }}
              disabled={!confirmed || pending}
              onClick={remove}
            >
              {pending ? 'Borrando…' : 'Borrar cuenta'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
