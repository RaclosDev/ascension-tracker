/**
 * Qué partes de la app quiere usar cada persona. El entreno siempre está; nutrición y
 * «peso y medidas» (tracking) son opcionales. Sin valor guardado = todo, como antes.
 */
export type AppModules = 'TRAINING' | 'TRAINING_NUTRITION' | 'TRAINING_BODY' | 'FULL';

export const APP_MODULE_OPTIONS: { value: AppModules; label: string; description: string }[] = [
  {
    value: 'TRAINING',
    label: 'Solo entreno',
    description: 'Rutinas, series y marcas. Sin dieta ni medidas.',
  },
  {
    value: 'TRAINING_NUTRITION',
    label: 'Entreno + nutrición',
    description: 'Añade calorías, macros y comidas.',
  },
  {
    value: 'TRAINING_BODY',
    label: 'Entreno + peso y medidas',
    description: 'Añade el seguimiento semanal del peso y las medidas.',
  },
  {
    value: 'FULL',
    label: 'Todo',
    description: 'Entreno, nutrición y seguimiento del cuerpo.',
  },
];

export function normalizeModules(value: string | null | undefined): AppModules {
  return APP_MODULE_OPTIONS.some((o) => o.value === value) ? (value as AppModules) : 'FULL';
}

export function hasNutrition(value: string | null | undefined) {
  const m = normalizeModules(value);
  return m === 'FULL' || m === 'TRAINING_NUTRITION';
}

export function hasBodyTracking(value: string | null | undefined) {
  const m = normalizeModules(value);
  return m === 'FULL' || m === 'TRAINING_BODY';
}

/** Whether a main navigation entry belongs to a module the user switched off. */
export function isPathEnabled(path: string, value: string | null | undefined) {
  if (path === '/nutrition') return hasNutrition(value);
  if (path === '/tracking') return hasBodyTracking(value);
  return true;
}
