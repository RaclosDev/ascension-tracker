import { ArrowLeft, X } from 'lucide-react';

interface Props {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
}
export function FoodSearchHeader({ title, canGoBack, onBack, onClose }: Props) {
  return (
    <div className="food-search-header">
      <button
        type="button"
        className="icon-btn min-w-11 min-h-11"
        aria-label={canGoBack ? 'Volver' : 'Cerrar buscador de alimentos'}
        onClick={canGoBack ? onBack : onClose}
      >
        {canGoBack ? (
          <ArrowLeft size={20} aria-hidden="true" />
        ) : (
          <X size={20} aria-hidden="true" />
        )}
      </button>
      <div style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>{title}</div>
      <div style={{ width: 44 }} />
    </div>
  );
}
