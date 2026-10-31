function nonNegativeFinite(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') return 0;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

export function getSanitizedKcal(nutriments: Record<string, unknown> | undefined) {
  if (!nutriments) return 0;

  const kcal = nonNegativeFinite(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0);
  const protein = nonNegativeFinite(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0);
  const carbs = nonNegativeFinite(
    nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0,
  );
  const fat = nonNegativeFinite(nutriments['fat_100g'] ?? nutriments['fat'] ?? 0);

  // Calculate theoretical calories from macros (Atwater system)
  const theoreticalKcal = protein * 4 + carbs * 4 + fat * 9;

  // Reported kcal more than 30% off the Atwater estimate is usually kJ entered as kcal
  // (about 4.18x) or bad data, so the estimate wins.
  if (Number.isFinite(theoreticalKcal) && theoreticalKcal > 0) {
    const errorMargin = Math.abs(kcal - theoreticalKcal) / theoreticalKcal;
    if (errorMargin > 0.3) {
      return Math.round(theoreticalKcal);
    }
  }

  return Math.round(kcal);
}

export function extractPortions(product: Record<string, unknown>) {
  const portions: { label: string; amount: number; isBase?: boolean }[] = [];

  // Try to parse 'quantity' e.g. "4 x 125 g" or "125g"
  if (product.quantity && typeof product.quantity === 'string') {
    const match = product.quantity.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*g/i);
    if (match) {
      const amount = Number(match[2]);
      if (Number.isFinite(amount) && amount > 0) {
        portions.push({ label: `1 ud (${amount}g)`, amount });
      }
    } else {
      const matchSingle = product.quantity.match(/(\d+(?:\.\d+)?)\s*g/i);
      if (matchSingle) {
        const amount = Number(matchSingle[1]);
        if (Number.isFinite(amount) && amount > 0) {
          portions.push({ label: `1 ud (${amount}g)`, amount });
        }
      }
    }
  }

  // OFF normalizes mass to g and volume to ml; volume cannot become grams.
  if (product.product_quantity && product.product_quantity_unit === 'g') {
    const amount = Number(product.product_quantity);
    if (
      Number.isFinite(amount) &&
      amount > 0 &&
      !portions.some((p: { amount: number }) => p.amount === amount)
    ) {
      portions.push({ label: `Envase total (${amount}g)`, amount });
    }
  }

  return portions;
}
