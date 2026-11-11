import { Plus, Trash2 } from 'lucide-react';
import type { CoachRecipe } from '@/lib/coach/coachRecipes';
import { dayKcal } from '@/lib/coach/nutritionPlan';
import {
  NUTRITION_DAYS,
  NUTRITION_MACROS,
  MAX_MEALS,
  mealNutrition,
  parseDay,
  parseServings,
  type MealDraft,
  type NutritionDraft,
} from '@/lib/coach/nutritionDraft';

export function NutritionPlanFields({
  value,
  onChange,
  recipes,
  disabled,
}: {
  value: NutritionDraft;
  onChange: (value: NutritionDraft) => void;
  recipes: CoachRecipe[];
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0 flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUTRITION_DAYS.map((day) => {
          const parsed = parseDay(value[day.key]);
          return (
            <fieldset key={day.key} className="min-w-0 flex flex-col gap-2">
              <legend className="font-semibold text-foreground mb-1">{day.label}</legend>
              {NUTRITION_MACROS.map((macro) => (
                <label key={macro.key} className="flex items-center justify-between gap-3 text-sm">
                  <span>{macro.label} (g)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000}
                    step={1}
                    className="w-24 min-h-11 rounded-lg px-3 py-2 border text-right"
                    aria-label={`${macro.label} ${day.label.toLowerCase()}`}
                    value={value[day.key][macro.key]}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        [day.key]: { ...value[day.key], [macro.key]: event.target.value },
                      })
                    }
                  />
                </label>
              ))}
              <p className="text-sm font-bold text-foreground">
                {parsed ? `${dayKcal(parsed)} kcal` : 'Gramos enteros entre 0 y 1000'}
              </p>
              <DayMeals
                day={day}
                meals={value.meals}
                recipes={recipes}
                canEdit={!disabled}
                onChange={(update) => onChange({ ...value, meals: update(value.meals) })}
              />
            </fieldset>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Notas para tu alumno
        <textarea
          className="rounded-lg px-3 py-2 border min-w-0"
          rows={3}
          maxLength={1000}
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
        />
      </label>
    </fieldset>
  );
}

function DayMeals({
  day,
  meals,
  recipes,
  canEdit,
  onChange,
}: {
  day: (typeof NUTRITION_DAYS)[number];
  meals: MealDraft[];
  recipes: CoachRecipe[];
  canEdit: boolean;
  onChange: (update: (meals: MealDraft[]) => MealDraft[]) => void;
}) {
  const own = meals.filter((meal) => meal.dayType === day.type);
  const dayLabel = day.label.toLowerCase();
  const patch = (id: string, change: Partial<MealDraft>) =>
    onChange((all) => all.map((meal) => (meal.id === id ? { ...meal, ...change } : meal)));
  const input = 'rounded-lg px-3 py-2 border min-w-0 min-h-11';
  const border = { borderColor: 'var(--border-subtle)' };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Comidas pautadas
      </span>
      {own.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sin comidas: solo cuentan los macros.
        </p>
      )}
      {own.map((meal, i) => {
        const recipe = recipes.find((r) => r.id === meal.recipeId);
        const servings = parseServings(meal.servings);
        return (
          <div key={meal.id} className="flex flex-col gap-1 rounded-lg p-2 bg-black/10">
            <div className="flex gap-2">
              <input
                className={`${input} flex-1`}
                style={border}
                maxLength={60}
                placeholder="Desayuno"
                aria-label={`Nombre de la comida ${i + 1} ${dayLabel}`}
                value={meal.slotName}
                onChange={(e) => patch(meal.id, { slotName: e.target.value })}
              />
              <input
                type="number"
                inputMode="decimal"
                min={0.25}
                max={10}
                step={0.25}
                className={`${input} w-20 text-right`}
                style={border}
                aria-label={`Raciones de la comida ${i + 1} ${dayLabel}`}
                value={meal.servings}
                onChange={(e) => patch(meal.id, { servings: e.target.value })}
              />
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  aria-label={`Quitar la comida ${i + 1} ${dayLabel}`}
                  onClick={() => onChange((all) => all.filter((m) => m.id !== meal.id))}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              )}
            </div>
            <select
              className={input}
              style={border}
              aria-label={`Receta de la comida ${i + 1} ${dayLabel}`}
              value={meal.recipeId ?? ''}
              onChange={(e) =>
                patch(meal.id, { recipeId: e.target.value || null, deletedName: null })
              }
            >
              <option value="">
                {meal.deletedName ? `${meal.deletedName} (receta borrada)` : 'Elige una receta'}
              </option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              {meal.recipeId && !recipe && (
                <option value={meal.recipeId}>Receta no disponible</option>
              )}
            </select>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {meal.deletedName || (meal.recipeId && !recipe)
                ? 'Receta no disponible: elige otra o quita la comida.'
                : recipe && servings != null
                  ? `${mealNutrition(recipe, servings).kcal} kcal`
                  : 'Raciones entre 0,25 y 10'}
            </span>
          </div>
        );
      })}
      {canEdit && (
        <button
          type="button"
          className="btn btn-secondary self-start"
          disabled={meals.length >= MAX_MEALS}
          onClick={() =>
            onChange((all) => [
              ...all,
              {
                id: crypto.randomUUID(),
                dayType: day.type,
                slotName: '',
                recipeId: null,
                deletedName: null,
                servings: '1',
              },
            ])
          }
        >
          <Plus size={16} aria-hidden /> Añadir comida
        </button>
      )}
      {canEdit && recipes.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Crea recetas en tu biblioteca para pautar comidas.
        </p>
      )}
    </div>
  );
}
