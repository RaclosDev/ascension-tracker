import React from 'react';
import { SegmentedControl } from '../ui/segmented-control';

export interface SearchProduct {
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portions?: Array<{ label: string; amount: number }>;
}

interface FoodPortionEditorProps {
  selectedProduct: SearchProduct;
  quantity: number;
  setQuantity: (val: number) => void;
  inputMode: 'grams' | 'portions';
  setInputMode: (mode: 'grams' | 'portions') => void;
  onConfirmAdd: () => void;
}

export function FoodPortionEditor({
  selectedProduct,
  quantity,
  setQuantity,
  inputMode,
  setInputMode,
  onConfirmAdd,
}: FoodPortionEditorProps) {
  const portions = selectedProduct.portions || [];
  const hasPortions = portions.length > 0;
  const basePortion = hasPortions
    ? portions.find((p) => p.label.startsWith('1 ')) || portions[0]
    : null;
  const baseAmount = basePortion ? basePortion.amount : 100;
  const multiplier = quantity ? Number((quantity / baseAmount).toFixed(2)) : 0;
  const portionLabel = basePortion ? basePortion.label.replace(/^1\s*/, '') : 'ud';

  const [gramsInput, setGramsInput] = React.useState<string>(quantity ? String(quantity) : '');
  const [portionsInput, setPortionsInput] = React.useState<string>(
    multiplier ? String(multiplier) : '',
  );

  React.useEffect(() => {
    setGramsInput(quantity ? String(quantity) : '');
    setPortionsInput(multiplier ? String(multiplier) : '');
  }, [quantity, multiplier]);

  const handleGramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return;
    setGramsInput(raw);
    const normalized = raw.replace(',', '.');
    const val = parseFloat(normalized);
    setQuantity(isNaN(val) ? 0 : val);
  };

  const handlePortionsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return;
    setPortionsInput(raw);
    const normalized = raw.replace(',', '.');
    const m = parseFloat(normalized);
    if (!isNaN(m) && m >= 0) {
      setQuantity(Number((m * baseAmount).toFixed(1)));
    } else if (raw === '') {
      setQuantity(0);
    }
  };

  const handleMultiplierChange = (newMultiplier: number) => {
    let m = newMultiplier;
    if (m < 0) m = 0;
    setQuantity(Number((m * baseAmount).toFixed(1)));
  };

  const calculatedKcal = Math.round((selectedProduct.kcal || 0) * (Number(quantity) / 100));
  const calculatedProtein = ((selectedProduct.protein || 0) * (Number(quantity) / 100)).toFixed(1);
  const calculatedCarbs = ((selectedProduct.carbs || 0) * (Number(quantity) / 100)).toFixed(1);
  const calculatedFat = ((selectedProduct.fat || 0) * (Number(quantity) / 100)).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: '1.25rem',
          borderRadius: '12px',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{selectedProduct.name}</h3>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span>{Math.round(selectedProduct.kcal || 0)} kcal / 100g</span>
          <span>P: {Math.round(selectedProduct.protein || 0)}g</span>
          <span>C: {Math.round(selectedProduct.carbs || 0)}g</span>
          <span>G: {Math.round(selectedProduct.fat || 0)}g</span>
        </div>
      </div>

      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label className="form-label" style={{ margin: 0 }}>
            Cantidad {inputMode === 'grams' ? '(gramos)' : `(${portionLabel})`}
          </label>
          {hasPortions && (
            <div style={{ width: '160px' }}>
              <SegmentedControl
                options={[
                  { label: 'Gramos', value: 'grams' },
                  { label: 'Porción', value: 'portions' },
                ]}
                value={inputMode}
                onChange={(val: string) => setInputMode(val as 'grams' | 'portions')}
              />
            </div>
          )}
        </div>

        {inputMode === 'grams' || !hasPortions ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                className="form-input"
                style={{
                  fontSize: '1.2rem',
                  padding: '0.75rem',
                  fontWeight: 600,
                  width: '120px',
                  textAlign: 'center',
                }}
                value={gramsInput}
                onChange={handleGramsChange}
                autoFocus
                aria-label="Cantidad en gramos"
              />
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>g</span>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[-50, -10, 10, 50].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                  onClick={() => {
                    const current = Number(quantity) || 0;
                    const next = Math.max(0, current + delta);
                    setQuantity(next);
                  }}
                >
                  {delta > 0 ? `+${delta}g` : `${delta}g`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleMultiplierChange(multiplier - 1)}
              style={{
                width: '48px',
                height: '48px',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label="Restar una porción"
            >
              -
            </button>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              className="form-input"
              style={{
                fontSize: '1.2rem',
                padding: '0.75rem',
                fontWeight: 600,
                width: '100px',
                textAlign: 'center',
              }}
              value={portionsInput}
              onChange={handlePortionsInputChange}
              autoFocus
              aria-label="Número de porciones"
            />
            <button
              className="btn btn-secondary"
              onClick={() => handleMultiplierChange(multiplier + 1)}
              style={{
                width: '48px',
                height: '48px',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label="Sumar una porción"
            >
              +
            </button>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              x {portionLabel}
            </span>
          </div>
        )}
      </div>

      {hasPortions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {portions.map((port, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              onClick={() => setQuantity(port.amount)}
              style={{
                background: quantity === port.amount ? 'var(--color-protein-bg)' : '',
                color: quantity === port.amount ? 'var(--color-protein)' : '',
                borderColor: quantity === port.amount ? 'var(--color-protein)' : '',
              }}
            >
              {port.label} ({port.amount}g)
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }}></div>

      <div
        style={{
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Calculado</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{calculatedKcal} kcal</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <span style={{ color: 'var(--color-protein)' }}>P:</span> {calculatedProtein}g
          </div>
          <div>
            <span style={{ color: 'var(--color-carbs)' }}>C:</span> {calculatedCarbs}g
          </div>
          <div>
            <span style={{ color: 'var(--color-fat)' }}>G:</span> {calculatedFat}g
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
        onClick={onConfirmAdd}
        aria-label="Añadir a mi registro"
      >
        Añadir a mi registro
      </button>
    </div>
  );
}
