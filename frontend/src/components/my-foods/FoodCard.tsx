import React from 'react';

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
  <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="icon-btn edit-btn" style={{ padding: '0.4rem', width: '28px', height: '28px' }} title="Editar">
    
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
      <div draggable onClick={() => onToggleSelect(food.id)} onDragStart={handleDrag} style={{ ...itemStyle(isSelected), alignItems: 'flex-start' }}>
        <div style={{ paddingTop: '0.2rem', minWidth: '20px', color: isSelected ? 'var(--color-success)' : 'var(--text-secondary)', opacity: isSelected ? 1 : 0.3 }}>
          {isSelected ? '' : ''}
        </div>
        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name}</span>
            {food.brand && <span style={{ opacity: 0.5, fontSize: '0.75rem', flexShrink: 0 }}>({food.brand})</span>}
          </div>
          {food.servingSize > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>[{food.servingSize}g/{food.servingLabel||'ud'}]</div>}
          <div>{macroLine(food.kcalPer100g, food.proteinPer100g, food.carbsPer100g, food.fatPer100g)}</div>
        </div>
        <EditBtn onClick={() => onEdit(food)} />
      </div>
    );
  }

  // list mode
  return (
    <div draggable onClick={() => onToggleSelect(food.id)} onDragStart={handleDrag} style={{ display: 'flex', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', alignItems: 'center', background: isSelected ? 'var(--bg-glass-strong)' : 'transparent', cursor: 'pointer' }}>
      <div style={{ width: '30px', color: isSelected ? 'var(--color-success)' : 'var(--text-secondary)', opacity: isSelected ? 1 : 0.3 }}>
        {isSelected ? '' : ''}
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
