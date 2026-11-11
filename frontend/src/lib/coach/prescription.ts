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
export function resolvedWeight(load?: PrescribedLoad | null): number | null {
  return load?.mode === 'KG' ? load.amount : (load?.resolvedKg ?? null);
}
