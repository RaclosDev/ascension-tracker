import React from 'react';
import { Edit3 } from 'lucide-react';

interface RecipeCardProps {
  recipe: any;
  onEdit: (recipe: any) => void;
  onDragStart?: (e: React.DragEvent, data: any) => void;
}

const macroLine = (kcal: number, p: number, c: number, f: number) => (
  <span className="meal-subtotal-row" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
    <span className="subtotal-val kcal">
      <strong style={{ color: 'var(--text-primary)' }}>{Math.round(kcal)}</strong> kcal
    </span>
    <span className="subtotal-dot">·</span>
    <span className="subtotal-val">P: {Number(p).toFixed(1)}g</span>
    <span className="subtotal-dot">·</span>
    <span className="subtotal-val">C: {Number(c).toFixed(1)}g</span>
    <span className="subtotal-dot">·</span>
    <span className="subtotal-val">G: {Number(f).toFixed(1)}g</span>
  </span>
);

const itemStyle = (highlight: boolean) => ({
  padding: '0.5rem 0.7rem',
  background: highlight ? 'var(--bg-glass-strong)' : 'var(--bg-secondary)',
  borderRadius: '10px',
  border: `1px solid ${highlight ? 'var(--color-success)' : 'var(--border-subtle)'}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const EditBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="icon-btn edit-btn min-w-[44px] min-h-[44px] flex items-center justify-center"
    title="Editar"
  >
    <Edit3 className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" />
  </button>
);

export default function RecipeCard({ recipe, onEdit, onDragStart }: RecipeCardProps) {
  const handleDrag = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, {
        name: recipe.name,
        brand: '',
        kcal: recipe.totalKcal,
        protein: recipe.totalProtein,
        carbs: recipe.totalCarbs,
        fat: recipe.totalFat,
      });
    }
  };

  const renderDescription = () => {
    if (!recipe.description) return null;
    let text = recipe.description;
    try {
      if (text.startsWith('[')) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          text = parsed.map((ing) => `${ing.quantity}g ${ing.product}`).join(', ');
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      /* empty */
    }
    return (
      <div
        style={{
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? handleDrag : undefined}
      style={itemStyle(false)}
    >
      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {recipe.name}
        </div>
        {renderDescription()}
        <div>
          {macroLine(recipe.totalKcal, recipe.totalProtein, recipe.totalCarbs, recipe.totalFat)}
        </div>
      </div>
      <EditBtn onClick={() => onEdit(recipe)} />
    </div>
  );
}





