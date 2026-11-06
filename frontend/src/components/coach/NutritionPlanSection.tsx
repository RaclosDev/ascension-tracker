import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage, formatCoachDate } from '@/lib/coach/api';
import { useCoachRecipes, type CoachRecipe } from '@/lib/coach/coachRecipes';
import {
  dayKcal,
  useCoachNutritionPlan,
  useEndNutritionPlan,
  useSetNutritionPlan,
  type DayGrams,
  type DayType,
  type MealRequest,
  type NutritionPlan,
} from '@/lib/coach/nutritionPlan';

const DAYS = [
  { key: 'training', type: 'TRAINING', label: 'Día de entreno' },
  { key: 'rest', type: 'REST', label: 'Día de descanso' },
] as const;
const MAX_MEALS = 20;

interface MealDraft {
  id: number;
  dayType: DayType;
  slotName: string;
  /** null: the prescribed recipe was deleted, or none chosen yet. */
  recipeId: string | null;
  deletedName: string | null;
  servings: string;
}

let nextMealId = 0;
const toMealDrafts = (plan: NutritionPlan | null): MealDraft[] =>
  (plan?.meals ?? []).map((meal) => ({
    id: nextMealId++,
    dayType: meal.dayType,
    slotName: meal.slotName,
    recipeId: meal.recipeId,
    deletedName: meal.recipeId ? null : meal.name,
    servings: String(meal.servings),
  }));

const parseServings = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(n) && n >= 0.25 && n <= 10 ? n : null;
};

const toMealRequest = (meal: MealDraft): MealRequest | null => {
  const servings = parseServings(meal.servings);
  if (!meal.recipeId || !meal.slotName.trim() || servings == null) return null;
  return {
    dayType: meal.dayType,
    slotName: meal.slotName.trim(),
    recipeId: meal.recipeId,
    servings,
  };
};
const MACROS = [
  { key: 'protein', label: 'Proteína' },
  { key: 'carbs', label: 'Carbohidratos' },
  { key: 'fat', label: 'Grasa' },
] as const;

type Draft = Record<'training' | 'rest', Record<keyof DayGrams, string>>;

const toDraft = (plan: NutritionPlan | null | undefined): Draft => {
  const grams = (day: 'training' | 'rest') => ({
    protein: plan ? String(plan[day].protein) : '',
    carbs: plan ? String(plan[day].carbs) : '',
    fat: plan ? String(plan[day].fat) : '',
  });
  return { training: grams('training'), rest: grams('rest') };
};

const parseGrams = (value: string) => {
  const n = Number(value);
  return value.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 1000 ? n : null;
};

const parseDay = (day: Record<keyof DayGrams, string>): DayGrams | null => {
  const protein = parseGrams(day.protein);
  const carbs = parseGrams(day.carbs);
  const fat = parseGrams(day.fat);
  if (protein == null || carbs == null || fat == null || protein + carbs + fat === 0) return null;
  return { protein, carbs, fat };
};

/** The calorie and macro targets the coach sets, per training and rest day. */
export function NutritionPlanSection({ linkId, canEdit }: { linkId: string; canEdit: boolean }) {
  const plan = useCoachNutritionPlan(linkId);

  if (plan.isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (plan.isError) return <p role="alert">No se pudo cargar la pauta de nutrición.</p>;
  return (
    <PlanForm
      key={plan.data?.id ?? 'none'}
      linkId={linkId}
      plan={plan.data ?? null}
      canEdit={canEdit}
    />
  );
}

function PlanForm({
  linkId,
  plan,
  canEdit,
}: {
  linkId: string;
  plan: NutritionPlan | null;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState(() => toDraft(plan));
  const [notes, setNotes] = useState(plan?.notes ?? '');
  const [meals, setMeals] = useState(() => toMealDrafts(plan));
  const recipes = useCoachRecipes();
  const save = useSetNutritionPlan(linkId);
  const end = useEndNutritionPlan(linkId);
  const training = parseDay(draft.training);
  const rest = parseDay(draft.rest);
  const busy = save.isPending || end.isPending;
  const mealRequests = meals.map(toMealRequest);
  const mealsValid = mealRequests.every((meal) => meal !== null);

  if (!canEdit && !plan) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Sin pauta de nutrición. Tu alumno no te ha dado permiso para pautarla.
      </p>
    );
  }

  const submit = () => {
    if (!training || !rest || !mealsValid) return;
    save.mutate(
      { training, rest, notes: notes.trim() || null, meals: mealRequests as MealRequest[] },
      {
        onSuccess: () => toast.success('Pauta de nutrición guardada'),
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar la pauta')),
      },
    );
  };

  const remove = () =>
    end.mutate(undefined, {
      onSuccess: () => toast.success('Pauta de nutrición retirada'),
      onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo retirar la pauta')),
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {plan
          ? `Pauta activa desde ${formatCoachDate(plan.createdAt)}. Sustituye los objetivos de tu alumno.`
          : 'Sin pauta: tu alumno usa sus propios objetivos.'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {DAYS.map((day) => {
          const parsed = day.key === 'training' ? training : rest;
          return (
            <fieldset key={day.key} className="flex flex-col gap-2" disabled={!canEdit || busy}>
              <legend className="font-semibold text-white mb-1">{day.label}</legend>
              {MACROS.map((macro) => (
                <label key={macro.key} className="flex items-center justify-between gap-3 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{macro.label} (g)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000}
                    step={1}
                    className="w-24 rounded-lg px-3 py-2 bg-black/20 border text-right"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    aria-label={`${macro.label} ${day.label.toLowerCase()}`}
                    value={draft[day.key][macro.key]}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [day.key]: { ...d[day.key], [macro.key]: e.target.value },
                      }))
                    }
                  />
                </label>
              ))}
              <p className="text-sm font-bold text-white">
                {parsed ? `${dayKcal(parsed)} kcal` : 'Gramos enteros entre 0 y 1000'}
              </p>
              <DayMeals
                day={day}
                meals={meals}
                recipes={recipes.data ?? []}
                canEdit={canEdit}
                onChange={setMeals}
              />
            </fieldset>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>Notas para tu alumno</span>
        <textarea
          className="rounded-lg px-3 py-2 bg-black/20 border min-w-0"
          style={{ borderColor: 'var(--border-subtle)' }}
          rows={2}
          maxLength={1000}
          disabled={!canEdit || busy}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !training || !rest || !mealsValid}
            onClick={submit}
          >
            Guardar pauta
          </button>
          {plan && (
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={remove}>
              Quitar pauta
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DayMeals({
  day,
  meals,
  recipes,
  canEdit,
  onChange,
}: {
  day: (typeof DAYS)[number];
  meals: MealDraft[];
  recipes: CoachRecipe[];
  canEdit: boolean;
  onChange: (update: (meals: MealDraft[]) => MealDraft[]) => void;
}) {
  const own = meals.filter((meal) => meal.dayType === day.type);
  const dayLabel = day.label.toLowerCase();
  const patch = (id: number, change: Partial<MealDraft>) =>
    onChange((all) => all.map((meal) => (meal.id === id ? { ...meal, ...change } : meal)));
  const input = 'rounded-lg px-3 py-2 bg-black/20 border min-w-0';
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
            </select>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {meal.deletedName
                ? 'Receta borrada: elige otra o quita la comida.'
                : recipe && servings != null
                  ? `${Math.round(recipe.kcal * servings)} kcal`
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
                id: nextMealId++,
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
