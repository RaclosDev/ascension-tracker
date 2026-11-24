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
    <div className="mf-bulk fade-in" role="region" aria-label="Alimentos seleccionados">
      <span className="mf-bulk-count tabular-nums">
        {selectedCount} {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
      </span>
      <div className="mf-bulk-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onOpenMealSelector}>
          <Utensils size={16} aria-hidden="true" /> Añadir a una comida
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm mf-bulk-delete"
          onClick={onBulkDelete}
        >
          <Trash2 size={16} aria-hidden="true" /> Borrar
        </button>
        <button
          type="button"
          className="icon-btn mf-icon-btn"
          aria-label="Quitar la selección"
          onClick={onClearSelection}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
