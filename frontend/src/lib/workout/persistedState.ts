const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
const optionalString = (value: unknown) => value == null || typeof value === 'string';
const optionalNumber = (value: unknown) => value == null || finite(value);

function validSet(value: unknown): boolean {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    ['normal', 'warmup', 'drop', 'failure'].includes(String(value.type)) &&
    typeof value.weight === 'string' &&
    typeof value.reps === 'string' &&
    typeof value.completed === 'boolean' &&
    ['distance', 'duration', 'rpe'].every((key) => optionalString(value[key]))
  );
}

function validExercise(value: unknown): boolean {
  return (
    record(value) &&
    typeof value.id === 'string' &&
    typeof value.exerciseId === 'string' &&
    optionalString(value.notes) &&
    optionalString(value.supersetId) &&
    (value.variant == null ||
      (record(value.variant) &&
        optionalString(value.variant.grip) &&
        optionalString(value.variant.machine))) &&
    Array.isArray(value.sets) &&
    value.sets.every(validSet)
  );
}

function validActive(value: unknown): boolean {
  return (
    value === null ||
    (record(value) &&
      typeof value.name === 'string' &&
      finite(value.startedAt) &&
      optionalNumber(value.editingFinishedAt) &&
      optionalString(value.notes) &&
      optionalString(value.editingId) &&
      Array.isArray(value.exercises) &&
      value.exercises.every(validExercise))
  );
}

// Whitelist persisted fields: Zustand shallow-merges this data with callable store actions.
export function validatePersistedWorkout(raw: string): string {
  const parsed: unknown = JSON.parse(raw);
  if (!record(parsed) || !record(parsed.state)) throw new Error('Invalid persisted workout');
  const state = parsed.state;
  const validators: Record<string, (value: unknown) => boolean> = {
    active: validActive,
    restUntil: (value) => value === null || finite(value),
    restPreset: finite,
    restTimers: (value) => record(value) && Object.values(value).every(finite),
    tab: (value) =>
      typeof value === 'string' &&
      ['home', 'train', 'templates', 'history', 'exercises'].includes(value),
    settings: (value) =>
      record(value) && (value.showRpe === undefined || typeof value.showRpe === 'boolean'),
    hiddenEquipments: (value) =>
      Array.isArray(value) && value.every((item: unknown) => typeof item === 'string'),
  };
  const validated: Record<string, unknown> = {};
  for (const [key, validate] of Object.entries(validators)) {
    if (state[key] === undefined) continue;
    if (!validate(state[key])) throw new Error(`Invalid persisted field: ${key}`);
    validated[key] = state[key];
  }
  return JSON.stringify({ state: validated, version: parsed.version });
}
