import type { PrescribedLoad, ProgramExercise, SetTarget } from './coachPrograms';
const KINDS = { WORK: 'Trabajo', WARMUP: 'Calentamiento', TOP: 'Top set', BACKOFF: 'Back-off' };
export function loadText(load?: PrescribedLoad | null): string {
  if (!load) return '';
  const unit = load.unit === 'EACH' ? ' por mancuerna / lado' : ' totales';
  if (load.mode === 'KG') return `${load.amount} kg${unit}`;
  const lift = { squat: 'sentadilla', bench: 'banca', deadlift: 'peso muerto' }[
    load.lift ?? 'squat'
  ];
  return `${load.amount}% TM ${lift}${load.resolvedKg != null ? ` = ${load.resolvedKg} kg${unit} (TM ${load.referenceKg} kg, ${load.referenceDate})` : ` · redondeo ${load.increment ?? 2.5} kg`}`;
}
export function setText(set: SetTarget, exercise: ProgramExercise): string {
  return [
    KINDS[set.kind],
    set.reps != null ? `${set.reps} reps` : '',
    set.rpe != null ? `RPE ${set.rpe}` : '',
    set.rir != null ? `RIR ${set.rir}` : '',
    loadText(set.load ?? exercise.prescription?.load) || exercise.loadHint,
    set.notes,
  ]
    .filter(Boolean)
    .join(' · ');
}
function resolvedWeight(load?: PrescribedLoad | null): number | null {
  return load?.mode === 'KG' ? load.amount : (load?.resolvedKg ?? null);
}

export function prescribedSet(exercise: ProgramExercise, index: number) {
  const set = exercise.prescription?.sets?.[index];
  const load = set?.load ?? exercise.prescription?.load;
  const min = set?.reps ?? exercise.repsMin ?? exercise.repsMax;
  const max = set?.reps ?? exercise.repsMax ?? exercise.repsMin;
  const rpe = set ? set.rpe : exercise.targetRpe;
  const rir = set ? set.rir : exercise.targetRir;
  const effort =
    rpe != null ? { kind: 'RPE', value: rpe } : rir != null ? { kind: 'RIR', value: rir } : null;
  const weight = resolvedWeight(load);
  const loadLabel =
    load?.mode === 'KG' && load.unit === 'TOTAL'
      ? `${load.amount} kg`
      : loadText(load) || exercise.loadHint || 'Carga libre';
  const repsLabel = min != null ? (min === max ? String(min) : `${min}–${max}`) : null;
  const kindLabel = set && set.kind !== 'WORK' ? KINDS[set.kind] : null;
  return {
    weight,
    min,
    max,
    effort,
    loadLabel,
    repsLabel,
    kindLabel,
    notes: set?.notes,
    warmup: set?.kind === 'WARMUP',
    text: [
      kindLabel,
      loadLabel,
      repsLabel && `${repsLabel} reps`,
      effort && `${effort.kind} ${effort.value}`,
      set?.notes,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}
