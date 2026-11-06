import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react';
import api from '@/api/client';
import { apiErrorMessage } from '@/lib/coach/api';
import { useMyNutritionPlan, type DayType, type PlannedMeal } from '@/lib/coach/nutritionPlan';
import type { Meal } from '@/types/api';

/** 100 "g" per serving: editing the quantity in the diary then scales the macros. */
const GRAMS_PER_SERVING = 100;

const servingsLabel = (servings: number) =>
  `${servings.toLocaleString('es-ES')} ${servings === 1 ? 'ración' : 'raciones'}`;

/** The diary meal a prescribed slot goes to: same name, else the same position. */
export function targetMeal(slotName: string, slotIndex: number, meals: Meal[]) {
  const byName = meals.findIndex(
    (meal) => meal.name.trim().toLowerCase() === slotName.trim().toLowerCase(),
  );
  const index = byName >= 0 ? byName : Math.min(slotIndex, meals.length - 1);
  return { index, meal: meals[index] };
}

/** The meals the coach prescribed for the day, each logged into the diary with one tap. */
export default function PlannedMealsCard({
  date,
  dayType,
  meals,
}: {
  date: string;
  dayType?: DayType | null;
  meals: Meal[];
}) {
  const plan = useMyNutritionPlan();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<number | null>(null);
  // Slots logged in this visit, per date, so a second tap does not log twice by accident.
  const [logged, setLogged] = useState<Record<string, true>>({});

  const all = plan.data?.meals ?? [];
  const day = all.filter((meal) => meal.dayType === (dayType ?? 'REST'));
  if (day.length === 0 || meals.length === 0) return null;

  const log = async (planned: PlannedMeal, slotIndex: number) => {
    const { index, meal } = targetMeal(planned.slotName, slotIndex, meals);
    setPending(slotIndex);
    try {
      await api.post('/nutrition/logs', {
        date,
        mealIndex: index,
        mealKey: meal?.mealKey,
        product: `${planned.name} · ${servingsLabel(planned.servings)}`,
        quantity: Math.round(planned.servings * GRAMS_PER_SERVING),
        kcal: planned.kcal,
        protein: planned.protein,
        carbs: planned.carbs,
        fat: planned.fat,
      });
      setLogged((l) => ({ ...l, [`${date}:${slotIndex}`]: true }));
      toast.success(`${planned.name} registrado en ${meal?.name ?? 'tu diario'}`);
      for (const key of ['nutritionData', 'dashboard', 'trackingWeeks', 'weekSummaries']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    } catch (e) {
      toast.error(apiErrorMessage(e, 'No se pudo registrar la comida'));
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="card mb-4" aria-label="Comidas pautadas">
      <h2 className="card-title mb-2">Comidas pautadas</h2>
      <ul className="flex flex-col gap-2">
        {day.map((planned, slotIndex) => {
          const done = logged[`${date}:${slotIndex}`];
          return (
            <li
              key={`${planned.slotName}-${slotIndex}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>
                  {planned.slotName}
                </div>
                <div className="font-bold text-white truncate">{planned.name}</div>
                <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {servingsLabel(planned.servings)} · {planned.kcal} kcal · P {planned.protein} g ·
                  C {planned.carbs} g · G {planned.fat} g
                </div>
                {planned.description && (
                  <details className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <summary className="cursor-pointer">Preparación</summary>
                    <p className="whitespace-pre-line mt-1">{planned.description}</p>
                  </details>
                )}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                aria-label={done ? `${planned.name} registrado` : `Registrar ${planned.name}`}
                disabled={pending !== null || done}
                onClick={() => log(planned, slotIndex)}
              >
                {done ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
                {done ? 'Hecho' : 'Registrar'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
