import React from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const BASE_GRAMS = 100;

export default function ManualFoodForm({
  manualForm,
  updateManualForm,
  quantity,
  setQuantity,
  ocrLoading,
  date,
  selectedMealIndex,
  onLogAdded,
  onClose,
}: any) {
  const handleManualSubmit = async (e: any) => {
    e.preventDefault();
    if (!manualForm.name.trim()) {
      toast.error('El nombre del alimento es obligatorio');
      return;
    }

    const qty = Number(quantity) || BASE_GRAMS;
    const factor = qty / BASE_GRAMS;
    const kcalPer100 = Number(manualForm.kcal) || 0;
    const pPer100 = Number(manualForm.protein) || 0;
    const cPer100 = Number(manualForm.carbs) || 0;
    const fPer100 = Number(manualForm.fat) || 0;

    const productName =
      manualForm.name.trim() + (manualForm.brand.trim() ? ` (${manualForm.brand.trim()})` : '');

    const logEntry = {
      date: date,
      mealIndex: Number(selectedMealIndex) || 0,
      product: productName,
      quantity: qty,
      kcal: Number((kcalPer100 * factor).toFixed(1)),
      protein: Number((pPer100 * factor).toFixed(1)),
      carbs: Number((cPer100 * factor).toFixed(1)),
      fat: Number((fPer100 * factor).toFixed(1)),
    };

    try {
      await api.post('/nutrition/logs', logEntry);

      const myFoodDto = {
        name: manualForm.name.trim(),
        brand: manualForm.brand.trim() || '',
        kcalPer100g: kcalPer100,
        proteinPer100g: pPer100,
        carbsPer100g: cPer100,
        fatPer100g: fPer100,
        servingSize: null,
        servingLabel: null,
      };
      await api
        .post('/nutrition/my-foods', myFoodDto)
        .catch(() => console.warn('Ya existía o error al guardar en mis alimentos'));

      toast.success('Alimento guardado y añadido a tus alimentos');
      onLogAdded();
      onClose();
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Error al guardar el alimento';
      toast.error(errorMessage);
    }
  };

  return (
    <form
      onSubmit={handleManualSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div className="form-group">
        <label className="form-label" htmlFor="food-name">
          Nombre del alimento <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          id="food-name"
          type="text"
          className="form-input"
          placeholder="Ej. Pechuga de pollo, Manzana..."
          value={manualForm.name}
          onChange={(e) => updateManualForm('name', e.target.value)}
          autoFocus
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="food-portion">
            Porción consumida (g)
          </label>
          <input
            id="food-portion"
            type="number"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            min="1"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="food-kcal">
            Calorías (por 100g)
          </label>
          <input
            id="food-kcal"
            type="number"
            className="form-input"
            placeholder="0"
            value={manualForm.kcal}
            onChange={(e) => updateManualForm('kcal', e.target.value)}
            min="0"
          />
        </div>
      </div>

      {ocrLoading && (
        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid var(--accent-color)',
            borderRadius: '10px',
            color: 'var(--accent-color)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            animation: 'pulse 2s infinite',
          }}
        >
          <div
            className="spinner"
            style={{
              width: '16px',
              height: '16px',
              borderWidth: '2px',
              borderColor: 'var(--accent-color) transparent var(--accent-color) transparent',
            }}
          ></div>
          Extrayendo macros de la etiqueta...
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          opacity: ocrLoading ? 0.5 : 1,
          pointerEvents: ocrLoading ? 'none' : 'auto',
          transition: 'opacity 0.3s',
        }}
      >
        <div className="form-group">
          <label
            className="form-label"
            htmlFor="food-protein"
            style={{ color: 'var(--color-protein)', fontSize: '0.8rem' }}
          >
            Proteína (g/100g)
          </label>
          <input
            id="food-protein"
            type="number"
            step="0.1"
            className="form-input"
            placeholder="0.0"
            value={manualForm.protein}
            onChange={(e) => updateManualForm('protein', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label
            className="form-label"
            htmlFor="food-carbs"
            style={{ color: 'var(--color-carbs)', fontSize: '0.8rem' }}
          >
            Hidratos (g/100g)
          </label>
          <input
            id="food-carbs"
            type="number"
            step="0.1"
            className="form-input"
            placeholder="0.0"
            value={manualForm.carbs}
            onChange={(e) => updateManualForm('carbs', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label
            className="form-label"
            htmlFor="food-fat"
            style={{ color: 'var(--color-fat)', fontSize: '0.8rem' }}
          >
            Grasas (g/100g)
          </label>
          <input
            id="food-fat"
            type="number"
            step="0.1"
            className="form-input"
            placeholder="0.0"
            value={manualForm.fat}
            onChange={(e) => updateManualForm('fat', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Guardar Alimento
        </button>
      </div>
    </form>
  );
}




