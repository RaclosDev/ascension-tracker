import { NUTRITION_DAYS } from '@/lib/coach/nutritionDraft';
import type { NutritionPlan } from '@/lib/coach/nutritionPlan';

export function NutritionPlanSummary({
  plan,
}: {
  plan: Pick<NutritionPlan, 'training' | 'rest' | 'notes' | 'meals'>;
}) {
  return (
    <div className="plan-summary">
      {plan.notes && (
        <div className="plan-summary-notes">
          <h3>Pautas generales</h3>
          <p>{plan.notes}</p>
        </div>
      )}
      <div className="plan-summary-days">
        {NUTRITION_DAYS.map((day) => (
          <section key={day.key} className="plan-summary-day">
            <h3>{day.label}</h3>
            <p className="plan-summary-kcal">{plan[day.key].kcal} kcal</p>
            <p className="plan-summary-macros">
              P {plan[day.key].protein} g · C {plan[day.key].carbs} g · G {plan[day.key].fat} g
            </p>
            <ul>
              {plan.meals
                .filter((meal) => meal.dayType === day.type)
                .map((meal, index) => (
                  <li key={index}>
                    <p className="plan-summary-meal">
                      {meal.slotName}: {meal.name}
                    </p>
                    <p>
                      {meal.servings} {meal.servings === 1 ? 'ración' : 'raciones'} · {meal.kcal}{' '}
                      kcal
                    </p>
                    <p>
                      P {meal.protein} g · C {meal.carbs} g · G {meal.fat} g
                    </p>
                    {meal.description && <p className="plan-summary-text">{meal.description}</p>}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
