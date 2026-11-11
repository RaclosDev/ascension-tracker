import type { DayGrams, DayType, NutritionPlan, NutritionPlanRequest } from './nutritionPlan';
import { dayKcal } from './nutritionPlan';
import type { CoachRecipe } from './coachRecipes';

export function mealNutrition(recipe: DayGrams, servings: number) {
  const roundedServings = Math.round(servings * 100) / 100;
  const grams = (value: number) => Math.round(value * roundedServings * 10) / 10;
  const protein = grams(recipe.protein);
  const carbs = grams(recipe.carbs);
  const fat = grams(recipe.fat);
  return { protein, carbs, fat, kcal: Math.round(dayKcal({ protein, carbs, fat })) };
}

export const NUTRITION_DAYS = [
  { key: 'training', type: 'TRAINING', label: 'Día de entreno' },
  { key: 'rest', type: 'REST', label: 'Día de descanso' },
] as const;
export const NUTRITION_MACROS = [
  { key: 'protein', label: 'Proteína' },
  { key: 'carbs', label: 'Carbohidratos' },
  { key: 'fat', label: 'Grasa' },
] as const;
export const MAX_MEALS = 20;

export interface MealDraft {
  id: string;
  dayType: DayType;
  slotName: string;
  recipeId: string | null;
  deletedName: string | null;
  servings: string;
}

export interface NutritionDraft {
  training: Record<keyof DayGrams, string>;
  rest: Record<keyof DayGrams, string>;
  notes: string;
  meals: MealDraft[];
}

export const nutritionDraft = (
  plan: Pick<NutritionPlan, 'training' | 'rest' | 'notes' | 'meals'> | null,
): NutritionDraft => {
  const grams = (day: 'training' | 'rest') => ({
    protein: plan ? String(plan[day].protein) : '',
    carbs: plan ? String(plan[day].carbs) : '',
    fat: plan ? String(plan[day].fat) : '',
  });
  return {
    training: grams('training'),
    rest: grams('rest'),
    notes: plan?.notes ?? '',
    meals: (plan?.meals ?? []).map((meal, index) => ({
      id: String(index),
      dayType: meal.dayType,
      slotName: meal.slotName,
      recipeId: meal.recipeId,
      deletedName: meal.recipeId ? null : meal.name,
      servings: String(meal.servings),
    })),
  };
};

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;
const nullableText = (value: unknown, max: number) => value === null || text(value, max);
const day = (value: unknown) =>
  record(value) && NUTRITION_MACROS.every(({ key }) => text(value[key], 12));

export const isNutritionDraft = (value: unknown): value is NutritionDraft =>
  record(value) &&
  day(value.training) &&
  day(value.rest) &&
  text(value.notes, 1000) &&
  Array.isArray(value.meals) &&
  value.meals.length <= MAX_MEALS &&
  value.meals.every(
    (meal: unknown) =>
      record(meal) &&
      text(meal.id, 50) &&
      (meal.dayType === 'TRAINING' || meal.dayType === 'REST') &&
      text(meal.slotName, 60) &&
      nullableText(meal.recipeId, 100) &&
      nullableText(meal.deletedName, 120) &&
      text(meal.servings, 12),
  );

export const parseServings = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(n) && n >= 0.25 && n <= 10 ? n : null;
};

export const parseDay = (value: Record<keyof DayGrams, string>): DayGrams | null => {
  const values = NUTRITION_MACROS.map(({ key }) => Number(value[key]));
  if (
    NUTRITION_MACROS.some(({ key }) => value[key].trim() === '') ||
    values.some((n) => !Number.isInteger(n) || n < 0 || n > 1000) ||
    values.every((n) => n === 0)
  )
    return null;
  return { protein: values[0], carbs: values[1], fat: values[2] };
};

export function nutritionRequest(draft: NutritionDraft): NutritionPlanRequest | null {
  const training = parseDay(draft.training);
  const rest = parseDay(draft.rest);
  if (!training || !rest) return null;
  const meals = [];
  for (const meal of draft.meals) {
    const servings = parseServings(meal.servings);
    if (!meal.recipeId || !meal.slotName.trim() || servings === null) return null;
    meals.push({
      dayType: meal.dayType,
      slotName: meal.slotName.trim(),
      recipeId: meal.recipeId,
      servings: Math.round(servings * 100) / 100,
    });
  }
  return { training, rest, notes: draft.notes.trim() || null, meals };
}

export function previewNutrition(request: NutritionPlanRequest, recipes: CoachRecipe[]) {
  return {
    training: { ...request.training, kcal: dayKcal(request.training) },
    rest: { ...request.rest, kcal: dayKcal(request.rest) },
    notes: request.notes,
    meals: (request.meals ?? []).flatMap((meal) => {
      const recipe = recipes.find((item) => item.id === meal.recipeId);
      return recipe
        ? [
            {
              ...meal,
              name: recipe.name,
              description: recipe.description,
              ...mealNutrition(recipe, meal.servings),
            },
          ]
        : [];
    }),
  };
}
