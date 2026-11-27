import { useRef, useState } from 'react';
import { Recipe, SavedFood } from '../../types/api';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { parseNumber } from '../../utils/nutritionCalculators';

/** Blank means 0 (an empty macro), but text that is not a number is an error, not a silent 0. */
const amount = (value: string): number | null => {
  if (value.trim() === '') return 0;
  const n = parseNumber(value);
  return n !== null && n >= 0 ? n : null;
};

export function useFoodForms(fetchData: () => void) {
  const [foodForm, setFoodForm] = useState({
    name: '',
    brand: '',
    protein: '',
    carbs: '',
    fat: '',
    kcal: '',
    servingSize: '',
    servingLabel: '',
  });
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    description: '',
    protein: '',
    carbs: '',
    fat: '',
    kcal: '',
  });

  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  const toFormVal = (val: string | number | null | undefined) =>
    val !== null && val !== undefined ? val : '';

  const updateFoodForm = (field: string, value: string | number | null) => {
    const newForm = { ...foodForm, [field]: value };
    if (['protein', 'carbs', 'fat'].includes(field)) {
      const p = parseFloat(newForm.protein) || 0;
      const c = parseFloat(newForm.carbs) || 0;
      const f = parseFloat(newForm.fat) || 0;
      const hasAny = [newForm.protein, newForm.carbs, newForm.fat].some(
        (v: unknown) => v !== '' && v !== null && v !== undefined,
      );
      if (hasAny) {
        newForm.kcal = String(Math.round((p * 4 + c * 4 + f * 9) * 10) / 10);
      } else {
        newForm.kcal = '';
      }
    }
    setFoodForm(newForm);
  };

  const updateRecipeForm = (
    field: keyof typeof recipeForm | Partial<typeof recipeForm>,
    value?: string | null,
  ) => {
    setRecipeForm((prev) => {
      let newForm = { ...prev };
      if (typeof field === 'object' && field !== null) {
        newForm = { ...newForm, ...field };
      } else {
        newForm[field as keyof typeof recipeForm] = value ?? '';
      }

      const p = parseFloat(newForm.protein) || 0;
      const c = parseFloat(newForm.carbs) || 0;
      const f = parseFloat(newForm.fat) || 0;

      if (typeof field === 'object' && field !== null && 'kcal' in field) {
        newForm.kcal = String((field as Record<string, unknown>).kcal);
      } else if (typeof field === 'object' || ['protein', 'carbs', 'fat'].includes(field)) {
        const hasAny = [newForm.protein, newForm.carbs, newForm.fat].some(
          (v: unknown) => v !== '' && v !== null && v !== undefined,
        );
        if (hasAny) {
          newForm.kcal = String(Math.round((p * 4 + c * 4 + f * 9) * 10) / 10);
        } else {
          newForm.kcal = '';
        }
      }
      return newForm;
    });
  };

  const handleAddSavedFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const kcal = amount(foodForm.kcal);
    const protein = amount(foodForm.protein);
    const carbs = amount(foodForm.carbs);
    const fat = amount(foodForm.fat);
    const servingSize =
      foodForm.servingSize !== '' && foodForm.servingSize !== null
        ? parseNumber(foodForm.servingSize)
        : null;
    if (
      kcal === null ||
      protein === null ||
      carbs === null ||
      fat === null ||
      (foodForm.servingSize !== '' && (servingSize === null || servingSize <= 0))
    ) {
      toast.error('Revisa los números: usa solo cifras positivas');
      return;
    }
    const dto = {
      name: foodForm.name,
      brand: foodForm.brand,
      kcalPer100g: kcal,
      proteinPer100g: protein,
      carbsPer100g: carbs,
      fatPer100g: fat,
      servingSize,
      servingLabel: foodForm.servingLabel || null,
    };
    savingRef.current = true;
    setSaving(true);
    try {
      if (editingFoodId) {
        await api.put(`/nutrition/my-foods/${editingFoodId}`, dto);
        toast.success('Actualizado');
      } else {
        await api.post('/nutrition/my-foods', dto);
        toast.success('Guardado');
      }
      setFoodForm({
        name: '',
        brand: '',
        protein: '',
        carbs: '',
        fat: '',
        kcal: '',
        servingSize: '',
        servingLabel: '',
      });
      setEditingFoodId(null);
      setIsFoodFormOpen(false);
      fetchData();
    } catch {
      toast.error('Error al guardar');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEditFood = (food: SavedFood) => {
    setFoodForm({
      name: food.name || '',
      brand: food.brand || '',
      kcal: String(toFormVal(food.kcalPer100g)),
      protein: String(toFormVal(food.proteinPer100g)),
      carbs: String(toFormVal(food.carbsPer100g)),
      fat: String(toFormVal(food.fatPer100g)),
      servingSize: String(toFormVal(food.servingSize)),
      servingLabel: food.servingLabel || '',
    });
    setEditingFoodId(String(food.id));
    setIsFoodFormOpen(true);
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const totalKcal = amount(recipeForm.kcal);
    const totalProtein = amount(recipeForm.protein);
    const totalCarbs = amount(recipeForm.carbs);
    const totalFat = amount(recipeForm.fat);
    if (totalKcal === null || totalProtein === null || totalCarbs === null || totalFat === null) {
      toast.error('Revisa los números: usa solo cifras positivas');
      return;
    }
    const dto = {
      name: recipeForm.name,
      description: recipeForm.description,
      totalKcal,
      totalProtein,
      totalCarbs,
      totalFat,
    };
    savingRef.current = true;
    setSaving(true);
    try {
      if (editingRecipeId) {
        await api.put(`/nutrition/recipes/${editingRecipeId}`, dto);
        toast.success('Actualizada');
      } else {
        await api.post('/nutrition/recipes', dto);
        toast.success('Guardada');
      }
      setRecipeForm({ name: '', description: '', protein: '', carbs: '', fat: '', kcal: '' });
      setEditingRecipeId(null);
      setIsRecipeFormOpen(false);
      fetchData();
    } catch {
      toast.error('Error al guardar receta');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeForm({
      name: recipe.name || '',
      description: recipe.description || '',
      kcal: String(toFormVal(recipe.totalKcal)),
      protein: String(toFormVal(recipe.totalProtein)),
      carbs: String(toFormVal(recipe.totalCarbs)),
      fat: String(toFormVal(recipe.totalFat)),
    });
    setEditingRecipeId(String(recipe.id));
    setIsRecipeFormOpen(true);
  };

  const openNewFoodForm = () => {
    setFoodForm({
      name: '',
      brand: '',
      protein: '',
      carbs: '',
      fat: '',
      kcal: '',
      servingSize: '',
      servingLabel: '',
    });
    setEditingFoodId(null);
    setIsFoodFormOpen(true);
  };

  const openNewRecipeForm = () => {
    setRecipeForm({ name: '', description: '', protein: '', carbs: '', fat: '', kcal: '' });
    setEditingRecipeId(null);
    setIsRecipeFormOpen(true);
  };

  return {
    foodForm,
    setFoodForm,
    recipeForm,
    setRecipeForm,
    isFoodFormOpen,
    setIsFoodFormOpen,
    isRecipeFormOpen,
    setIsRecipeFormOpen,
    editingFoodId,
    editingRecipeId,
    updateFoodForm,
    updateRecipeForm,
    saving,
    handleAddSavedFood,
    handleEditFood,
    handleAddRecipe,
    handleEditRecipe,
    openNewFoodForm,
    openNewRecipeForm,
    setEditingFoodId,
  };
}
