import { useState, useEffect, useRef, FormEvent, ChangeEvent, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useSpeechToText } from '../hooks/useSpeechToText';

import { normalizeString } from '../lib/workout/format';
import { getSanitizedKcal, extractPortions } from '../utils/portionHelper';
import { getSmartFallbackQueries } from '../utils/searchHelper';
const BarcodeScanner = lazy(() => import('./BarcodeScanner'));
import ManualFoodForm from './food/ManualFoodForm';
import { FoodPortionEditor, SearchProduct } from './food/FoodPortionEditor';
import { FoodSearchResultsList, SavedFoodExtended } from './food/FoodSearchResultsList';

import { Mic, ImageIcon, X, ScanLine, ArrowLeft } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { FoodListsData, FoodLog, Meal, Recipe } from '../types/api';

export type { SavedFoodExtended, SearchProduct };

export default function FoodSearchModal({
  isOpen,
  onClose,
  mealIndex,
  date,
  onLogAdded,
  meals = [],
  onCustomAdd,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  mealIndex?: number;
  date?: string;
  onLogAdded?: () => void;
  meals?: Meal[];
  onCustomAdd?: (foodObj: Partial<FoodLog>) => void;
}) {
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'scanner' | 'ai' | 'manual'>('none');
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [offResults, setOffResults] = useState<Array<Record<string, unknown>>>([]);
  const { data: foodLists } = useQuery<FoodListsData, Error>({
    queryKey: ['foodLists'],
    enabled: !!isOpen,
    queryFn: async () => {
      const [recentRes, savedRes, recipesRes] = await Promise.all([
        api.get('/nutrition/logs/recent').catch(() => ({ data: [] })),
        api.get('/nutrition/my-foods').catch(() => ({ data: [] })),
        api.get('/nutrition/recipes').catch(() => ({ data: [] })),
      ]);
      return { recent: recentRes.data, saved: savedRes.data, recipes: recipesRes.data };
    },
  });
  const recentLogs = foodLists?.recent || [];
  const mappedRecipes = (foodLists?.recipes || []).map((r: Recipe) => ({
    ...r,
    brand: 'Receta',
    kcalPer100g: r.totalKcal, // Treat 1 serving of recipe as 100 "units" for calculation simplicity, or we can just say 1 portion = 1 "ud" = 1 serving. Let's make servingSize = 100, kcal = totalKcal.
    servingSize: 100,
    servingLabel: 'racion',
    kcal: r.totalKcal,
    protein: r.totalProtein,
    carbs: r.totalCarbs,
    fat: r.totalFat,
    isRecipe: true,
  }));
  const savedFoods = [...(foodLists?.saved || []), ...mappedRecipes];
  // const [searching, setSearching] = useState(false);
  // const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [inputMode, setInputMode] = useState<'grams' | 'portions'>('grams');
  const [selectedMealIndex, setSelectedMealIndex] = useState(
    mealIndex !== undefined && mealIndex !== null ? mealIndex : 0,
  );
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    if (selectedProduct && selectedProduct.portions && selectedProduct.portions.length > 0) {
      setInputMode('portions');
    } else {
      setInputMode('grams');
    }
  }, [selectedProduct?.name]);

  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: (text) => setQuery(text),
    lang: 'es-ES',
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
    name: '',
    brand: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const updateManualForm = (field: string, value: string) => {
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

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setSelectedProduct(null);
      setQuantity(100);
      setActiveOverlay('none');
      setSelectedMealIndex(mealIndex !== undefined && mealIndex !== null ? mealIndex : 0);
      setManualForm({ name: '', brand: '', kcal: '', protein: '', carbs: '', fat: '' });
    }
  }, [isOpen]);

  const searchRequestId = useRef(0);

  if (!isOpen) return null;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setOffResults([]);
      return;
    }
  };

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;

    searchRequestId.current += 1;
    const currentRequestId = searchRequestId.current;

    const queriesToTry = getSmartFallbackQueries(q);
    let allCleanProducts: Array<Record<string, unknown>> = [];

    try {
      for (const currentQ of queriesToTry) {
        if (currentRequestId !== searchRequestId.current) return;
        let data: Record<string, unknown>;
        try {
          const res = await api.get(`/food-external/search?q=${encodeURIComponent(currentQ)}`);
          data = res.data;
        } catch {
          continue;
        }
        if (currentRequestId !== searchRequestId.current) return;

        let products: Array<Record<string, unknown>> = [];
        if (data.product) products = [data.product as Record<string, unknown>];
        else if (data.products) products = data.products as Array<Record<string, unknown>>;

        const qWords = normalizeString(currentQ).split(/\s+/).filter(Boolean);
        const cleanProducts = products
          .filter((p) => {
            const name = normalizeString((p.product_name || p.product_name_es || '') as string);
            if (!name) return false;
            return qWords.some((w: string) => name.includes(normalizeString(w)));
          })
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const nameA = normalizeString((a.product_name || a.product_name_es || '') as string);
            const nameB = normalizeString((b.product_name || b.product_name_es || '') as string);
            return nameA.length - nameB.length;
          });

        if (cleanProducts.length > 0) {
          allCleanProducts = cleanProducts;
          break;
        }
      }

      if (currentRequestId !== searchRequestId.current) return;

      setOffResults(allCleanProducts);

      if (allCleanProducts.length === 0) {
        toast('No se encontraron resultados exactos', { icon: 'ℹ️' });
      }
    } catch (err) {
      if (currentRequestId !== searchRequestId.current) return;
      console.error(err);
      toast.error('Error al consultar base de datos');
    } finally {
      /* ignore */
      if (currentRequestId === searchRequestId.current) {
        /* ignore */
      } /* ignore */
    }
  };

  const handleOcrUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setActiveOverlay('manual');
    toast('Analizando etiqueta con IA... (puedes ir poniendo el nombre)', { duration: 4000 });

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/nutrition/ai/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;

      setManualForm((prev) => ({
        ...prev,
        name: prev.name || data.name || '',
        brand: prev.brand || data.brand || '',
        kcal: data.kcalPer100g ? data.kcalPer100g.toString() : prev.kcal,
        protein: data.proteinPer100g ? data.proteinPer100g.toString() : prev.protein,
        carbs: data.carbsPer100g ? data.carbsPer100g.toString() : prev.carbs,
        fat: data.fatPer100g ? data.fatPer100g.toString() : prev.fat,
      }));

      toast.success('¡Macros extraídos correctamente!');
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Error al analizar la etiqueta.',
      );
    } finally {
      /* ignore */
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setActiveOverlay('none');
    setQuery(decodedText);

    try {
      const res = await api.get(`/food-external/barcode?code=${encodeURIComponent(decodedText)}`);
      if (res.data) {
        const data = res.data;
        if (data.product) {
          const offName = data.product.product_name || data.product.product_name_es || '';
          const offBrand = data.product.brands || '';

          const savedMatch = (savedFoods as SavedFoodExtended[]).find((sf: SavedFoodExtended) => {
            const sfName = sf.name || '';
            const n1 = sfName.toLowerCase();
            const n2 = offName.toLowerCase();
            const n3 = `${offName} - ${offBrand}`.toLowerCase();
            return n1 === n2 || n1 === n3 || n1.includes(n2);
          });

          if (savedMatch && savedMatch.id && !savedMatch.isRecipe) {
            handleSelectSaved(savedMatch);
          } else {
            setOffResults([data.product]);
          }
          return;
        }
      }
      toast('Producto no encontrado por código de barras', { icon: '🤔' });
      setOffResults([]);
    } catch (err) {
      console.error(err);
      toast.error('Error al consultar código de barras');
    } finally {
      /* ignore */
    }
  };

  const handleSelectOff = (p: Record<string, unknown>) => {
    const name = (p.product_name || p.product_name_es || 'Producto') as string;
    const brand = p.brands ? ` - ${p.brands}` : '';
    const nut = (p.nutriments || {}) as Record<string, unknown>;

    const portions = extractPortions(p);

    setSelectedProduct({
      name: `${name}${brand}`,
      category: 'Supermercado',
      kcal: getSanitizedKcal(nut),
      protein: Number(nut['proteins_100g'] ?? nut['proteins'] ?? 0) || 0,
      carbs: Number(nut['carbohydrates_100g'] ?? nut['carbohydrates'] ?? 0) || 0,
      fat: Number(nut['fat_100g'] ?? nut['fat'] ?? 0) || 0,
      portions: portions,
    });

    if (portions.length > 0) {
      setQuantity(portions[0].amount);
    } else {
      setQuantity(100);
    }
  };

  const handleSelectRecent = (log: FoodLog) => {
    const q = Number(log.quantity) || 100;
    setSelectedProduct({
      name: log.product,
      category: 'Reciente',
      kcal: (Number(log.kcal) || 0) * (100 / q),
      protein: (Number(log.protein) || 0) * (100 / q),
      carbs: (Number(log.carbs) || 0) * (100 / q),
      fat: (Number(log.fat) || 0) * (100 / q),
    });
    setQuantity(Math.round(q));
  };

  const handleSelectSaved = (food: SavedFoodExtended & { image?: string }) => {
    let portions: Array<{ label: string; amount: number }> = [];
    if (food.servingSize && food.servingSize > 0) {
      const lbl = food.servingLabel || 'ud';
      if (lbl.toLowerCase() === 'g') {
        portions = [
          { label: '50g', amount: 50 },
          { label: '100g', amount: 100 },
          { label: '150g', amount: 150 },
          { label: '200g', amount: 200 },
          { label: '250g', amount: 250 },
        ];
      } else {
        if (food.servingSize <= 15) {
          portions = [
            { label: `1 ${lbl}`, amount: food.servingSize },
            { label: `2 ${lbl}`, amount: food.servingSize * 2 },
            { label: `3 ${lbl}`, amount: food.servingSize * 3 },
            { label: `5 ${lbl}`, amount: food.servingSize * 5 },
            { label: `10 ${lbl}`, amount: food.servingSize * 10 },
            { label: `15 ${lbl}`, amount: food.servingSize * 15 },
          ];
        } else if (food.servingSize <= 50) {
          portions = [
            { label: `1 ${lbl}`, amount: food.servingSize },
            { label: `2 ${lbl}`, amount: food.servingSize * 2 },
            { label: `3 ${lbl}`, amount: food.servingSize * 3 },
            { label: `4 ${lbl}`, amount: food.servingSize * 4 },
            { label: `5 ${lbl}`, amount: food.servingSize * 5 },
          ];
        } else {
          portions = [
            { label: `0.5 ${lbl}`, amount: food.servingSize / 2 },
            { label: `1 ${lbl}`, amount: food.servingSize },
            { label: `2 ${lbl}`, amount: food.servingSize * 2 },
            { label: `3 ${lbl}`, amount: food.servingSize * 3 },
            { label: `4 ${lbl}`, amount: food.servingSize * 4 },
          ];
        }
      }
    }

    setSelectedProduct({
      name: food.name + (food.brand && food.brand !== 'Genérico' ? ` (${food.brand})` : ''),
      category: food.brand === 'Genérico' ? 'Básico' : 'Guardado',
      kcal: food.kcalPer100g ?? food.kcal ?? 0,
      protein: food.proteinPer100g ?? food.protein ?? 0,
      carbs: food.carbsPer100g ?? food.carbs ?? 0,
      fat: food.fatPer100g ?? food.fat ?? 0,
      portions: portions,
    });

    if (food.servingSize && food.servingSize > 0) {
      setQuantity(food.servingSize);
    } else {
      setQuantity(100);
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
      kcal: Math.round((selectedProduct.kcal || 0) * factor * 10) / 10,
      protein: Math.round((selectedProduct.protein || 0) * factor * 10) / 10,
      carbs: Math.round((selectedProduct.carbs || 0) * factor * 10) / 10,
      fat: Math.round((selectedProduct.fat || 0) * factor * 10) / 10,
      portionsJson:
        selectedProduct.portions && selectedProduct.portions.length > 0
          ? JSON.stringify(selectedProduct.portions)
          : undefined,
    };

    if (onCustomAdd) {
      onCustomAdd(logEntry);
      if (onClose) onClose();
      return;
    }

    try {
      await api.post('/nutrition/logs', logEntry);
      toast.success('Alimento añadido correctamente');
      setSelectedProduct(null);
      setQuery('');
      setOffResults([]);
      if (onLogAdded) onLogAdded();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el alimento');
    }
  };

  const submitAiPrompt = async () => {
    if (!query.trim() && !selectedImage)
      return toast.error('Escribe algo o adjunta una foto primero');
    stopListening();
    const queryText = query.trim();
    toast(` Procesando con IA...`, { duration: 2500 });
    setQuery('');

    const payload: Record<string, unknown> = {
      text: queryText,
      mealIndex: selectedMealIndex,
      date,
    };
    if (selectedImage) {
      const rawImage = typeof selectedImage === 'string' ? selectedImage : '';
      const cleanBase64 = rawImage.includes(',') ? rawImage.split(',')[1] : rawImage;
      payload.base64Image = cleanBase64;
    }

    setSelectedImage(null);
    if (onClose) onClose();

    api
      .post('/nutrition/ai/log', payload)
      .then((res) => {
        const count = Array.isArray(res.data) ? res.data.length : 1;
        if (selectedMealIndex === -1) {
          toast.success(`¡${count} alimento(s) repartidos en tus comidas por IA!`);
        } else {
          toast.success(`¡${count} alimento(s) añadidos por IA!`);
        }
        if (onLogAdded) onLogAdded();
      })
      .catch((e: unknown) => {
        const msg =
          (e as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Error procesando texto con IA';
        toast.error(msg);
        console.error(e);
      });
  };

  return (
    <>
      <div className="workout-sheet-overlay" onClick={onClose} />
      <div
        className="food-search-fullscreen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-search-title"
      >
        <div className="food-search-header">
          {selectedProduct || activeOverlay !== 'none' ? (
            <button
              className="icon-btn"
              onClick={() => {
                setSelectedProduct(null);
                setActiveOverlay('none');
              }}
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button className="icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}

          <div id="food-search-title" style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
            {selectedProduct
              ? 'Añadir Registro'
              : activeOverlay === 'scanner'
                ? 'Escanear Código'
                : activeOverlay === 'ai'
                  ? 'Asistente IA'
                  : activeOverlay === 'manual'
                    ? 'Crear Manual'
                    : 'Buscar Alimento'}
          </div>
          <div style={{ width: 36 }}></div>
        </div>

        <div className="food-search-body fade-in">
          {selectedProduct ? (
            /* VIEW 1: PORTION SELECTION */
            <FoodPortionEditor
              selectedProduct={selectedProduct}
              quantity={quantity}
              setQuantity={setQuantity}
              inputMode={inputMode}
              setInputMode={setInputMode}
              onConfirmAdd={handleConfirmAdd}
            />
          ) : activeOverlay === 'manual' ? (
            /* VIEW: MANUAL ENTRY */
            <ManualFoodForm
              manualForm={manualForm}
              updateManualForm={updateManualForm}
              quantity={quantity}
              setQuantity={setQuantity}
              ocrLoading={ocrLoading}
              date={date}
              selectedMealIndex={selectedMealIndex}
              onLogAdded={onLogAdded}
              onCustomAdd={onCustomAdd}
              onClose={() => {
                setActiveOverlay('none');
                if (onCustomAdd && onClose) onClose();
              }}
            />
          ) : activeOverlay === 'scanner' ? (
            /* VIEW: SCANNER */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Suspense
                fallback={
                  <Skeleton className="w-full h-64 rounded-lg flex flex-col items-center justify-center border border-border">
                    <div className="w-12 h-12 border-4 border-muted-foreground/30 rounded-full border-t-muted-foreground animate-spin mb-4"></div>
                    <span className="text-muted-foreground text-sm">Iniciando cámara...</span>
                  </Skeleton>
                }
              >
                <BarcodeScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={(err: string) => console.error(err)}
                />
              </Suspense>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setActiveOverlay('none')}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : activeOverlay === 'ai' ? (
            /* VIEW: AI ASSISTANT */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Ej: 'Me he comido una hamburguesa con queso y patatas fritas' o '150g de pechuga de pollo y 200g de arroz'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ resize: 'none', paddingBottom: '3rem' }}
                  autoFocus
                />

                {/* IMAGE PREVIEW */}
                {selectedImage && (
                  <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 3 }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={selectedImage as string}
                        alt="Preview"
                        style={{
                          height: '40px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-medium)',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    position: 'absolute',
                    bottom: '0.6rem',
                    right: '0.6rem',
                    display: 'flex',
                    gap: '0.4rem',
                    zIndex: 2,
                  }}
                >
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
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                    }}
                    title="Adjuntar foto"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className={isListening ? 'recording-pulse-btn' : ''}
                    onClick={() => toggleListening(query)}
                    style={{
                      background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                      border: isListening ? '1px solid #ef4444' : '1px solid var(--border-color)',
                      borderRadius: '50%',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isListening ? '#ef4444' : 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Mic size={16} color={isListening ? '#ef4444' : undefined} />
                  </button>
                </div>
              </div>

              {isListening && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    marginTop: '-0.35rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="recording-dot" />
                    <span>
                      <strong>Escuchando...</strong> Habla con calma a tu ritmo.
                    </span>
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
                      cursor: 'pointer',
                    }}
                  >
                    Listo
                  </button>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                }}
              >
                <button className="btn btn-secondary" onClick={() => setActiveOverlay('none')}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={submitAiPrompt}
                  disabled={!query.trim() && !selectedImage}
                  style={{
                    background:
                      'var(--gradient-protein-carbs, linear-gradient(90deg, #8b5cf6, #3b82f6))',
                    border: 'none',
                  }}
                >
                  Analizar y Añadir
                </button>
              </div>
            </div>
          ) : (
            /* VIEW: UNIFIED SEARCH & SHORTCUTS */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '1rem' }}>
                <select
                  className="form-input"
                  value={selectedMealIndex}
                  onChange={(e) => setSelectedMealIndex(Number(e.target.value))}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.9rem',
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value={-1}> Detectar automáticamente (IA)</option>
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

              {/* SEARCH BAR WITH ICONS */}
              <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '1rem' }}>
                <input
                  type="search"
                  enterKeyHint="search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="form-input"
                  placeholder="Busca comida, marca..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  style={{
                    paddingRight: '120px',
                    paddingLeft: '1rem',
                    height: '50px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: '0.25rem',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleOcrUpload}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                    title="Etiqueta Nutricional (OCR)"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOverlay('scanner')}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                    title="Código de barras"
                  >
                    <ScanLine size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOverlay('ai')}
                    style={{
                      background:
                        'var(--gradient-protein-carbs, linear-gradient(90deg, #8b5cf6, #3b82f6))',
                      border: 'none',
                      borderRadius: '8px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    title="Asistente de IA"
                  >
                    <Mic size={18} />
                  </button>
                </div>
              </form>

              {/* RESULTS AREA */}
              <FoodSearchResultsList
                query={query}
                savedFoods={savedFoods}
                recentLogs={recentLogs}
                offResults={offResults}
                onSelectRecent={handleSelectRecent}
                onSelectSaved={handleSelectSaved}
                onSelectOff={handleSelectOff}
                onOpenManual={() => {
                  setManualForm((prev) => ({ ...prev, name: query }));
                  setActiveOverlay('manual');
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
