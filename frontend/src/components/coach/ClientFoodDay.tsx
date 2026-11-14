import { useClientData } from '../../lib/coach/api';
import type { FoodLog } from '../../types/api';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { MealSubtotal } from '../nutrition/MealSubtotal';
import { MealIcon } from '../MealIcon';

export function ClientFoodDay({ linkId, date }: { linkId: string; date: string }) {
  const query = useClientData<FoodLog[]>(linkId, `nutrition/logs?date=${date}`, true);
  const logs = query.data ?? [];
  const groups = new Map<string, FoodLog[]>();
  for (const log of logs) {
    const key = log.mealKey ?? JSON.stringify([log.mealIndex, log.mealName, log.mealIcon]);
    groups.set(key, [...(groups.get(key) ?? []), log]);
  }
  const total = (items: FoodLog[]) =>
    items.reduce(
      (sum, log) => ({
        kcal: sum.kcal + (Number(log.kcal) || 0),
        protein: sum.protein + (Number(log.protein) || 0),
        carbs: sum.carbs + (Number(log.carbs) || 0),
        fat: sum.fat + (Number(log.fat) || 0),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  if (query.isPending) return <p role="status">Cargando comidas…</p>;
  if (query.isError)
    return <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />;
  if (!logs.length)
    return (
      <div className="coach-quick-empty">
        <h3>Sin comidas registradas</h3>
      </div>
    );
  return (
    <>
      <section className="coach-quick-daily-total" aria-label="Total registrado del día">
        <h3>Total del día</h3>
        <MealSubtotal mealSubtotal={total(logs)} isCollapsed />
      </section>
      <div className="coach-quick-meals">
        {[...groups].map(([key, items]) => (
          <section key={key} className="card coach-quick-meal">
            <h3>
              <MealIcon iconString={items[0].mealIcon ?? ''} />
              {items[0].mealName || `Comida ${items[0].mealIndex + 1}`}
            </h3>
            <MealSubtotal mealSubtotal={total(items)} isCollapsed={false} />
            <ul className="coach-quick-foods">
              {items.map((log, i) => (
                <li key={log.id ?? i}>
                  <div>
                    <strong>{log.product}</strong>
                    <span className="coach-muted">{log.quantity} g</span>
                  </div>
                  <div className="coach-quick-food-nutrients">
                    <strong>{Math.round(log.kcal)} kcal</strong>
                    <span className="coach-muted">
                      P {log.protein.toFixed(1)} · C {log.carbs.toFixed(1)} · G {log.fat.toFixed(1)}{' '}
                      g
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
