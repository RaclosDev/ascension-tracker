import type { FoodLog, Meal } from '../types/api';

export function belongsToMeal(log: FoodLog, meal: Meal, index: number): boolean {
  return log.mealKey ? log.mealKey === meal.mealKey : log.mealIndex === index;
}

export function groupMealLogs(meals: Meal[], logs: FoodLog[]) {
  const active = meals.map(() => [] as FoodLog[]);
  const indexByKey = new Map(
    meals.flatMap((meal, index) => (meal.mealKey ? [[meal.mealKey, index] as const] : [])),
  );
  const historical = new Map<string, { key: string; meal: Meal; logs: FoodLog[] }>();
  for (const log of logs) {
    const index = log.mealKey ? indexByKey.get(log.mealKey) : log.mealIndex;
    if (index !== undefined && index >= 0 && index < meals.length) {
      active[index].push(log);
      continue;
    }
    const key = JSON.stringify([log.mealKey ?? null, log.mealName ?? null, log.mealIcon ?? null]);
    let group = historical.get(key);
    if (!group) {
      group = {
        key,
        meal: { name: log.mealName || 'Comida anterior', icon: log.mealIcon || undefined },
        logs: [],
      };
      historical.set(key, group);
    }
    group.logs.push(log);
  }
  return { active, historical: [...historical.values()] };
}
