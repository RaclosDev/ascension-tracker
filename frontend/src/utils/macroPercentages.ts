/** The server accepts a macro split that adds up to 100 % within half a point. */
const MACRO_PCT_TOLERANCE = 0.5;

/** Message for a macro split that does not add up to 100 % (±0.5), or null when it is fine. */
export function macroPercentagesError(protein: number, fat: number, carbs: number): string | null {
  const total = Math.round((protein + fat + carbs) * 10) / 10;
  if (Math.abs(total - 100) <= MACRO_PCT_TOLERANCE) return null;
  return `El reparto de macros debe sumar 100 % (ahora suma ${total} %)`;
}
