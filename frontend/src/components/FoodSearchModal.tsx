import { FoodSearchHeader } from './food/FoodSearchHeader';
import { ModalFrame } from './ui/ModalFrame';
import { QueryErrorNotice } from './QueryErrorNotice';
import { useFoodSearchLists } from '../hooks/food/useFoodSearchLists';
import { updateManualFoodForm } from '../utils/manualFoodForm';
import { findSavedFoodForScan } from '../utils/scannedFood';
import { getSanitizedKcal } from '../utils/portionHelper';
import { useFoodAiEntry } from '../hooks/food/useFoodAiEntry';
import { useState, useRef, useEffect, useEffectEvent, ChangeEvent, Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { shrinkAiImage } from '../utils/aiImage';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useSpeechToText } from '../hooks/useSpeechToText';

import { useExternalFoodSearch } from '../hooks/food/useExternalFoodSearch';
import { AiFoodAssistantView } from './food/AiFoodAssistantView';
import { useFoodSelection } from '../hooks/food/useFoodSelection';
import { Select } from '@/components/ui/select';
const BarcodeScanner = lazyWithRetry(() => import('./BarcodeScanner'));
import ManualFoodForm from './food/ManualFoodForm';
import { FoodPortionEditor } from './food/FoodPortionEditor';
import { FoodSearchResultsList, SavedFoodExtended } from './food/FoodSearchResultsList';

import { Camera, Mic, ImageIcon, ScanLine } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { FoodLog, Meal } from '../types/api';

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
  const [offResults, setOffResults] = useState<Array<Record<string, unknown>>>([]);
  const { recentLogs, savedFoods, isError, isFetching, refetch } = useFoodSearchLists(isOpen);
  const {
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    inputMode,
    setInputMode,
    handleSelectOff,
    handleSelectRecent,
    handleSelectSaved,
  } = useFoodSelection();
  const [selectedMealIndex, setSelectedMealIndex] = useState(mealIndex ?? 0);
  const [selectedMealKey, setSelectedMealKey] = useState(meals[mealIndex ?? 0]?.mealKey);
  const syncMealIdentity = useEffectEvent(() => setSelectedMealKey(meals[mealIndex ?? 0]?.mealKey));
  const selectMeal = (index: number) => {
    setSelectedMealIndex(index);
    setSelectedMealKey(meals[index]?.mealKey);
  };
  const displayedMealIndex = selectedMealKey
    ? meals.findIndex((meal) => meal.mealKey === selectedMealKey)
    : selectedMealIndex;
  const addingRef = useRef(false);
  const [adding, setAdding] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const dishPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: (text) => setQuery(text),
    lang: 'es-ES',
  });

  const {
    selectedImage,
    setSelectedImage,
    fileInputRef,
    handleImageChange,
    aiSubmitting,
    aiElapsedSeconds,
    getAiStatusText,
    submitAiPrompt,
  } = useFoodAiEntry({
    query,
    setQuery,
    selectedMealIndex,
    selectedMealKey,
    date,
    stopListening,
    onLogAdded,
    onClose,
  });

  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  useEffect(() => {
    if (mealIndex !== undefined && mealIndex !== null) {
      setSelectedMealIndex(mealIndex);
      syncMealIdentity();
    }
  }, [mealIndex]);

  const [manualForm, setManualForm] = useState({
    name: '',
    brand: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const updateManualForm = (field: string, value: string) =>
    setManualForm((previous) => updateManualFoodForm(previous, field, value));

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
      syncMealIdentity();
      setManualForm({ name: '', brand: '', kcal: '', protein: '', carbs: '', fat: '' });
    }
  }, [isOpen, mealIndex, setSelectedProduct, setQuantity, setSelectedImage, fileInputRef]);

  const handleSearch = useExternalFoodSearch(query, setOffResults);

  if (!isOpen) return null;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setOffResults([]);
      return;
    }
  };

  const handleOcrUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setActiveOverlay('manual');
    toast('Analizando etiqueta con IA... (puedes ir poniendo el nombre)', { duration: 4000 });

    try {
      const image = await shrinkAiImage(file);
      if (!image) return;
      const formData = new FormData();
      formData.append('image', image, file.name);

      const res = await api.post('/nutrition/ai/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
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
      console.error(
        'Error al analizar etiqueta OCR:',
        err instanceof Error ? err.message : String(err),
      );
      toast.error(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Error al analizar la etiqueta.',
      );
    } finally {
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
          const offName = String(
            data.product.product_name || data.product.product_name_es || '',
          ).trim();
          const offBrand = String(data.product.brands || '');

          // Without a name nothing can be told apart from another food: the user names it.
          if (!offName) {
            const nutriments = (data.product.nutriments || {}) as Record<string, unknown>;
            const per100 = (key: string) =>
              Number(nutriments[`${key}_100g`] ?? nutriments[key] ?? 0) || 0;
            const text = (value: number) => (value > 0 ? String(value) : '');
            setOffResults([]);
            setManualForm({
              name: '',
              brand: offBrand,
              kcal: text(getSanitizedKcal(nutriments)),
              protein: text(per100('proteins')),
              carbs: text(per100('carbohydrates')),
              fat: text(per100('fat')),
            });
            setActiveOverlay('manual');
            toast(
              `El producto ${decodedText} no tiene nombre en Open Food Facts. Ponle uno para guardarlo.`,
            );
            return;
          }

          const savedMatch = findSavedFoodForScan(
            savedFoods as SavedFoodExtended[],
            offName,
            offBrand,
          );
          if (savedMatch) {
            handleSelectSaved(savedMatch);
          } else {
            setOffResults([data.product]);
          }
          return;
        }
      }
      toast('Producto no encontrado por código de barras');
      setOffResults([]);
    } catch (err) {
      console.error(
        'Error al consultar código de barras:',
        err instanceof Error ? err.message : String(err),
      );
      toast.error('Error al consultar código de barras');
    }
  };

  const handleConfirmAdd = async () => {
    if (addingRef.current) return;
    if (!selectedProduct || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Indica una cantidad válida en gramos');
      return;
    }

    const qty = Number(quantity);
    const factor = qty / 100.0;
    const logEntry = {
      date: date,
      mealIndex: Number(selectedMealIndex) || 0,
      mealKey: selectedMealKey,
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

    addingRef.current = true;
    setAdding(true);
    try {
      await api.post('/nutrition/logs', logEntry);
      toast.success('Alimento añadido correctamente');
      setSelectedProduct(null);
      setQuery('');
      setOffResults([]);
      if (onLogAdded) onLogAdded();
      if (onClose) onClose();
    } catch (err) {
      console.error(
        'Error al guardar el alimento:',
        err instanceof Error ? err.message : String(err),
      );
      toast.error('Error al guardar el alimento');
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  };

  const title = selectedProduct
    ? 'A\u00f1adir Registro'
    : activeOverlay === 'scanner'
      ? 'Escanear C\u00f3digo'
      : activeOverlay === 'ai'
        ? 'Asistente IA'
        : activeOverlay === 'manual'
          ? 'Crear Manual'
          : 'Buscar Alimento';
  return (
    <ModalFrame
      open={Boolean(isOpen)}
      onClose={() => onClose?.()}
      title={title}
      className="food-search-fullscreen"
    >
      <FoodSearchHeader
        title={title}
        canGoBack={Boolean(selectedProduct || activeOverlay !== 'none')}
        onBack={() => {
          setSelectedProduct(null);
          setActiveOverlay('none');
        }}
        onClose={() => onClose?.()}
      />

      <div className="food-search-body fade-in">
        {isError && <QueryErrorNotice retry={refetch} pending={isFetching} />}
        {selectedProduct ? (
          <FoodPortionEditor
            selectedProduct={selectedProduct}
            quantity={quantity}
            setQuantity={setQuantity}
            inputMode={inputMode}
            setInputMode={setInputMode}
            onConfirmAdd={handleConfirmAdd}
            pending={adding}
          />
        ) : activeOverlay === 'manual' ? (
          <ManualFoodForm
            manualForm={manualForm}
            updateManualForm={updateManualForm}
            quantity={quantity}
            setQuantity={setQuantity}
            ocrLoading={ocrLoading}
            date={date}
            selectedMealIndex={selectedMealIndex}
            selectedMealKey={selectedMealKey}
            onLogAdded={onLogAdded}
            onCustomAdd={onCustomAdd}
            onClose={() => {
              setActiveOverlay('none');
              if (onCustomAdd && onClose) onClose();
            }}
          />
        ) : activeOverlay === 'scanner' ? (
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
                onScanError={(err: string) => console.warn('Barcode scan:', err)}
              />
            </Suspense>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setActiveOverlay('none')}>
                Cancelar
              </button>
            </div>
          </div>
        ) : activeOverlay === 'ai' ? (
          <AiFoodAssistantView
            query={query}
            setQuery={setQuery}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            fileInputRef={fileInputRef}
            handleImageChange={handleImageChange}
            isListening={isListening}
            toggleListening={toggleListening}
            stopListening={stopListening}
            aiSubmitting={aiSubmitting}
            aiElapsedSeconds={aiElapsedSeconds}
            getAiStatusText={getAiStatusText}
            onCancel={() => setActiveOverlay('none')}
            onSubmit={submitAiPrompt}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Select
                className="form-input"
                aria-label="Comida del registro"
                value={displayedMealIndex}
                onChange={(e) => selectMeal(Number(e.target.value))}
                style={{
                  padding: '0.5rem',
                  fontSize: '1rem',
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
              </Select>
            </div>
            <form onSubmit={handleSearch} style={{ marginBottom: '0.75rem' }}>
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
                  paddingRight: '1rem',
                  paddingLeft: '1rem',
                  height: '50px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                }}
              />
            </form>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleOcrUpload}
            />
            <input
              type="file"
              accept="image/*"
              ref={dishPhotoInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (!e.target.files?.length) return;
                void handleImageChange(e);
                e.target.value = '';
                setActiveOverlay('ai');
              }}
            />
            <div className="food-search-tools">
              <button
                type="button"
                onClick={() => dishPhotoInputRef.current?.click()}
                className="food-search-tool-btn food-search-tool-btn--ai"
              >
                <Camera size={20} aria-hidden="true" />
                <span>Foto del plato</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOverlay('ai')}
                className="food-search-tool-btn"
              >
                <Mic size={20} aria-hidden="true" />
                <span>Describir o dictar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOverlay('scanner')}
                className="food-search-tool-btn"
              >
                <ScanLine size={20} aria-hidden="true" />
                <span>Código de barras</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="food-search-tool-btn"
              >
                <ImageIcon size={20} aria-hidden="true" />
                <span>Foto de etiqueta</span>
              </button>
            </div>
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
    </ModalFrame>
  );
}
