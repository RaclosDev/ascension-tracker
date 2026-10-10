import { useState } from 'react';
import { PageFoodItem } from '../../types/myfoods';
import { Recipe } from '../../types/api';
import api from '../../api/client';
import toast from 'react-hot-toast';

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

  const updateRecipeForm = (field: string, value: string | number | null) => {
    setRecipeForm((prev) => {
      let newForm = { ...prev };
      if (typeof field === 'object' && field !== null) {
        newForm = { ...newForm, ...(field as Record<string, unknown>) };
      } else {
        (newForm as Record<string, unknown>)[field as string] = value;
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
    const dto = {
      name: foodForm.name,
      brand: foodForm.brand,
      kcalPer100g: parseFloat(foodForm.kcal) || 0,
      proteinPer100g: parseFloat(foodForm.protein) || 0,
      carbsPer100g: parseFloat(foodForm.carbs) || 0,
      fatPer100g: parseFloat(foodForm.fat) || 0,
      servingSize:
        foodForm.servingSize !== '' && foodForm.servingSize !== null
          ? parseFloat(foodForm.servingSize)
          : null,
      servingLabel: foodForm.servingLabel || null,
    };
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
    }
  };

  const handleEditFood = (food: PageFoodItem) => {
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
    const dto = {
      name: recipeForm.name,
      description: recipeForm.description,
      totalKcal: parseFloat(recipeForm.kcal) || 0,
      totalProtein: parseFloat(recipeForm.protein) || 0,
      totalCarbs: parseFloat(recipeForm.carbs) || 0,
      totalFat: parseFloat(recipeForm.fat) || 0,
    };
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
    handleAddSavedFood,
    handleEditFood,
    handleAddRecipe,
    handleEditRecipe,
    openNewFoodForm,
    openNewRecipeForm,
    setEditingFoodId,
  };
}
