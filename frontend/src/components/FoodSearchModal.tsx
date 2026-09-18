import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useSpeechToText } from '../hooks/useSpeechToText';

import { getSanitizedKcal, extractPortions } from '../utils/portionHelper';
import { getSmartFallbackQueries } from '../utils/searchHelper';
import BarcodeScanner from './BarcodeScanner';

export default function FoodSearchModal({ isOpen, onClose, mealIndex, date, onLogAdded, meals = [] }) {
  const [activeTab, setActiveTab] = useState('ai'); // 'search' | 'manual' | 'scanner' | 'ai'
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const [offResults, setOffResults] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [savedFoods, setSavedFoods] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [selectedMealIndex, setSelectedMealIndex] = useState(mealIndex !== undefined && mealIndex !== null ? mealIndex : 0);
  const [ocrLoading, setOcrLoading] = useState(false);

  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: (text) => setQuery(text),
    lang: 'es-ES'
  });

  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  useEffect(() => {
    if (mealIndex !== undefined && mealIndex !== null) {
      setSelectedMealIndex(mealIndex);
    }
  }, [mealIndex]);

  // --- MANUAL ENTRY STATE ---
  const [manualForm, setManualForm] = useState({
    name: '', brand: '', kcal: '', protein: '', carbs: '', fat: ''
  });

  const updateManualForm = (field, value) => {
    const newForm = { ...manualForm, [field]: value };
    if (['protein', 'carbs', 'fat'].includes(field)) {
       const p = parseFloat(newForm.protein) || 0;
       const c = parseFloat(newForm.carbs) || 0;
       const f = parseFloat(newForm.fat) || 0;
       if (newForm.protein || newForm.carbs || newForm.fat) {
         newForm.kcal = (Math.round((p * 4 + c * 4 + f * 9) * 10) / 10).toString();
       } else {
         newForm.kcal = '';
       }
    }
    setManualForm(newForm);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOffResults([]);
      setHasSearched(false);
      setSelectedProduct(null);
      setQuantity(100);
      setActiveTab('ai');
      setSelectedMealIndex(mealIndex !== undefined && mealIndex !== null ? mealIndex : 0);
      setManualForm({ name: '', brand: '', kcal: '', protein: '', carbs: '', fat: '' });

      Promise.all([
        api.get('/nutrition/logs/recent'),
        api.get('/nutrition/my-foods')
      ])
        .then(([recentRes, savedRes]) => {
          setRecentLogs(recentRes.data || []);
          setSavedFoods(savedRes.data || []);
        })
        .catch(() => console.error('Error fetching modal data'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQueryChange = (val) => {
    setQuery(val);
    if (!val.trim()) {
      setOffResults([]);
      setHasSearched(false);
      return;
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setHasSearched(true);

    // Query Open Food Facts with fallback queries
    const queriesToTry = getSmartFallbackQueries(q);
    let allCleanProducts = [];

    try {
      for (const currentQ of queriesToTry) {
        const res = await fetch(`/api/food-external/search?q=${encodeURIComponent(currentQ)}`, { 
          headers: { 'Accept': 'application/json' } 
        });
        if (!res.ok) continue; // Skip to next query on error
        const data = await res.json();

        let products = [];
        if (data.product) products = [data.product];
        else if (data.products) products = data.products;

        const qWords = currentQ.toLowerCase().split(/\s+/).filter(Boolean);
        const cleanProducts = products.filter(p => {
          const name = (p.product_name || p.product_name_es || '').toLowerCase();
          if (!name) return false;
          return qWords.some(w => name.includes(w));
        });

        if (cleanProducts.length > 0) {
          allCleanProducts = cleanProducts;
          break; // Found results, stop trying fallbacks
        }
      }

      setOffResults(allCleanProducts);

      if (allCleanProducts.length === 0) {
        toast('No se encontraron resultados exactos', { icon: '' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al consultar FatSecret');
    } finally {
      setSearching(false);
    }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setActiveTab('manual'); // Switch immediately!
    toast('Analizando etiqueta con IA... (puedes ir poniendo el nombre)', { duration: 4000 });
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/nutrition/ai/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      
      // Merge into manualForm!
      setManualForm(prev => ({
        ...prev,
        name: prev.name || data.name || '',
        brand: prev.brand || data.brand || '',
        kcal: data.kcalPer100g ? data.kcalPer100g.toString() : prev.kcal,
        protein: data.proteinPer100g ? data.proteinPer100g.toString() : prev.protein,
        carbs: data.carbsPer100g ? data.carbsPer100g.toString() : prev.carbs,
        fat: data.fatPer100g ? data.fatPer100g.toString() : prev.fat
      }));
      
      toast.success('¡Macros extraídos correctamente!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al analizar la etiqueta.');
    } finally {
      setOcrLoading(false);
      e.target.value = null;
    }
  };

  const handleScanSuccess = async (decodedText) => {
    setActiveTab('search');
    setQuery(decodedText);
    setSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/food-external/barcode?code=${encodeURIComponent(decodedText)}`, { 
        headers: { 'Accept': 'application/json' } 
      });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setOffResults([data.product]);
          return;
        }
      }
      toast('Producto no encontrado por código de barras', { icon: '' });
      setOffResults([]);
    } catch (err) {
      console.error(err);
      toast.error('Error al consultar código de barras');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOff = (p) => {
    const name = p.product_name || p.product_name_es || 'Producto';
    const brand = p.brands ? ` - ${p.brands}` : '';
    const nut = p.nutriments || {};

    const portions = extractPortions(p);

    setSelectedProduct({
      name: `${name}${brand}`,
      category: 'Supermercado',
      kcal: getSanitizedKcal(nut),
      protein: Number(nut['proteins_100g'] ?? nut['proteins'] ?? 0) || 0,
      carbs: Number(nut['carbohydrates_100g'] ?? nut['carbohydrates'] ?? 0) || 0,
      fat: Number(nut['fat_100g'] ?? nut['fat'] ?? 0) || 0,
      portions: portions
    });
    
    if (portions.length > 0) {
      setQuantity(portions[0].amount);
    } else {
      setQuantity(100);
    }
  };

  const handleSelectRecent = (log) => {
    const q = Number(log.quantity) || 100;
    setSelectedProduct({
      name: log.product,
      category: 'Reciente',
      kcal: (Number(log.kcal) || 0) * (100 / q),
      protein: (Number(log.protein) || 0) * (100 / q),
      carbs: (Number(log.carbs) || 0) * (100 / q),
      fat: (Number(log.fat) || 0) * (100 / q)
    });
    setQuantity(Math.round(q));
  };

  const handleSelectSaved = (food) => {
    let portions = [];
    if (food.servingSize && food.servingSize > 0) {
      const lbl = food.servingLabel || 'ud';
      portions = [
        { label: `½ ${lbl}`, amount: food.servingSize / 2 },
        { label: `1 ${lbl}`, amount: food.servingSize },
        { label: `2 ${lbl}`, amount: food.servingSize * 2 },
        { label: `3 ${lbl}`, amount: food.servingSize * 3 },
        { label: `4 ${lbl}`, amount: food.servingSize * 4 }
      ];
    }

    setSelectedProduct({
      name: food.name + (food.brand ? ` (${food.brand})` : ''),
      category: 'Guardado',
      kcal: food.kcalPer100g,
      protein: food.proteinPer100g,
      carbs: food.carbsPer100g,
      fat: food.fatPer100g,
      portions: portions
    });
    
    if (food.servingSize && food.servingSize > 0) {
      setQuantity(food.servingSize);
    } else {
      setQuantity(100);
    }
  };

  const handleAiSubmit = async (e) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const payload: any = {
        text: "Calcula los macros aproximados de esta comida y dame 1 sola opción de plato genérico que lo represente con su nombre, kcal, y gramos de protes, grasas e hidratos. Formato corto y directo.",
        mealIndex: mealIndex,
        date: date
      };

      const res = await api.post('/nutrition/ai', payload);
      const data = res.data;
      handleSelectSaved(data);
      toast.success('¡Alimento analizado por IA!');
    } catch (err) {
      console.error(err);
      toast.error('Error al analizar con IA');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast.error('Indica una cantidad válida en gramos');
      return;
    }

    const qty = Number(quantity);
    const factor = qty / 100.0;
    const logEntry = {
      date: date,
      mealIndex: Number(selectedMealIndex) || 0,
      product: selectedProduct.name,
      quantity: qty,
      kcal: Math.round(((selectedProduct.kcal || 0) * factor) * 10) / 10,
      protein: Math.round(((selectedProduct.protein || 0) * factor) * 10) / 10,
      carbs: Math.round(((selectedProduct.carbs || 0) * factor) * 10) / 10,
      fat: Math.round(((selectedProduct.fat || 0) * factor) * 10) / 10
    };

    try {
      await api.post('/nutrition/logs', logEntry);
      toast.success('Alimento añadido correctamente');
      setSelectedProduct(null);
      setQuery('');
      setOffResults([]);
      onLogAdded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el alimento');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.name.trim()) {
      toast.error('El nombre del alimento es obligatorio');
      return;
    }

    const qty = Number(quantity) || 100;
    const factor = qty / 100.0;
    const kcalPer100 = Number(manualForm.kcal) || 0;
    const pPer100 = Number(manualForm.protein) || 0;
    const cPer100 = Number(manualForm.carbs) || 0;
    const fPer100 = Number(manualForm.fat) || 0;

    const productName = manualForm.name.trim() + (manualForm.brand.trim() ? ` (${manualForm.brand.trim()})` : '');

    const logEntry = {
      date: date,
      mealIndex: Number(selectedMealIndex) || 0,
      product: productName,
      quantity: qty,
      kcal: Math.round((kcalPer100 * factor) * 10) / 10,
      protein: Math.round((pPer100 * factor) * 10) / 10,
      carbs: Math.round((cPer100 * factor) * 10) / 10,
      fat: Math.round((fPer100 * factor) * 10) / 10
    };

    try {
      // 1. Guardar en el registro del día
      await api.post('/nutrition/logs', logEntry);
      
      // 2. Guardar también en "Mis Alimentos" para futuras búsquedas
      const myFoodDto = {
        name: manualForm.name.trim(),
        brand: manualForm.brand.trim() || '',
        kcalPer100g: kcalPer100,
        proteinPer100g: pPer100,
        carbsPer100g: cPer100,
        fatPer100g: fPer100,
        servingSize: null,
        servingLabel: null
      };
      await api.post('/nutrition/my-foods', myFoodDto).catch(() => console.warn('Ya existía o error al guardar en mis alimentos'));

      toast.success('Alimento guardado y añadido a tus alimentos');
      onLogAdded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el alimento');
    }
  };

  return (
    <>
      <div className="workout-sheet-overlay" onClick={onClose} />
      <div className="food-search-fullscreen">
        <div className="food-search-header">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                {selectedProduct ? 'Confirmar Porción' : 'Añadir Alimento'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Comida {selectedMealIndex + 1} - {date}
              </span>
            </div>
            <button className="workout-sheet-close" onClick={onClose}></button>
          </div>
        </div>
        <div className="food-search-body">

        {/* Mode Tabs */}
        {!selectedProduct && (
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', padding: '0.35rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.02)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }} className="mobile-scroll-x">
            {[{id:'search', icon:'', label:'Buscar'}, {id:'ai', icon:'', label:'IA'}, {id:'ocr', icon:'', label:'Etiqueta'}, {id:'scanner', icon:'', label:'Barras'}, {id:'manual', icon:'️', label:'Manual'}].map(t => (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{ flex: '1 0 auto', padding: '0.45rem 0.6rem', borderRadius: '10px', border: 'none', background: activeTab === t.id ? (t.id === 'ai' ? 'var(--gradient-protein-carbs, linear-gradient(90deg, #8b5cf6, #3b82f6))' : 'rgba(255, 255, 255, 0.12)') : 'transparent', color: activeTab === t.id ? 'white' : 'var(--text-secondary)', fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', boxShadow: activeTab === t.id ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset' : 'none', transform: activeTab === t.id ? 'scale(1)' : 'scale(0.98)' }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* VIEW 1: SELECT PRODUCT OR QUANTITY */}
        {selectedProduct ? (
          <div>
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1.25rem',
              border: '1px solid var(--border-color)' 
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {selectedProduct.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Valores por 100g: <strong>{Math.round(selectedProduct.kcal)} kcal</strong> | P: {selectedProduct.protein.toFixed(1)}g | C: {selectedProduct.carbs.toFixed(1)}g | G: {selectedProduct.fat.toFixed(1)}g
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Añadir a la comida:</label>
              <select 
                className="form-input" 
                value={selectedMealIndex} 
                onChange={(e) => setSelectedMealIndex(Number(e.target.value))}
                style={{ appearance: 'auto' }}
              >
                <option value={0}>Desayuno</option>
                <option value={1}>Comida</option>
                <option value={2}>Cena</option>
                <option value={3}>Snacks / Otros</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Cantidad consumida (gramos / ml)</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{quantity} g</span>
              </label>
              <input
                type="number"
                className="form-input"
                min="1"
                step="5"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                autoFocus
                style={{ fontSize: '1.1rem', padding: '0.6rem' }}
              />
              
              {/* Quick portion buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {selectedProduct.portions && selectedProduct.portions.length > 0 ? (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => setQuantity(100)}>
                      100g
                    </button>
                    {selectedProduct.portions.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '12px' }}
                        onClick={() => setQuantity(p.amount)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => setQuantity(50)}>50g</button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => setQuantity(100)}>100g</button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => setQuantity(150)}>150g</button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => setQuantity(200)}>200g</button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.5rem 0', fontSize: '0.9rem', borderRadius: '12px' }} onClick={() => setQuantity(250)}>250g</button>
                  </>
                )}
              </div>
            </div>

            {/* Calculated Macros Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: '0.5rem', 
              marginBottom: '1.5rem', 
              textAlign: 'center' 
            }}>
              <div className="card" style={{ padding: '0.6rem 0.4rem', background: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Calorías</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning)' }}>
                  {Math.round((selectedProduct.kcal || 0) * ((Number(quantity) || 0) / 100))}
                  <span style={{ fontSize: '0.7rem', fontWeight: 400, marginLeft: 2 }}>kcal</span>
                </div>
              </div>
              <div className="card" style={{ padding: '0.6rem 0.4rem', background: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-protein)', marginBottom: '0.2rem' }}>Proteínas</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-protein)' }}>
                  {(((selectedProduct.protein || 0) * ((Number(quantity) || 0) / 100))).toFixed(1)}g
                </div>
              </div>
              <div className="card" style={{ padding: '0.6rem 0.4rem', background: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-carbs)', marginBottom: '0.2rem' }}>Hidratos</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-carbs)' }}>
                  {(((selectedProduct.carbs || 0) * ((Number(quantity) || 0) / 100))).toFixed(1)}g
                </div>
              </div>
              <div className="card" style={{ padding: '0.6rem 0.4rem', background: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-fat)', marginBottom: '0.2rem' }}>Grasas</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-fat)' }}>
                  {(((selectedProduct.fat || 0) * ((Number(quantity) || 0) / 100))).toFixed(1)}g
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedProduct(null)}
              >
                ← Volver
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmAdd}
                style={{ minWidth: '140px' }}
              >
                Añadir Alimento
              </button>
            </div>
          </div>
        ) : activeTab === 'manual' ? (
          /* VIEW 2: MANUAL ENTRY */
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre del alimento <span style={{color: 'red'}}>*</span></label>
              <input
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
                <label className="form-label">Porción consumida (g)</label>
                <input
                  type="number"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Calorías (por 100g)</label>
                <input
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
                <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-color)', borderRadius: '10px', color: 'var(--accent-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'var(--accent-color) transparent var(--accent-color) transparent' }}></div>
                  Extrayendo macros de la etiqueta...
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem', opacity: ocrLoading ? 0.5 : 1, pointerEvents: ocrLoading ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-protein)', fontSize: '0.8rem' }}>Proteína (g/100g)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="0.0"
                  value={manualForm.protein}
                  onChange={(e) => updateManualForm('protein', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-carbs)', fontSize: '0.8rem' }}>Hidratos (g/100g)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="0.0"
                  value={manualForm.carbs}
                  onChange={(e) => updateManualForm('carbs', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--color-fat)', fontSize: '0.8rem' }}>Grasas (g/100g)</label>
                <input
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
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar Alimento</button>
            </div>
          </form>
        ) : activeTab === 'ai' ? (
          /* VIEW: AI ASSISTANT */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div className="form-group" style={{ position: 'relative' }}>
              <textarea
                className="form-input"
                style={{ 
                  minHeight: '130px', 
                  resize: 'vertical', 
                  paddingRight: '3.2rem',
                  borderColor: isListening ? '#ef4444' : undefined,
                  boxShadow: isListening ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined,
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                placeholder="Ej: Desayuné 2 tostadas y café. Para comer 200g de arroz con pollo (puedes especificar marcas, ej: yogur mercadona)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />

              {/* IMAGE PREVIEW */}
              {selectedImage && (
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 3 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={selectedImage} alt="Preview" style={{ height: '40px', borderRadius: '6px', border: '1px solid var(--border-medium)', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      style={{
                        position: 'absolute', top: '-5px', right: '-5px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)',
                        borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', cursor: 'pointer'
                      }}
                    >
                      
                    </button>
                  </div>
                </div>
              )}

              <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', display: 'flex', gap: '0.4rem', zIndex: 2 }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleImageChange} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    transition: 'all 0.2s ease',
                  }}
                  title="Adjuntar foto"
                >
                  
                </button>
                <button 
                  type="button"
                  className={isListening ? 'recording-pulse-btn' : ''}
                  onClick={() => toggleListening(query)}
                  style={{
                    background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                    border: isListening ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isListening ? '#ef4444' : 'var(--text-primary)',
                    fontSize: '1.1rem',
                    transition: 'all 0.2s ease',
                  }}
                  title={isListening ? 'Detener dictado (Pulsar para parar)' : 'Dictar por voz (Habla a tu ritmo)'}
                >
                  {isListening ? '⏹️' : ''}
                </button>
              </div>
            </div>

            {isListening && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                marginTop: '-0.35rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="recording-dot" />
                  <span><strong>Escuchando...</strong> Habla con calma a tu ritmo con pausas. Pulsa ⏹️ cuando termines.</span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Listo
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Destino de las comidas:</label>
              <select 
                className="form-input" 
                value={selectedMealIndex} 
                onChange={(e) => setSelectedMealIndex(Number(e.target.value))}
              >
                <option value={-1}> Detectar automáticamente / Todo el día</option>
                {meals && meals.length > 0 ? (
                  meals.map((m, idx) => (
                    <option key={m.id || idx} value={idx}>
                      {m.name || `Comida ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={0}>Desayuno</option>
                    <option value={1}>Comida</option>
                    <option value={2}>Cena</option>
                    <option value={3}>Snacks / Otros</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab('search')} disabled={searching}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (!query.trim() && !selectedImage) return toast.error('Escribe algo o adjunta una foto primero');
                  stopListening();
                  const queryText = query.trim();
                  toast(` Procesando con IA...`, { duration: 2500 });
                  setQuery('');
                  
                  const payload: any = { text: queryText, mealIndex: selectedMealIndex, date };
                  if (selectedImage) {
                    payload.base64Image = selectedImage;
                  }
                  
                  setSelectedImage(null);
                  onClose();

                  // Fire-and-forget: don't block the UI
                  api.post('/nutrition/ai/log', payload)
                    .then((res) => {
                      const count = Array.isArray(res.data) ? res.data.length : 1;
                      if (selectedMealIndex === -1) {
                        toast.success(`¡${count} alimento(s) repartidos en tus comidas por IA! `);
                      } else {
                        toast.success(`¡${count} alimento(s) añadidos por IA! `);
                      }
                      onLogAdded();
                    })
                    .catch((e) => {
                      const msg = e.response?.data?.error || 'Error procesando texto con IA';
                      toast.error(msg);
                      console.error(e);
                    });
                }}
                disabled={searching || !query.trim()}
                style={{ background: 'var(--gradient-protein-carbs, linear-gradient(90deg, #8b5cf6, #3b82f6))', border: 'none' }}
              >
                {searching ? 'Procesando...' : 'Analizar y Añadir'}
              </button>
            </div>
          </div>
        ) : activeTab === 'ocr' ? (
          /* VIEW: OCR / PHOTO */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}></div>
            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Escanear Etiqueta Nutricional</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
              Haz una foto de la tabla nutricional de cualquier alimento para extraer sus macros automáticamente con IA.
            </p>
            
            <div style={{ marginTop: '1rem', position: 'relative' }}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOcrUpload}
                disabled={ocrLoading}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <button 
                className="btn btn-primary" 
                disabled={ocrLoading}
                style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', background: 'var(--gradient-protein-carbs, linear-gradient(90deg, #8b5cf6, #3b82f6))', border: 'none' }}
              >
                {ocrLoading ? 'Procesando...' : 'Hacer Foto'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab('search')}>Cancelar</button>
            </div>
          </div>
        ) : activeTab === 'scanner' ? (
          /* VIEW: SCANNER */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={(err: any) => console.error(err)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab('search')}>Cancelar</button>
            </div>
          </div>
        ) : (
          /* VIEW 3: SEARCH */
          <div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="search"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                className="form-input"
                placeholder="Busca manzana, pollo, huevo, arroz o marca..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={searching} style={{ minWidth: '90px' }}>
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* SECTION: OPEN FOOD FACTS (Branded / Supermarket products) */}
              {offResults.length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    color: 'var(--color-carbs)', 
                    marginBottom: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <span></span> Supermercados y Marcas ({offResults.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {offResults.map((p, idx) => {
                      const name = p.product_name || p.product_name_es || 'Producto';
                      const brand = p.brands || '';
                      const rawNut = p.nutriments || {};
                      const kcal = getSanitizedKcal(rawNut);
                      const prot = (Number(rawNut['proteins_100g'] ?? rawNut['proteins'] ?? 0) || 0).toFixed(1);
                      const carb = (Number(rawNut['carbohydrates_100g'] ?? rawNut['carbohydrates'] ?? 0) || 0).toFixed(1);
                      const fat = (Number(rawNut['fat_100g'] ?? rawNut['fat'] ?? 0) || 0).toFixed(1);

                      return (
                        <div
                          key={p.code || idx}
                          className="card"
                          style={{
                            padding: '0.65rem 0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                            borderLeft: '4px solid var(--color-carbs)'
                          }}
                          onClick={() => handleSelectOff(p)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {name} {brand && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>- {brand}</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              100g: <strong>{kcal} kcal</strong> | P: {prot}g | C: {carb}g | G: {fat}g
                            </div>
                          </div>
                          <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-carbs)' }}>
                            Marca
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SAVED FOODS AND RECENT LOGS (Filtered) */}
              {(() => {
                const qLower = query.trim().toLowerCase();
                const filteredSaved = savedFoods.filter(f => !qLower || f.name.toLowerCase().includes(qLower) || (f.brand && f.brand.toLowerCase().includes(qLower)));
                const filteredRecent = recentLogs.filter(l => !qLower || l.product.toLowerCase().includes(qLower));
                
                return (
                  <>
                    {/* SAVED FOODS */}
                    {filteredSaved.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                         Mis Alimentos Guardados
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {filteredSaved.map((food) => (
                          <div
                            key={food.id}
                            className="card"
                            style={{
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(59, 130, 246, 0.05)',
                              border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}
                            onClick={() => handleSelectSaved(food)}
                          >
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                                {food.name} {food.brand && <span style={{ opacity: 0.7, fontSize: '0.85rem' }}>({food.brand})</span>}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {food.kcalPer100g} kcal / 100g
                                {food.servingSize && food.servingSize > 0 && (
                                  <span style={{ marginLeft: '0.5rem', color: 'var(--color-success)' }}>
                                    [{food.servingSize}g / {food.servingLabel || 'ud'}]
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-[var(--color-carbs)] bg-[var(--color-carbs-bg)] px-1.5 py-1 rounded-sm">
                              Guardado
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RECENT LOGS */}
                  {filteredRecent.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                         Últimos Alimentos Añadidos
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {filteredRecent.map((log) => {
                          const q = Number(log.quantity) || 100;
                          const kcal100 = Math.round((Number(log.kcal) || 0) * (100 / q));
                          return (
                            <div
                              key={log.id}
                              className="card"
                              style={{
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onClick={() => handleSelectRecent(log)}
                            >
                              <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{log.product}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {kcal100} kcal / 100g
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </>
                );
              })()}

              {/* Fallback manual create prompt if searched and basic + off results empty */}
              {hasSearched && offResults.length === 0 && !searching && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1.5rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '12px',
                  marginTop: '0.5rem' 
                }}>
                  <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)' }}>
                    ¿No encuentras el producto exacto?
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setManualForm(prev => ({ ...prev, name: query }));
                      setActiveTab('manual');
                    }}
                  >
                    ️ Crear "{query}" como entrada manual
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
}
