/** Distance in UTF-16 code units, using two rows: O(min(a.length, b.length)) memory. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length > b.length) return levenshtein(b, a);
  if (!a.length) return b.length;
  let previous = Array.from({ length: a.length + 1 }, (_, index) => index);
  let current = new Array<number>(a.length + 1);
  for (let row = 1; row <= b.length; row++) {
    current[0] = row;
    for (let column = 1; column <= a.length; column++) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (a.charAt(column - 1) === b.charAt(row - 1) ? 0 : 1),
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[a.length];
}

/**
 * Parámetros para el cálculo de similitud en la fusión de ejercicios.
 */
export interface MergeMatchScoreParams {
  sourceName: string;
  sourceMuscle: string;
  sourceEquipment: string;
  targetName: string;
  targetMuscle: string;
  targetEquipment: string;
  sourceTokens: string[];
  isSearchingOrFiltering: boolean;
}

/**
 * Puntuación heurística para el ranking de candidatos a fusión de ejercicios.
 */
export function calculateMergeMatchScore(params: MergeMatchScoreParams): number {
  let score = 0;
  if (params.targetMuscle === params.sourceMuscle) score += 50;
  if (params.targetEquipment === params.sourceEquipment) score += 20;

  const targetLower = params.targetName.toLowerCase();
  for (const token of params.sourceTokens) {
    if (targetLower.includes(token)) score += 5;
  }

  const dist = levenshtein(params.sourceName.toLowerCase(), targetLower);
  score -= dist * 0.1;

  if (params.isSearchingOrFiltering) {
    score += 1000;
  }

  return score;
}
