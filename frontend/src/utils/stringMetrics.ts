/**
 * Calcula la distancia de Levenshtein entre dos cadenas utilizando
 * programación dinámica con optimización de memoria.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let i = 1; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1, // inserción
          matrix[i - 1][j] + 1, // eliminación
        );
      }
    }
  }

  return matrix[b.length][a.length];
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
