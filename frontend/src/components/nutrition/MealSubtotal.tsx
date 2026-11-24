import type { Macros } from '../../types/api';
import { MacroLine } from './MacroLine';

export function MealSubtotal({
  mealSubtotal,
  isCollapsed,
}: {
  mealSubtotal: Macros;
  isCollapsed: boolean;
}) {
  return (
    <div style={{ marginBottom: isCollapsed ? '0' : '0.75rem' }}>
      <MacroLine
        kcal={mealSubtotal.kcal}
        protein={mealSubtotal.protein}
        carbs={mealSubtotal.carbs}
        fat={mealSubtotal.fat}
      />
    </div>
  );
}
