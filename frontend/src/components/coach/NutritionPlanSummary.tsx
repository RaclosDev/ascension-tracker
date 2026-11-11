import { NUTRITION_DAYS } from '@/lib/coach/nutritionDraft';
import type { NutritionPlan } from '@/lib/coach/nutritionPlan';

export function NutritionPlanSummary({
  plan,
}: {
  plan: Pick<NutritionPlan, 'training' | 'rest' | 'notes' | 'meals'>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {NUTRITION_DAYS.map((day) => (
          <section key={day.key} className="min-w-0 rounded-lg border p-3">
            <h3 className="font-semibold text-foreground">{day.label}</h3>
            <p className="font-bold">{plan[day.key].kcal} kcal</p>
            <p className="text-sm">
              P {plan[day.key].protein} g · C {plan[day.key].carbs} g · G {plan[day.key].fat} g
            </p>
            <ul className="flex flex-col gap-3 mt-3">
              {plan.meals
                .filter((meal) => meal.dayType === day.type)
                .map((meal, index) => (
                  <li key={index}>
                    <p className="font-semibold text-sm break-words">
                      {meal.slotName}: {meal.name}
                    </p>
                    <p className="text-sm">
                      {meal.servings} raciones · {meal.kcal} kcal
                    </p>
                    <p className="text-xs">
                      P {meal.protein} g · C {meal.carbs} g · G {meal.fat} g
                    </p>
                    {meal.description && (
                      <p className="text-sm whitespace-pre-wrap break-words">{meal.description}</p>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      {plan.notes && <p className="text-sm whitespace-pre-wrap break-words">{plan.notes}</p>}
    </div>
  );
}
