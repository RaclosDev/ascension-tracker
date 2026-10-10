import { Trash2, Utensils, X } from 'lucide-react';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onOpenMealSelector: () => void;
}

export function BulkSelectionToolbar({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  onOpenMealSelector,
}: BulkSelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="bulk-action-bar fade-in"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-danger-bg)',
        border: '1px solid rgba(239,68,68,0.3)',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 600 }}>
        {selectedCount} seleccionados
      </span>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button
          onClick={onOpenMealSelector}
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--accent-text, white)',
            border: 'none',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <Utensils className="w-4 h-4" /> Añadir
        </button>
        <button
          onClick={onBulkDelete}
          style={{
            background: 'var(--bg-glass)',
            color: 'var(--color-danger)',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <Trash2 className="w-4 h-4" /> Borrar
        </button>
        <button
          onClick={onClearSelection}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: '0.4rem 0.5rem',
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
