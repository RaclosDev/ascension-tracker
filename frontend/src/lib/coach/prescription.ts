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
function resolvedWeight(load?: PrescribedLoad | null): number | null {
  return load?.mode === 'KG' ? load.amount : (load?.resolvedKg ?? null);
}

export function prescribedSet(exercise: ProgramExercise, index: number) {
  const set = exercise.prescription?.sets?.[index];
  const load = set?.load ?? exercise.prescription?.load;
  const min = set ? set.reps : (exercise.repsMin ?? exercise.repsMax);
  const max = set ? (set.repsMax ?? set.reps) : (exercise.repsMax ?? exercise.repsMin);
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

export type EffortMethod = 'RIR' | 'RPE' | 'NONE';
export type LoadUnit = PrescribedLoad['unit'];

/** One row per set. Programs saved before the set-by-set editor are expanded from their summary. */
export function rowsOf(exercise: ProgramExercise): SetTarget[] {
  const shared = exercise.prescription?.load ?? null;
  if (exercise.prescription?.sets?.length)
    return exercise.prescription.sets.map((set) => ({ ...set, load: set.load ?? shared }));
  const reps = exercise.repsMin ?? exercise.repsMax;
  const repsMax =
    exercise.repsMax != null && reps != null && exercise.repsMax > reps ? exercise.repsMax : null;
  return Array.from({ length: Math.max(1, exercise.sets) }, () => ({
    kind: 'WORK' as const,
    reps,
    repsMax,
    rpe: exercise.targetRpe,
    rir: exercise.targetRpe != null ? null : exercise.targetRir,
    load: shared,
    notes: null,
  }));
}

/** Stores the rows and keeps the summary columns (sets, rep range, effort) in step with them. */
export function withRows(exercise: ProgramExercise, rows: SetTarget[]): ProgramExercise {
  const work = rows.filter((row) => row.kind !== 'WARMUP');
  const counted = (work.length ? work : rows).filter((row) => row.reps != null);
  const first = work[0] ?? rows[0];
  return {
    ...exercise,
    sets: rows.length,
    repsMin: counted.length ? Math.min(...counted.map((row) => row.reps!)) : null,
    repsMax: counted.length ? Math.max(...counted.map((row) => row.repsMax ?? row.reps!)) : null,
    targetRpe: first?.rpe ?? null,
    targetRir: first?.rpe != null ? null : (first?.rir ?? null),
    prescription: { load: null, sets: rows },
  };
}

/** "8" or "12-15". Returns undefined while the text is not a valid target yet. */
export function parseReps(text: string): Pick<SetTarget, 'reps' | 'repsMax'> | undefined {
  const value = text.trim();
  if (!value) return { reps: null, repsMax: null };
  const match = /^(\d{1,3})(?:\s*[-–a]\s*(\d{1,3}))?$/.exec(value);
  if (!match) return undefined;
  const reps = Number(match[1]);
  const repsMax = match[2] ? Number(match[2]) : null;
  if (reps < 1 || reps > 100 || (repsMax != null && (repsMax <= reps || repsMax > 100)))
    return undefined;
  return { reps, repsMax };
}

export const repsText = (set: Pick<SetTarget, 'reps' | 'repsMax'>) =>
  set.reps == null ? '' : set.repsMax != null ? `${set.reps}-${set.repsMax}` : String(set.reps);

const LIFTS = { squat: 'sentadilla', bench: 'banca', deadlift: 'peso muerto' };
function shortLoad(load: PrescribedLoad | null): string {
  if (!load) return '';
  const each = load.unit === 'EACH' ? ' por mancuerna' : '';
  if (load.mode === 'KG') return `${load.amount} kg${each}`;
  const resolved = load.resolvedKg != null ? ` (${load.resolvedKg} kg${each})` : '';
  return `${load.amount} % de ${LIFTS[load.lift ?? 'squat']}${resolved}`;
}
const effortText = (set: SetTarget) =>
  set.rpe != null ? `RPE ${set.rpe}` : set.rir != null ? `RIR ${set.rir}` : '';

/** One set's target in a few words: "8-10 reps · 50 kg · RIR 2". */
export const setText = (set: SetTarget) =>
  [repsText(set) && `${repsText(set)} reps`, shortLoad(set.load), effortText(set)]
    .filter(Boolean)
    .join(' · ');

/** What the athlete reads: equal consecutive sets grouped, "1 × 5 + 2 × 8 · RIR 2 · 65 kg". */
export function protocolText(exercise: ProgramExercise): string {
  const rows = rowsOf(exercise);
  const efforts = rows.map(effortText);
  const loads = rows.map((row) => shortLoad(row.load));
  const sameEffort = efforts.every((value) => value === efforts[0]);
  const sameLoad = loads.every((value) => value === loads[0]);
  const groups: { label: string; count: number }[] = [];
  rows.forEach((row, i) => {
    const reps = repsText(row).replace('-', '–');
    const label = [
      row.kind !== 'WORK' ? KINDS[row.kind].toLowerCase() : '',
      reps,
      sameLoad || !loads[i] ? '' : `con ${loads[i]}`,
      sameEffort || !efforts[i] ? '' : `(${efforts[i]})`,
    ].join('|');
    const last = groups[groups.length - 1];
    if (last?.label === label) last.count += 1;
    else groups.push({ label, count: 1 });
  });
  const sets = groups
    .map(({ label, count }) => {
      const [kind, reps, load, effort] = label.split('|');
      const dose = reps ? `${count} × ${reps}` : `${count} ${count === 1 ? 'serie' : 'series'}`;
      return [dose, kind && `de ${kind}`, load, effort].filter(Boolean).join(' ');
    })
    .join(' + ');
  return [sets, sameEffort && efforts[0], (sameLoad && loads[0]) || exercise.loadHint]
    .filter(Boolean)
    .join(' · ');
}

/** Dumbbells and kettlebells follow the coach's preference; everything else is the total load. */
export const unitFor = (equipment: string | undefined, dumbbell: LoadUnit): LoadUnit =>
  equipment === 'mancuernas' || equipment === 'kettlebell' ? dumbbell : 'TOTAL';

/** The method the effort column shows: what the rows already use, else the coach's preference. */
export function effortOf(rows: SetTarget[], preferred: EffortMethod): EffortMethod {
  if (rows.some((row) => row.rpe != null)) return 'RPE';
  if (rows.some((row) => row.rir != null)) return 'RIR';
  return preferred;
}
