import { useState, useEffect, useRef } from 'react';
import { LayoutGrid, List, Clock, ArrowDownAZ, Utensils, Trash2, ScanLine, Pencil, Plus, ChevronDown, ChevronRight, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import toast from 'react-hot-toast';
import BarcodeScanner from '../components/BarcodeScanner';
import { getSanitizedKcal, extractPortions } from '../utils/portionHelper';
import { useSpeechToText } from '../hooks/useSpeechToText';

import AiFoodModal from '../components/my-foods/AiFoodModal';
import FoodFormModal from '../components/my-foods/FoodFormModal';
import RecipeFormModal from '../components/my-foods/RecipeFormModal';
import MealSelectorModal from '../components/my-foods/MealSelectorModal';
import FoodCard from '../components/my-foods/FoodCard';
import RecipeCard from '../components/my-foods/RecipeCard';



const getLocalISODate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function MyFoodsPage() {
  const queryClient = useQueryClient();

  const { data = {}, refetch: fetchData } = useQuery({
    queryKey: ['myFoodsData'],
    queryFn: async () => {
      const [recentRes, savedRes, recipesRes] = await Promise.all([
        api.get('/nutrition/logs/recent').catch(() => ({ data: [] })),
        api.get('/nutrition/my-foods').catch(() => ({ data: [] })),
        api.get('/nutrition/recipes').catch(() => ({ data: [] }))
      ]);
      return {
        recentFoods: recentRes.data,
        savedFoods: savedRes.data,
        recipes: recipesRes.data
      };
    }
  });

  const { recentFoods = [], savedFoods = [], recipes = [] } = data as any;
  
  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const { isListening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: (text) => setAiQuery(text),
    lang: 'es-ES'
  });

  // Form States
  const [foodForm, setFoodForm] = useState({ name: '', brand: '', protein: '', carbs: '', fat: '', kcal: '', servingSize: '', servingLabel: '' });
  const [recipeForm, setRecipeForm] = useState({ name: '', description: '', protein: '', carbs: '', fat: '', kcal: '' });

  // Edit and Accordion States
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  // Unified Create Actions
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Drag state
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // OCR file input reference
  const ocrFileRef = useRef(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all' | 'recent' | 'foods' | 'recipes'
  
  const [viewMode, setViewMode] = useState('grid');
  const [macroFilter, setMacroFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedFoods, setSelectedFoods] = useState<any>(new Set());
  
  // Meal Selector States
  const [isMealSelectorOpen, setIsMealSelectorOpen] = useState(false);
  const [mealSelectorDate, setMealSelectorDate] = useState(getLocalISODate());
  const [bulkQuantities, setBulkQuantities] = useState({});
  const [isAddingToMeal, setIsAddingToMeal] = useState(false);

  useEffect(() => {
    if (isMealSelectorOpen) {
      const initial: any = {};
      Array.from(selectedFoods).forEach(id => {
        const food = savedFoods.find(f => f.id === id);
        if (food) {
          initial[id as any] = food.servingSize > 0 ? food.servingSize : 100;
        }
      });
      setBulkQuantities(initial);
      setMealSelectorDate(getLocalISODate());
    }
  }, [isMealSelectorOpen, selectedFoods, savedFoods]);

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLookingUpCode, setIsLookingUpCode] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    recent: window.innerWidth > 768,
    foods: window.innerWidth > 768,
    recipes: window.innerWidth > 768
  });

  const q = searchQuery.toLowerCase().trim();

  const filteredRecent = recentFoods.filter(f => {
    if (!q) return true;
    return (f.product || '').toLowerCase().includes(q);
  });

  const getPredominantMacro = (f) => {
    const p = f.proteinPer100g || 0;
    const c = f.carbsPer100g || 0;
    const fat = f.fatPer100g || 0;
    if (p >= c && p >= fat) return 'protein';
    if (c >= p && c >= fat) return 'carbs';
    return 'fat';
  };

  const filteredFoods = savedFoods.filter(f => {
    if (q) {
      const nameMatch = (f.name || '').toLowerCase().includes(q);
      const brandMatch = (f.brand || '').toLowerCase().includes(q);
      if (!nameMatch && !brandMatch) return false;
    }
    if (macroFilter !== 'all' && getPredominantMacro(f) !== macroFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'recent') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      if (a.id && b.id) {
        if (typeof a.id === 'number' && typeof b.id === 'number') return b.id - a.id;
        return String(b.id).localeCompare(String(a.id));
      }
      return 0;
    }
    return 0;
  });

  const filteredRecipes = recipes.filter(r => {
    if (!q) return true;
    const nameMatch = (r.name || '').toLowerCase().includes(q);
    const descMatch = (r.description || '').toLowerCase().includes(q);
    return nameMatch || descMatch;
  });

  const totalResults = filteredRecent.length + filteredFoods.length + filteredRecipes.length;

  const toggleSection = (sec, e) => {
    if (!expandedSections[sec] && e?.currentTarget) {
      const el = e.currentTarget;
      setTimeout(() => {
        const offset = 140;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }, 50);
    }
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toFormVal = (val) => (val !== null && val !== undefined ? val : '');

  const updateFoodForm = (field, value) => {
    const newForm = { ...foodForm, [field]: value };
    if (['protein', 'carbs', 'fat'].includes(field)) {
       const p = parseFloat(newForm.protein) || 0;
       const c = parseFloat(newForm.carbs) || 0;
       const f = parseFloat(newForm.fat) || 0;
       const hasAny = [newForm.protein, newForm.carbs, newForm.fat].some(v => v !== '' && v !== null && v !== undefined);
       if (hasAny) {
         newForm.kcal = String(Math.round((p * 4 + c * 4 + f * 9) * 10) / 10);
       } else {
         newForm.kcal = '';
       }
    }
    setFoodForm(newForm);
  };

  const updateRecipeForm = (field, value) => {
    const newForm = { ...recipeForm, [field]: value };
    if (['protein', 'carbs', 'fat'].includes(field)) {
       const p = parseFloat(newForm.protein) || 0;
       const c = parseFloat(newForm.carbs) || 0;
       const f = parseFloat(newForm.fat) || 0;
       const hasAny = [newForm.protein, newForm.carbs, newForm.fat].some(v => v !== '' && v !== null && v !== undefined);
       if (hasAny) {
         newForm.kcal = String(Math.round((p * 4 + c * 4 + f * 9) * 10) / 10);
       } else {
         newForm.kcal = '';
       }
    }
    setRecipeForm(newForm);
  };

  const [pendingAiCount, setPendingAiCount] = useState(0);

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    const queryText = aiQuery.trim();
    stopListening();
    setAiQuery('');
    setPendingAiCount(prev => prev + 1);
    toast(`Buscando "${queryText}"...`, { icon: '', duration: 2000 });
    api.post('/nutrition/ai/food', { text: queryText })
      .then(() => { toast.success(`"${queryText}" añadido `); fetchData(); })
      .catch((err) => { toast.error(`Error: ${err.response?.data?.error || 'IA'}`); })
      .finally(() => { setPendingAiCount(prev => Math.max(0, prev - 1)); });
  };

  const handleAddSavedFood = async (e) => {
    e.preventDefault();
    const dto = {
      name: foodForm.name,
      brand: foodForm.brand,
      kcalPer100g: parseFloat(foodForm.kcal) || 0,
      proteinPer100g: parseFloat(foodForm.protein) || 0,
      carbsPer100g: parseFloat(foodForm.carbs) || 0,
      fatPer100g: parseFloat(foodForm.fat) || 0,
      servingSize: (foodForm.servingSize !== '' && foodForm.servingSize !== null) ? parseFloat(foodForm.servingSize) : null,
      servingLabel: foodForm.servingLabel || null
    };
    try {
      if (editingFoodId) { await api.put(`/nutrition/my-foods/${editingFoodId}`, dto); toast.success('Actualizado'); }
      else { await api.post('/nutrition/my-foods', dto); toast.success('Guardado'); }
      setFoodForm({ name: '', brand: '', protein: '', carbs: '', fat: '', kcal: '', servingSize: '', servingLabel: '' });
      setEditingFoodId(null); setIsFoodFormOpen(false); fetchData();
    } catch { toast.error('Error'); }
  };

  const handleEditFood = (food) => {
    setFoodForm({
      name: food.name || '',
      brand: food.brand || '',
      kcal: toFormVal(food.kcalPer100g),
      protein: toFormVal(food.proteinPer100g),
      carbs: toFormVal(food.carbsPer100g),
      fat: toFormVal(food.fatPer100g),
      servingSize: toFormVal(food.servingSize),
      servingLabel: food.servingLabel || ''
    });
    setEditingFoodId(food.id); setIsFoodFormOpen(true);
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    const dto = {
      name: recipeForm.name,
      description: recipeForm.description,
      totalKcal: parseFloat(recipeForm.kcal) || 0,
      totalProtein: parseFloat(recipeForm.protein) || 0,
      totalCarbs: parseFloat(recipeForm.carbs) || 0,
      totalFat: parseFloat(recipeForm.fat) || 0
    };
    try {
      if (editingRecipeId) { await api.put(`/nutrition/recipes/${editingRecipeId}`, dto); toast.success('Actualizada'); }
      else { await api.post('/nutrition/recipes', dto); toast.success('Guardada'); }
      setRecipeForm({ name: '', description: '', protein: '', carbs: '', fat: '', kcal: '' });
      setEditingRecipeId(null); setIsRecipeFormOpen(false); fetchData();
    } catch { toast.error('Error'); }
  };

  const handleEditRecipe = (recipe) => {
    setRecipeForm({
      name: recipe.name || '',
      description: recipe.description || '',
      kcal: toFormVal(recipe.totalKcal),
      protein: toFormVal(recipe.totalProtein),
      carbs: toFormVal(recipe.totalCarbs),
      fat: toFormVal(recipe.totalFat)
    });
    setEditingRecipeId(recipe.id); setIsRecipeFormOpen(true);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿Borrar los ${selectedFoods.size} alimentos seleccionados?`)) return;
    try {
      await Promise.all(Array.from(selectedFoods).map(id => api.delete(`/nutrition/my-foods/${id}`)));
      toast.success(`${selectedFoods.size} alimentos eliminados`);
      setSelectedFoods(new Set());
      fetchData();
    } catch {
      toast.error('Error al borrar alimentos');
    }
  };

  const toggleFoodSelection = (id) => {
    const next = new Set(selectedFoods);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFoods(next);
  };

  const handleBulkAddToMeal = async (mealIndex) => {
    if (selectedFoods.size === 0) return;
    setIsAddingToMeal(true);
    try {
      const foodsToAdd = savedFoods.filter(f => selectedFoods.has(f.id));
      const promises = foodsToAdd.map(food => {
        const qty = bulkQuantities[food.id] || 100;
        const factor = qty / 100.0;
        const logEntry = {
          date: mealSelectorDate,
          mealIndex: mealIndex,
          product: food.name + (food.brand ? ` (${food.brand})` : ''),
          quantity: qty,
          kcal: Math.round((food.kcalPer100g * factor) * 10) / 10,
          protein: Math.round((food.proteinPer100g * factor) * 10) / 10,
          carbs: Math.round((food.carbsPer100g * factor) * 10) / 10,
          fat: Math.round((food.fatPer100g * factor) * 10) / 10
        };
        return api.post('/nutrition/logs', logEntry);
      });
      await Promise.all(promises);
      toast.success(`${selectedFoods.size} alimentos añadidos al diario`);
      setSelectedFoods(new Set());
      setIsMealSelectorOpen(false);
    } catch (err) {
      toast.error('Error al añadir al diario');
    } finally {
      setIsAddingToMeal(false);
    }
  };

  const deleteSavedFood = async (id) => {
    if (!confirm('¿Borrar este alimento?')) return;
    try { await api.delete(`/nutrition/my-foods/${id}`); toast.success('Eliminado'); fetchData(); } catch { toast.error('Error'); }
  };

  const handleDeleteRecipe = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta receta?')) return;
    try {
      await api.delete(`/nutrition/recipes/${id}`);
      toast.success('Eliminada');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
      console.error(err);
    }
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset the input value so the same file can be uploaded again if needed
    e.target.value = '';
    
    setIsActionMenuOpen(false);
    
    const loadingToast = toast.loading('Analizando etiqueta nutricional con IA...', { duration: 15000 });
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const { data } = await api.post('/nutrition/ai/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.dismiss(loadingToast);
      toast.success('¡Datos extraídos correctamente!');
      
      // Pre-fill the form and open it
      setEditingFoodId(null);
      setFoodForm({
        name: data.name || '',
        brand: data.brand || '',
        protein: data.proteinPer100g !== undefined ? String(data.proteinPer100g) : '',
        carbs: data.carbsPer100g !== undefined ? String(data.carbsPer100g) : '',
        fat: data.fatPer100g !== undefined ? String(data.fatPer100g) : '',
        kcal: data.kcalPer100g !== undefined ? String(data.kcalPer100g) : '',
        servingSize: data.servingSize !== undefined && data.servingSize !== null ? String(data.servingSize) : '',
        servingLabel: data.servingLabel || ''
      });
      setIsFoodFormOpen(true);
      
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Error al escanear: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  // QR / Barcode Scan Handlers
  const handleScanBarcode = async (decodedText) => {
    let code = (decodedText || '').trim();
    if (!code) return;

    const urlBarcodeMatch = code.match(/\/product\/(\d+)/i) || code.match(/[?&]code=(\d+)/i);
    if (urlBarcodeMatch) {
      code = urlBarcodeMatch[1];
    }

    if (code.startsWith('{') && code.endsWith('}')) {
      try {
        const parsed = JSON.parse(code);
        if (parsed.name) {
          setScannedProduct({
            name: parsed.name,
            brand: parsed.brand || '',
            kcal: parsed.kcal || parsed.kcalPer100g || 0,
            protein: parsed.protein || parsed.proteinPer100g || 0,
            carbs: parsed.carbs || parsed.carbsPer100g || 0,
            fat: parsed.fat || parsed.fatPer100g || 0,
            servingSize: parsed.servingSize || null,
            servingLabel: parsed.servingLabel || null,
            barcode: code
          });
          return;
        }
      } catch {}
    }

    setIsLookingUpCode(true);
    setLookupError(null);
    setScannedProduct(null);

    try {
      const res = await fetch(`/api/food-external/barcode?code=${encodeURIComponent(code)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.product;
        if (p && (p.product_name || p.product_name_es)) {
          const name = p.product_name || p.product_name_es || 'Alimento';
          const brand = p.brands ? p.brands.split(',')[0].trim() : '';
          const nut = p.nutriments || {};
          const portions = extractPortions(p);
          const firstPortion = portions.length > 0 ? portions[0] : null;

          setScannedProduct({
            name: name,
            brand: brand,
            kcal: getSanitizedKcal(nut),
            protein: Number(nut['proteins_100g'] ?? nut['proteins'] ?? 0) || 0,
            carbs: Number(nut['carbohydrates_100g'] ?? nut['carbohydrates'] ?? 0) || 0,
            fat: Number(nut['fat_100g'] ?? nut['fat'] ?? 0) || 0,
            servingSize: firstPortion ? firstPortion.amount : (p.serving_quantity ? Number(p.serving_quantity) : null),
            servingLabel: firstPortion ? firstPortion.label : (p.serving_size || null),
            imageUrl: p.image_front_small_url || p.image_url || null,
            barcode: code
          });
          return;
        }
      }
      setLookupError(`No se encontró ningún producto para el código "${code}". Puedes añadirlo manualmente.`);
    } catch (err) {
      console.error(err);
      setLookupError('Error al consultar la base de datos de alimentos.');
    } finally {
      setIsLookingUpCode(false);
    }
  };

  const handleSaveScannedProduct = async () => {
    if (!scannedProduct) return;
    const dto = {
      name: scannedProduct.name,
      brand: scannedProduct.brand || '',
      kcalPer100g: Number(scannedProduct.kcal) || 0,
      proteinPer100g: Number(scannedProduct.protein) || 0,
      carbsPer100g: Number(scannedProduct.carbs) || 0,
      fatPer100g: Number(scannedProduct.fat) || 0,
      servingSize: scannedProduct.servingSize ? Number(scannedProduct.servingSize) : null,
      servingLabel: scannedProduct.servingLabel || null
    };

    try {
      await api.post('/nutrition/my-foods', dto);
      toast.success(`"${scannedProduct.name}" añadido a Mis Alimentos `);
      setIsScannerOpen(false);
      setScannedProduct(null);
      setLookupError(null);
      fetchData();
    } catch {
      toast.error('Error al guardar el alimento escaneado');
    }
  };

  const handleEditScannedProduct = () => {
    if (!scannedProduct) return;
    setFoodForm({
      name: scannedProduct.name || '',
      brand: scannedProduct.brand || '',
      kcal: toFormVal(scannedProduct.kcal),
      protein: toFormVal(scannedProduct.protein),
      carbs: toFormVal(scannedProduct.carbs),
      fat: toFormVal(scannedProduct.fat),
      servingSize: toFormVal(scannedProduct.servingSize),
      servingLabel: scannedProduct.servingLabel || ''
    });
    setEditingFoodId(null);
    setIsFoodFormOpen(true);
    setIsScannerOpen(false);
    setScannedProduct(null);
    setLookupError(null);
  };

  // Drag & Drop
  const handleDragStart = (e, foodData) => { e.dataTransfer.setData('application/json', JSON.stringify(foodData)); e.dataTransfer.effectAllowed = 'copy'; };
  const handleDragOver = (e, target) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOverTarget(target); };
  const handleDragLeave = () => { setDragOverTarget(null); };

  const handleDropOnFoods = async (e) => {
    e.preventDefault(); setDragOverTarget(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await api.post('/nutrition/my-foods', { name: data.name, brand: data.brand||'', kcalPer100g: data.kcal, proteinPer100g: data.protein, carbsPer100g: data.carbs, fatPer100g: data.fat });
      toast.success(`"${data.name}" → Mis Alimentos`); fetchData();
    } catch { toast.error('Error'); }
  };

  const handleDropOnRecipes = async (e) => {
    e.preventDefault(); setDragOverTarget(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await api.post('/nutrition/recipes', { name: data.name, description: '', totalKcal: data.kcal, totalProtein: data.protein, totalCarbs: data.carbs, totalFat: data.fat });
      toast.success(`"${data.name}" → Mis Recetas`); fetchData();
    } catch { toast.error('Error'); }
  };

  const saveRecentAsFood = async (f) => {
    const q = f.quantity || 100;
    try {
      await api.post('/nutrition/my-foods', { name: f.product, brand: '', kcalPer100g: Math.round(((f.kcal||0)/q)*100*10)/10, proteinPer100g: Math.round(((f.protein||0)/q)*100*10)/10, carbsPer100g: Math.round(((f.carbs||0)/q)*100*10)/10, fatPer100g: Math.round(((f.fat||0)/q)*100*10)/10 });
      toast.success(`"${f.product}" → Mis Alimentos`); fetchData();
    } catch { toast.error('Error'); }
  };

  const isAlreadySaved = (productName) => {
    const n = productName.toLowerCase().trim();
    return savedFoods.some(s => s.name.toLowerCase().trim() === n);
  };

  const macroLine = (kcal, p, c, f) => (
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

  const itemStyle = (highlight) => ({
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

  const EditBtn = ({ onClick }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="icon-btn edit-btn" style={{ padding: '0.4rem', width: '28px', height: '28px' }} title="Editar">
      
    </button>
  );

  return (
    <div className="fade-in">

      {/* SEARCH AND FILTER BAR */}
      <div className="card" style={{
        marginBottom: '1.25rem',
        padding: '0.85rem 1rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.95rem', pointerEvents: 'none' }}></span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar en recientes, alimentos o recetas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.4rem',
              paddingRight: searchQuery ? '2.4rem' : '0.85rem',
              height: '40px',
              fontSize: '0.88rem',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Limpiar búsqueda"
            ><X className="w-4 h-4" /></button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="mobile-scroll-x" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto', paddingBottom: '2px', flex: 1 }}>
            {[
              { id: 'all', icon: '', label: 'Todo', count: q ? totalResults : (recentFoods.length + savedFoods.length + recipes.length) },
              { id: 'recent', icon: '', label: 'Recientes', count: filteredRecent.length },
              { id: 'foods', icon: '', label: 'Alimentos', count: filteredFoods.length },
              { id: 'recipes', icon: '', label: 'Recetas', count: filteredRecipes.length }
            ].map(tab => {
              const active = searchFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSearchFilter(tab.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: active ? `1px solid var(--text-primary)` : '1px solid var(--border-subtle)',
                    background: active ? 'var(--bg-glass-strong)' : 'var(--bg-primary)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title={tab.label}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {tab.icon}
                    {active && <span style={{ marginLeft: '0.3rem' }} className="fade-in-anim">{tab.label}</span>}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    opacity: 0.8,
                    background: active ? 'rgba(255,255,255,0.1)' : 'var(--bg-secondary)',
                    padding: '0.05rem 0.3rem',
                    borderRadius: '4px'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem', width: '32px', height: '32px', flexShrink: 0, borderRadius: '8px' }} title="Cambiar Vista">{viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}</button>
        </div>

        {searchQuery && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Resultados para "<strong>{searchQuery}</strong>": {totalResults} coincidencia{totalResults === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchFilter('all'); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-carbs)', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* MAIN CONTENT AREA: MIS ALIMENTOS */}
        {['all', 'foods'].includes(searchFilter) && (
          <div className={`flex flex-col gap-5 ${searchFilter === 'all' ? 'w-full lg:w-2/3' : 'w-full'}`}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', border: dragOverTarget === 'foods' ? '2px dashed var(--color-carbs)' : undefined, transition: 'border 0.2s' }} onDragOver={(e) => handleDragOver(e, 'foods')} onDragLeave={handleDragLeave} onDrop={handleDropOnFoods}>
              
              <div onClick={(e) => toggleSection('foods', e)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', padding: '0.5rem 0.8rem', background: 'var(--bg-glass)', borderRadius: '10px', cursor: 'pointer' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span></span> Mis Alimentos
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                  {(expandedSections.foods || q) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSortBy(prev => prev === 'recent' ? 'name_asc' : 'recent'); }}
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                      title={sortBy === 'recent' ? 'Ordenado por más recientes. Cambiar a A-Z' : 'Ordenado de A-Z. Cambiar a más recientes'}
                    >{sortBy === 'recent' ? <ArrowDownAZ className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</button>
                  )}
                  <div>{expandedSections.foods ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</div>
                </div>
              </div>

              {/* FILTERS */}
              <div style={{ display: (expandedSections.foods || q) ? 'flex' : 'none', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '10px' }}>
                  <div className="mobile-scroll-x" style={{ display: 'flex', gap: '0.3rem', flex: 1, minWidth: '0', overflowX: 'auto', paddingBottom: '2px' }}>
                    {[{id:'all', label:'Todos'}, {id:'protein', label:'🥩 Pro'}, {id:'carbs', label:'🍚 Car'}, {id:'fat', label:' Gra'}].map(m => (
                      <button key={m.id} onClick={() => setMacroFilter(m.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer', border: 'none', background: macroFilter === m.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent', boxShadow: macroFilter === m.id ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.05) inset' : 'none', transform: macroFilter === m.id ? 'scale(1)' : 'scale(0.98)', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', color: macroFilter === m.id ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BULK ACTIONS */}
                {selectedFoods.size > 0 && (
                  <div className="bulk-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 600 }}>{selectedFoods.size} seleccionados</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => setIsMealSelectorOpen(true)} style={{ background: 'var(--accent-primary)', color: 'var(--accent-text, white)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}><Utensils className="w-4 h-4" /> Añadir</button>
                      <button onClick={handleBulkDelete} style={{ background: 'var(--bg-glass)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}> <Trash2 className="w-4 h-4" /> Borrar</button>
                      <button onClick={() => setSelectedFoods(new Set())} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.4rem 0.5rem' }}><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                  {filteredFoods.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                      {q || macroFilter !== 'all' ? `No hay alimentos que coincidan con los filtros` : 'No tienes alimentos guardados'}
                    </p>
                  )}
                  
                  {viewMode === 'grid' ? (
                    /* GRID VIEW */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                      {filteredFoods.map((f: any) => (
                        <FoodCard 
                          key={f.id} 
                          food={f} 
                          isSelected={selectedFoods.has(f.id)} 
                          onToggleSelect={toggleFoodSelection} 
                          onEdit={handleEditFood} 
                          viewMode='grid' 
                          onDragStart={handleDragStart} 
                        />
                      ))}
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                        <div style={{ width: '30px' }}></div>
                        <div style={{ flex: 2, minWidth: '120px' }}>Nombre</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Kcal</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Pro</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Car</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>Gra</div>
                        <div style={{ width: '30px' }}></div>
                      </div>
                      {filteredFoods.map((f: any) => (
                        <FoodCard 
                          key={f.id} 
                          food={f} 
                          isSelected={selectedFoods.has(f.id)} 
                          onToggleSelect={toggleFoodSelection} 
                          onEdit={handleEditFood} 
                          viewMode='list' 
                          onDragStart={handleDragStart} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT SIDEBAR: RECIENTES & RECETAS */}
        {['all', 'recent', 'recipes'].includes(searchFilter) && (
          <div className={`flex flex-col gap-5 ${searchFilter === 'all' ? 'w-full lg:w-1/3' : 'w-full'}`}>
            {/* RECIENTES */}
        {['all', 'recent'].includes(searchFilter) && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div onClick={(e) => toggleSection('recent', e)} style={{ cursor: 'pointer', padding: '0.5rem 0.8rem', background: 'var(--bg-glass)', borderRadius: '10px', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span></span> Recientes
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="hide-on-mobile">Arrastra →</span>
                  <span className="show-on-mobile" style={{ display: 'none' }}>{(expandedSections.recent || q) ? '▼' : '▶'}</span>
                </span>
              </h2>
            </div>
            <div style={{ display: (expandedSections.recent || q) ? 'flex' : 'none', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              {filteredRecent.map(f => {
                const qg = f.quantity || 100;
                const k = Math.round((f.kcal/qg)*100), p = ((f.protein/qg)*100).toFixed(1), c = ((f.carbs/qg)*100).toFixed(1), g = ((f.fat/qg)*100).toFixed(1);
                const saved = isAlreadySaved(f.product);
                return (
                  <div key={f.id} draggable onDragStart={(e) => handleDragStart(e, { name: f.product, brand: '', kcal: k, protein: parseFloat(p), carbs: parseFloat(c), fat: parseFloat(g) })} style={itemStyle(false)}>
                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.product}</div>
                      <div>{macroLine(k, p, c, g)}</div>
                    </div>
                    {saved ? (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-primary)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.15rem 0.35rem', borderRadius: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}><Check className="w-3 h-3" /></span>
                    ) : (
                      <button onClick={() => saveRecentAsFood(f)} style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-subtle)', color: 'var(--accent-primary-light)', cursor: 'pointer', padding: '0.2rem 0.45rem', borderRadius: '7px', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Añadir a Mis Alimentos">+</button>
                    )}
                  </div>
                );
              })}
              {filteredRecent.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: q ? 'center' : 'left', padding: q ? '1rem 0' : '0' }}>
                  {q ? `No hay recientes que coincidan con "${searchQuery}"` : 'No hay recientes'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* MIS RECETAS */}
        {['all', 'recipes'].includes(searchFilter) && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', border: dragOverTarget === 'recipes' ? '2px dashed var(--color-warning)' : undefined, transition: 'border 0.2s' }} onDragOver={(e) => handleDragOver(e, 'recipes')} onDragLeave={handleDragLeave} onDrop={handleDropOnRecipes}>
            <div onClick={(e) => toggleSection('recipes', e)} style={{ cursor: 'pointer', padding: '0.5rem 0.8rem', background: 'var(--bg-glass)', borderRadius: '10px', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span></span> Mis Recetas
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="show-on-mobile" style={{ display: 'none' }}>{(expandedSections.recipes || q) ? '▼' : '▶'}</span>
                </span>
              </h2>
            </div>

            <div style={{ display: (expandedSections.recipes || q) ? 'flex' : 'none', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>

            <RecipeFormModal 
              isOpen={isRecipeFormOpen} 
              onToggle={() => { if (isRecipeFormOpen && editingRecipeId) { setEditingRecipeId(null); setRecipeForm({ name:'', description:'', protein:'', carbs:'', fat:'', kcal:'' }); } setIsRecipeFormOpen(!isRecipeFormOpen); }} 
              recipeForm={recipeForm as any} 
              updateRecipeForm={updateRecipeForm} 
              handleAddRecipe={handleAddRecipe} 
              editingRecipeId={editingRecipeId} 
              onCancelEdit={() => { setEditingRecipeId(null); setRecipeForm({ name:'', description:'', protein:'', carbs:'', fat:'', kcal:'' }); setIsRecipeFormOpen(false); }} 
              handleDeleteRecipe={handleDeleteRecipe} 
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              {filteredRecipes.map((r: any) => (
                <RecipeCard key={r.id} recipe={r} onEdit={handleEditRecipe} />
              ))}
              {filteredRecipes.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: q ? 'center' : 'left', padding: q ? '1rem 0' : '0' }}>
                  {q ? `No hay recetas que coincidan con "${searchQuery}"` : 'Arrastra desde Recientes o añade manualmente'}
                </p>
              )}
            </div>
            </div>
          </div>
        )}
          </div>
        )}
      </div>

      {/* FOOD FORM MODAL */}
      <FoodFormModal 
        isOpen={isFoodFormOpen} 
        onClose={() => { setIsFoodFormOpen(false); setEditingFoodId(null); }} 
        foodForm={foodForm as any} 
        updateFoodForm={updateFoodForm} 
        handleAddSavedFood={handleAddSavedFood} 
        editingFoodId={editingFoodId} 
      />

      {/* SCANNER MODAL */}

      {isScannerOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}></span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Escanear Código / QR</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Escanea el código de un envase para guardarlo en Mis Alimentos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsScannerOpen(false); setScannedProduct(null); setLookupError(null); }}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}
              ><X className="w-4 h-4" /></button>
            </div>

            {/* Modal Body */}
            {isLookingUpCode ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Consultando producto...</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Buscando en Open Food Facts</span>
              </div>
            ) : scannedProduct ? (
              /* Product Found Preview */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'center'
                }}>
                  {scannedProduct.imageUrl && (
                    <img
                      src={scannedProduct.imageUrl}
                      alt={scannedProduct.name}
                      style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px', background: 'white', padding: '2px', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {scannedProduct.name}
                    </div>
                    {scannedProduct.brand && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        Marca: <strong style={{ color: 'var(--text-primary)' }}>{scannedProduct.brand}</strong>
                      </div>
                    )}
                    <div>{macroLine(scannedProduct.kcal, scannedProduct.protein, scannedProduct.carbs, scannedProduct.fat)}</div>
                    {scannedProduct.servingSize && (
                      <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        Ración detectada: {scannedProduct.servingSize}g {scannedProduct.servingLabel ? `(${scannedProduct.servingLabel})` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveScannedProduct}
                    style={{ padding: '0.6rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <span><Check className="w-3 h-3" /></span> Guardar en Mis Alimentos
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleEditScannedProduct}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                    >
                       Editar antes de guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setScannedProduct(null); setLookupError(null); }}
                      style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}
                    >
                      <ScanLine className="w-4 h-4 mr-1" /> Escanear otro
                    </button>
                  </div>
                </div>
              </div>
            ) : lookupError ? (
              /* Product Not Found */
              <div style={{ padding: '1.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.2rem' }}></span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-fat)', fontWeight: 600 }}>Producto no encontrado</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lookupError}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setLookupError(null); setScannedProduct(null); }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    Reintentar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsScannerOpen(false);
                      setLookupError(null);
                      setIsFoodFormOpen(true);
                    }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Crear manual
                  </button>
                </div>
              </div>
            ) : (
              /* Scanner Active */
              <div>
                <BarcodeScanner onScanSuccess={handleScanBarcode} onScanError={(err: any) => console.error(err)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEAL SELECTOR MODAL */}
      <MealSelectorModal 
        isOpen={isMealSelectorOpen} 
        onClose={() => setIsMealSelectorOpen(false)} 
        selectedFoods={selectedFoods} 
        savedFoods={savedFoods} 
        bulkQuantities={bulkQuantities} 
        setBulkQuantities={setBulkQuantities} 
        mealSelectorDate={mealSelectorDate} 
        setMealSelectorDate={setMealSelectorDate} 
        isAddingToMeal={isAddingToMeal} 
        handleBulkAddToMeal={handleBulkAddToMeal} 
      />
      {/* CUSTOM FAB FOR CREATION ACTIONS */}
      <button
        className="btn btn-primary shadow-glow"
        onClick={() => setIsActionMenuOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(75px + env(safe-area-inset-bottom))',
          right: '20px',
          zIndex: 90,
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 4px 12px var(--accent-shadow)' // Blueish shadow
        }}
        title="Crear o Añadir Alimento">
        <Plus className="w-6 h-6" />
      </button>

      {/* ACTION MENU MODAL */}
      {isActionMenuOpen && (
        <div className="modal-backdrop" onClick={() => setIsActionMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="card slide-up-anim" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '0 auto', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: '1.5rem', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.1rem' }}> Crear Alimento</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setIsActionMenuOpen(false); setIsAiModalOpen(true); }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                 Crear con IA (Texto / Voz)
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => { setIsActionMenuOpen(false); setIsScannerOpen(true); setScannedProduct(null); setLookupError(null); }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                 Escanear Código (Barras/QR)
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => { 
                  if (ocrFileRef.current) ocrFileRef.current.click();
                }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                <ScanLine className="w-5 h-5 mr-2" /> Escanear Etiqueta Nutricional
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => { 
                  setIsActionMenuOpen(false); 
                  setEditingFoodId(null); 
                  setFoodForm({ name:'', brand:'', protein:'', carbs:'', fat:'', kcal:'', servingSize:'', servingLabel:'' }); 
                  setIsFoodFormOpen(true); 
                }}
                style={{ padding: '1rem', justifyContent: 'flex-start', fontSize: '1rem', background: 'var(--bg-primary)' }}
              >
                <Pencil className="w-5 h-5 mr-2" /> Crear Manualmente
              </button>
            </div>

            <button className="btn btn-secondary" onClick={() => setIsActionMenuOpen(false)} style={{ width: '100%', marginTop: '1.5rem', background: 'transparent', border: '1px solid var(--border-subtle)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* AI CREATION MODAL */}
      <AiFoodModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        aiQuery={aiQuery} 
        setAiQuery={setAiQuery} 
        isListening={isListening} 
        toggleListening={toggleListening} 
        stopListening={stopListening} 
        handleAiSubmit={handleAiSubmit} 
        pendingAiCount={pendingAiCount} 
      />

      {/* Hidden File Input for OCR */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={ocrFileRef} 
        style={{ display: 'none' }} 
        onChange={handleOcrUpload} 
      />
    </div>
  );
}

