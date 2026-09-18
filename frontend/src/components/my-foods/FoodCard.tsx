import React from 'react';
import { CheckCircle2, Circle, Edit3 } from 'lucide-react';

interface FoodCardProps {
  food: any;
  isSelected: boolean;
  onToggleSelect: (id: any) => void;
  onEdit: (food: any) => void;
  viewMode: string;
  onDragStart: (e: React.DragEvent, data: any) => void;
}

const macroLine = (kcal: number, p: number, c: number, f: number) => (
  <span className="meal-subtotal-row" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
    <span className="subtotal-val kcal"><strong style={{ color: 'var(--text-primary)' }}>{Math.round(kcal)}</strong> kcal</span>
    <span className="subtotal-dot" style={{ margin: '0 0.3rem', opacity: 0.5 }}>•</span>
    <span className="subtotal-val">P: {Number(p).toFixed(1)}g</span>
    <span className="subtotal-dot" style={{ margin: '0 0.3rem', opacity: 0.5 }}>•</span>
    <span className="subtotal-val">C: {Number(c).toFixed(1)}g</span>
    <span className="subtotal-dot" style={{ margin: '0 0.3rem', opacity: 0.5 }}>•</span>
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
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="icon-btn edit-btn" style={{ padding: '0.4rem', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editar">
    <Edit3 className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" />
  </button>
);

export default function FoodCard({
  food,
  isSelected,
  onToggleSelect,
  onEdit,
  viewMode,
  onDragStart
}: FoodCardProps) {
  
  const handleDrag = (e: React.DragEvent) => {
    onDragStart(e, {
      name: food.name,
      brand: food.brand || '',
      kcal: food.kcalPer100g,
      protein: food.proteinPer100g,
      carbs: food.carbsPer100g,
      fat: food.fatPer100g
    });
  };

  if (viewMode === 'grid') {
    return (
      <div draggable onClick={() => onToggleSelect(food.id)} onDragStart={handleDrag} style={{ ...itemStyle(isSelected), flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
        
        {/* Fila 1: Nombre (Izquierda) + Lápiz (Derecha) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingTop: '0.2rem' }}>
            {food.name}
          </div>
          <div style={{ flexShrink: 0, marginTop: '-0.2rem', marginRight: '-0.2rem' }}>
            <EditBtn onClick={() => onEdit(food)} />
          </div>
        </div>
        
        {/* Fila 2: Kcal, Porción, Marca */}
        <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round(food.kcalPer100g)} kcal</span>
          
          {(food.servingSize > 0 || food.brand) && (
            <span style={{ opacity: 0.5 }}>•</span>
          )}

          {food.servingSize > 0 && (
            <span style={{ background: 'var(--bg-primary)', padding: '0.1rem 0.3rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              {food.servingSize}g/{food.servingLabel || 'ud'}
            </span>
          )}

          {food.servingSize > 0 && food.brand && (
            <span style={{ opacity: 0.5 }}>•</span>
          )}

          {food.brand && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>
              {food.brand}
            </span>
          )}
        </div>

        {/* Fila 3: Macros Restantes */}
        <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <span>P: {Number(food.proteinPer100g).toFixed(1)}g</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>C: {Number(food.carbsPer100g).toFixed(1)}g</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>G: {Number(food.fatPer100g).toFixed(1)}g</span>
        </div>

      </div>
    );
  }

  // list mode
  return (
    <div draggable onClick={() => onToggleSelect(food.id)} onDragStart={handleDrag} style={{ display: 'flex', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', alignItems: 'center', background: isSelected ? 'var(--bg-glass-strong)' : 'transparent', cursor: 'pointer' }}>
      <div style={{ width: '30px', color: isSelected ? 'var(--color-success)' : 'var(--text-secondary)', opacity: isSelected ? 1 : 0.3 }}>
        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      </div>
      <div style={{ flex: 2, minWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
        {food.name} {food.brand && <span style={{opacity:0.5, fontSize:'0.7rem'}}>({food.brand})</span>}
      </div>
      <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{Math.round(food.kcalPer100g)}</div>
      <div style={{ flex: 1, textAlign: 'right' }}>{Number(food.proteinPer100g).toFixed(1)}</div>
      <div style={{ flex: 1, textAlign: 'right' }}>{Number(food.carbsPer100g).toFixed(1)}</div>
      <div style={{ flex: 1, textAlign: 'right' }}>{Number(food.fatPer100g).toFixed(1)}</div>
      <div style={{ width: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <EditBtn onClick={() => onEdit(food)} />
      </div>
    </div>
  );
}
