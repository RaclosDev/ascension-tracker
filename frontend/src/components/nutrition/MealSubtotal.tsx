import type { Macros } from '../../types/api';
export function MealSubtotal({
  mealSubtotal,
  isCollapsed,
}: {
  mealSubtotal: Macros;
  isCollapsed: boolean;
}) {
  return (
    <div className="meal-subtotal-row" style={{ marginBottom: isCollapsed ? '0' : '0.75rem' }}>
      <span className="subtotal-val kcal">{Math.round(mealSubtotal.kcal)} kcal</span>
      <span className="subtotal-dot"></span>
      <span className="subtotal-val">P: {mealSubtotal.protein.toFixed(1)}g</span>
      <span className="subtotal-dot"></span>
      <span className="subtotal-val">C: {mealSubtotal.carbs.toFixed(1)}g</span>
      <span className="subtotal-dot"></span>
      <span className="subtotal-val">G: {mealSubtotal.fat.toFixed(1)}g</span>
    </div>
  );
}
