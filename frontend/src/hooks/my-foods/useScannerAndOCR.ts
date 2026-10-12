import { useState, useRef } from 'react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { getSanitizedKcal, extractPortions } from '../../utils/portionHelper';
import { PageFoodItem } from '../../types/myfoods';

type ScannedProductType = {
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: number | null;
  servingLabel?: string | null;
  imageUrl?: string;
  barcode?: string;
};

// Simplified type for what scanner updates in the form
export interface ScannedFoodFormUpdate {
  name: string;
  brand: string;
  protein: string;
  carbs: string;
  fat: string;
  kcal: string;
  servingSize: string;
  servingLabel: string;
}

export function useScannerAndOCR(
  fetchData: () => void,
  setIsActionMenuOpen: (v: boolean) => void,
  setEditingFoodId: (v: string | null) => void,
  setFoodForm: (form: ScannedFoodFormUpdate) => void,
  setIsFoodFormOpen: (v: boolean) => void,
) {
  const ocrFileRef = useRef<HTMLInputElement>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLookingUpCode, setIsLookingUpCode] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ScannedProductType | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsActionMenuOpen(false);

    const loadingToast = toast.loading('Analizando etiqueta nutricional con IA...', {
      duration: 15000,
    });

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/nutrition/ai/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.dismiss(loadingToast);
      toast.success('¡Datos extraídos correctamente!');

      setEditingFoodId(null);
      setFoodForm({
        name: data.name || '',
        brand: data.brand || '',
        protein: data.proteinPer100g !== undefined ? String(data.proteinPer100g) : '',
        carbs: data.carbsPer100g !== undefined ? String(data.carbsPer100g) : '',
        fat: data.fatPer100g !== undefined ? String(data.fatPer100g) : '',
        kcal: data.kcalPer100g !== undefined ? String(data.kcalPer100g) : '',
        servingSize:
          data.servingSize !== undefined && data.servingSize !== null
            ? String(data.servingSize)
            : '',
        servingLabel: data.servingLabel || '',
      });
      setIsFoodFormOpen(true);
    } catch (err: unknown) {
      toast.dismiss(loadingToast);
      toast.error(
        'Error al escanear: ' +
          ((err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            (err as Error).message),
      );
    }
  };

  const handleScanBarcode = async (decodedText: string) => {
    let code = (decodedText || '').trim();
    if (!code) return;

    const urlBarcodeMatch = code.match(/\/product\/(\d+)/i) || code.match(/[?&]code=(\d+)/i);
    if (urlBarcodeMatch) code = urlBarcodeMatch[1];

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
            servingSize: parsed.servingSize || undefined,
            servingLabel: parsed.servingLabel || undefined,
            barcode: code,
          });
          return;
        }
      } catch {
        /* ignore */
      }
    }

    setIsLookingUpCode(true);
    setLookupError(null);
    setScannedProduct(null);

    try {
      const res = await api.get(`/food-external/barcode?code=${encodeURIComponent(code)}`);
      if (res.status === 200) {
        const data = res.data;
        const p = data.product;
        if (p && (p.product_name || p.product_name_es)) {
          const name = p.product_name || p.product_name_es || 'Alimento';
          const brand = p.brands ? p.brands.split(',')[0].trim() : '';
          const nut = p.nutriments || {};
          const portions = extractPortions(p);
          const firstPortion = portions.length > 0 ? portions[0] : null;

          setScannedProduct({
            name,
            brand,
            kcal: getSanitizedKcal(nut),
            protein: Number(nut['proteins_100g'] ?? nut['proteins'] ?? 0) || 0,
            carbs: Number(nut['carbohydrates_100g'] ?? nut['carbohydrates'] ?? 0) || 0,
            fat: Number(nut['fat_100g'] ?? nut['fat'] ?? 0) || 0,
            servingSize: firstPortion
              ? firstPortion.amount
              : p.serving_quantity
                ? Number(p.serving_quantity)
                : undefined,
            servingLabel: firstPortion ? firstPortion.label : p.serving_size || null,
            imageUrl: p.image_front_small_url || p.image_url || null,
            barcode: code,
          });
          return;
        }
      }
      setLookupError(
        `No se encontró ningún producto para el código "${code}". Puedes añadirlo manualmente.`,
      );
    } catch {
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
      servingLabel: scannedProduct.servingLabel || null,
    };

    try {
      await api.post('/nutrition/my-foods', dto);
      toast.success(`"${scannedProduct.name}" añadido a Mis Alimentos`);
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
      kcal: String(scannedProduct.kcal || ''),
      protein: String(scannedProduct.protein || ''),
      carbs: String(scannedProduct.carbs || ''),
      fat: String(scannedProduct.fat || ''),
      servingSize: String(scannedProduct.servingSize || ''),
      servingLabel: scannedProduct.servingLabel || '',
    });
    setEditingFoodId(null);
    setIsFoodFormOpen(true);
    setIsScannerOpen(false);
    setScannedProduct(null);
    setLookupError(null);
  };

  const handleDragStart = (e: React.DragEvent, foodData: PageFoodItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(foodData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverTarget(target);
  };

  const handleDragLeave = () => setDragOverTarget(null);

  const handleDropOnFoods = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await api.post('/nutrition/my-foods', {
        name: data.name,
        brand: data.brand || '',
        kcalPer100g: data.kcal,
        proteinPer100g: data.protein,
        carbsPer100g: data.carbs,
        fatPer100g: data.fat,
      });
      toast.success(`"${data.name}" → Mis Alimentos`);
      fetchData();
    } catch {
      toast.error('Error al añadir');
    }
  };

  const handleDropOnRecipes = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await api.post('/nutrition/recipes', {
        name: data.name,
        description: '',
        totalKcal: data.kcal,
        totalProtein: data.protein,
        totalCarbs: data.carbs,
        totalFat: data.fat,
      });
      toast.success(`"${data.name}" → Mis Recetas`);
      fetchData();
    } catch {
      toast.error('Error al añadir a recetas');
    }
  };

  const saveRecentAsFood = async (f: PageFoodItem) => {
    const q = f.quantity || 100;
    try {
      await api.post('/nutrition/my-foods', {
        name: f.product,
        brand: '',
        kcalPer100g: Math.round(((f.kcal || 0) / q) * 100 * 10) / 10,
        proteinPer100g: Math.round(((f.protein || 0) / q) * 100 * 10) / 10,
        carbsPer100g: Math.round(((f.carbs || 0) / q) * 100 * 10) / 10,
        fatPer100g: Math.round(((f.fat || 0) / q) * 100 * 10) / 10,
      });
      toast.success(`"${f.product}" → Mis Alimentos`);
      fetchData();
    } catch {
      toast.error('Error');
    }
  };

  return {
    ocrFileRef,
    isScannerOpen,
    setIsScannerOpen,
    isLookingUpCode,
    scannedProduct,
    lookupError,
    dragOverTarget,
    setDragOverTarget,
    handleOcrUpload,
    handleScanBarcode,
    handleSaveScannedProduct,
    handleEditScannedProduct,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDropOnFoods,
    handleDropOnRecipes,
    saveRecentAsFood,
  };
}
