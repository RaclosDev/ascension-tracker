import type { CompletedWorkout } from './workout/types';

export type Lift = 'squat' | 'bench' | 'deadlift';

export const LIFT_LABELS: Record<Lift, string> = {
  squat: 'Sentadilla',
  bench: 'Press banca',
  deadlift: 'Peso muerto',
};

/** Catalog ids that count as competition lifts (back squat, flat bench, conventional and sumo). */
const LIFT_EXERCISES: Record<Lift, string[]> = {
  squat: [
    'base-cuadriceps-sentadilla-libre-barra',
    'ex-0043', // Barbell full squat
    'ex-1461',
    'ex-1462',
    'ex-1435', // low bar
    'ex-1436', // high bar
  ],
  bench: ['base-pecho-press-de-pecho-plano-barra', 'ex-0025'],
  deadlift: ['base-lumbares-peso-muerto-tradicional-barra', 'ex-0032', 'ex-0117'],
};

const LIFT_BY_EXERCISE = new Map<string, Lift>(
  (Object.keys(LIFT_EXERCISES) as Lift[]).flatMap((lift) =>
    LIFT_EXERCISES[lift].map((id) => [id, lift] as const),
  ),
);

/** Estimated one-rep max (Epley). Sets above 10 reps are too unreliable to estimate a max. */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1) return null;
  if (reps > 10) return null;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export interface LiftBest {
  /** Best estimated 1RM, rounded to 0.5 kg. */
  e1rm: number;
  /** Heaviest single actually lifted, if any. */
  actual: number | null;
  date: number;
}

function recordedNumber(value: unknown): number {
  if (typeof value !== 'string') return NaN;
  const normalized = value.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

export function recordedPowerSets(
  history: CompletedWorkout[],
  mappings: import('./coach/powerlifting').PowerExerciseMapping[] = [],
  includeVariations = false,
) {
  return history.flatMap((workout) => {
    if (!Number.isFinite(workout.startedAt)) return [];
    return workout.exercises.flatMap((exercise) => {
      const mapping = mappings.find(
        (m) =>
          m.exerciseId === exercise.exerciseId &&
          (m.grip ?? '') === (exercise.variant?.grip ?? '') &&
          (m.machine ?? '') === (exercise.variant?.machine ?? ''),
      );
      const lift = mapping
        ? mapping.kind === 'EXCLUDE' || (mapping.kind === 'VARIATION' && !includeVariations)
          ? undefined
          : (mapping.lift.toLowerCase() as Lift)
        : LIFT_BY_EXERCISE.get(exercise.exerciseId);
      if (!lift) return [];
      return exercise.sets.flatMap((set) => {
        const weight = recordedNumber(set.weight);
        const reps = recordedNumber(set.reps);
        if (
          !set.completed ||
          set.type === 'warmup' ||
          !Number.isFinite(weight) ||
          weight <= 0 ||
          !Number.isInteger(reps) ||
          reps <= 0
        )
          return [];
        const rpe = recordedNumber(set.rpe ?? '');
        return [
          {
            lift,
            weight,
            reps,
            rpe: rpe >= 1 && rpe <= 10 ? rpe : null,
            date: workout.startedAt,
            workoutId: workout.id,
          },
        ];
      });
    });
  });
}

export function bestLifts(history: CompletedWorkout[]): Partial<Record<Lift, LiftBest>> {
  const best: Partial<Record<Lift, LiftBest>> = {};
  for (const set of recordedPowerSets(history)) {
    const { weight, reps, lift } = set;
    const e1rm = estimateOneRepMax(weight, reps);
    if (e1rm == null) continue;
    const current = best[lift];
    const rounded = Math.round(e1rm * 2) / 2;
    const actual = reps === 1 ? weight : null;
    if (!current || rounded > current.e1rm) {
      best[lift] = {
        e1rm: rounded,
        actual: Math.max(actual ?? 0, current?.actual ?? 0) || null,
        date: set.date,
      };
    } else if (actual && actual > (current.actual ?? 0)) {
      current.actual = actual;
    }
  }
  return best;
}

const DOTS = {
  M: { a: -0.000001093, b: 0.0007391293, c: -0.1918759221, d: 24.0900756, e: -307.75076, max: 210 },
  F: { a: -0.0000010706, b: 0.0005158568, c: -0.1126655495, d: 13.6175032, e: -57.96288, max: 150 },
};

/** DOTS score: a total compared across bodyweights. Null without sex or bodyweight. */
export function dotsScore(total: number, bodyweight: number | undefined, sex: string | undefined) {
  if (
    !Number.isFinite(total) ||
    total <= 0 ||
    bodyweight === undefined ||
    !Number.isFinite(bodyweight) ||
    bodyweight <= 0 ||
    (sex !== 'M' && sex !== 'F')
  )
    return null;
  const k = DOTS[sex];
  const bw = Math.min(Math.max(bodyweight, 40), k.max);
  const denominator = k.a * bw ** 4 + k.b * bw ** 3 + k.c * bw ** 2 + k.d * bw + k.e;
  return Math.round(((total * 500) / denominator) * 10) / 10;
}
