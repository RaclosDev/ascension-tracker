import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NUTRITION_DAYS } from '@/lib/coach/nutritionDraft';
import type { NutritionPlan } from '@/lib/coach/nutritionPlan';

type Plan = Pick<NutritionPlan, 'training' | 'rest' | 'notes' | 'meals'>;
const servings = (value: number) => `${value} ${value === 1 ? 'ración' : 'raciones'}`;

/** The whole plan written out, for the preview before publishing and for past versions. */
export function NutritionPlanSummary({ plan }: { plan: Plan }) {
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
                      {servings(meal.servings)} · {meal.kcal} kcal
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

/** The active plan in a strip: the targets of each kind of day, with its dishes one click away. */
export function NutritionPlanBrief({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="plan-brief">
      <div className="plan-brief-days">
        {NUTRITION_DAYS.map((day) => {
          const target = plan[day.key];
          const meals = plan.meals.filter((meal) => meal.dayType === day.type);
          const shown = open === day.key;
          return (
            <section key={day.key} className="plan-brief-day">
              <h3>{day.label}</h3>
              <p className="plan-brief-kcal">
                <b>{target.kcal.toLocaleString('es-ES')}</b> kcal
              </p>
              <dl className="plan-brief-macros">
                <div>
                  <dt>Proteína</dt>
                  <dd>{target.protein} g</dd>
                </div>
                <div>
                  <dt>Carbohidratos</dt>
                  <dd>{target.carbs} g</dd>
                </div>
                <div>
                  <dt>Grasa</dt>
                  <dd>{target.fat} g</dd>
                </div>
              </dl>
              {meals.length > 0 ? (
                <button
                  type="button"
                  className="plan-brief-toggle"
                  aria-expanded={shown}
                  aria-controls={`plan-brief-${day.key}`}
                  onClick={() => setOpen(shown ? null : day.key)}
                >
                  {meals.length === 1 ? '1 plato pautado' : `${meals.length} platos pautados`}
                  <ChevronDown size={16} aria-hidden />
                </button>
              ) : (
                <p className="plan-brief-none">Sin platos pautados</p>
              )}
              {shown && (
                <ul id={`plan-brief-${day.key}`} className="plan-brief-meals">
                  {meals.map((meal, index) => (
                    <li key={index}>
                      <span className="plan-brief-slot">{meal.slotName}</span>
                      <span className="plan-brief-dish">
                        {meal.name}
                        <small>
                          {servings(meal.servings)} · P {meal.protein} · C {meal.carbs} · G{' '}
                          {meal.fat} g
                        </small>
                        {meal.description && <small>{meal.description}</small>}
                      </span>
                      <span className="plan-brief-meal-kcal">{meal.kcal} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      {plan.notes && (
        <p className="plan-brief-notes">
          <b>Pautas generales</b> {plan.notes}
        </p>
      )}
    </div>
  );
}
