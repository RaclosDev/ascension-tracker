export interface BackupPreview {
  version: string;
  exportedAt?: string;
  userEmail?: string;
  workoutsCount: number;
  customExercisesCount: number;
  workoutTemplatesCount: number;
  foodLogsCount: number;
  recipesCount: number;
  weightEntriesCount: number;
  stepsEntriesCount: number;
  hasSettings: boolean;
  rawPayload: unknown;
}

export function parseBackupPreview(text: string): BackupPreview {
  const json: unknown = JSON.parse(text);
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('El archivo no contiene un objeto JSON válido');
  }
  const data = json as Record<string, unknown>;
  if (data.version !== '1.0') {
    throw new Error('Versión de copia de seguridad no compatible (se requiere versión 1.0)');
  }
  const count = (key: string) => (Array.isArray(data[key]) ? data[key].length : 0);
  return {
    version: data.version,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : undefined,
    userEmail: typeof data.userEmail === 'string' ? data.userEmail : undefined,
    workoutsCount: count('workouts'),
    customExercisesCount: count('customExercises'),
    workoutTemplatesCount: count('workoutTemplates'),
    foodLogsCount: count('foodLogs'),
    recipesCount: count('recipes'),
    weightEntriesCount: count('weightEntries'),
    stepsEntriesCount: count('stepsEntries'),
    hasSettings: Boolean(data.userSettings),
    rawPayload: json,
  };
}
