export function getSanitizedKcal(nutriments) {
  if (!nutriments) return 0;

  let kcal = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0);
  const protein = Number(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0);
  const carbs = Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0);
  const fat = Number(nutriments['fat_100g'] ?? nutriments['fat'] ?? 0);

  // Calculate theoretical calories from macros (Atwater system)
  const theoreticalKcal = (protein * 4) + (carbs * 4) + (fat * 9);

  // If the reported kcal is extremely off (e.g., they accidentally put kJ instead of kcal
  // or just completely bad data), use the theoretical calculation.
  // 1 kcal = 4.184 kJ. So if they put kJ, the value will be ~4.18x higher than theoretical.
  // We'll replace it if the difference is more than 30% and theoretical > 0.
  if (theoreticalKcal > 0) {
    const errorMargin = Math.abs(kcal - theoreticalKcal) / theoreticalKcal;
    if (errorMargin > 0.3) {
      return Math.round(theoreticalKcal);
    }
  }

  return Math.round(kcal);
}

export function extractPortions(product) {
  const portions = [];
  
  // Try to parse 'quantity' e.g. "4 x 125 g" or "125g"
  if (product.quantity) {
    const match = product.quantity.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*g/i);
    if (match) {
      const amount = Number(match[2]);
      if (amount > 0) {
        portions.push({ label: `1 ud (${amount}g)`, amount });
      }
    } else {
      const matchSingle = product.quantity.match(/(\d+(?:\.\d+)?)\s*g/i);
      if (matchSingle) {
        const amount = Number(matchSingle[1]);
        if (amount > 0) {
          portions.push({ label: `1 ud (${amount}g)`, amount });
        }
      }
    }
  }

  // Also check product_quantity e.g. 500
  if (product.product_quantity) {
    const amount = Number(product.product_quantity);
    if (amount > 0 && !portions.some(p => p.amount === amount)) {
      portions.push({ label: `Envase total (${amount}g)`, amount });
    }
  }
  
  return portions;
}
