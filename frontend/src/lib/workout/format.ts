import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CompletedWorkout, WorkoutExercise } from "./types";

const kgFmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const intFmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

export function formatKg(n: number) {
  return `${kgFmt.format(n)} kg`;
}



export function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatRest(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDay(ts: number) {
  return format(ts, "EEE d MMM", { locale: es });
}

export function formatDayLong(ts: number) {
  return format(ts, "EEEE d 'de' MMMM", { locale: es });
}


export function sessionVolume(exercises: WorkoutExercise[]) {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (!set.completed) continue;
      const w = Number.parseFloat(set.weight);
      const r = Number.parseFloat(set.reps);
      if (Number.isFinite(w) && Number.isFinite(r)) total += w * r;
    }
  }
  return total;
}

export function completedSets(exercises: WorkoutExercise[]) {
  return exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.completed).length,
    0,
  );
}

export function totalSets(exercises: WorkoutExercise[]) {
  return exercises.reduce((n, ex) => n + ex.sets.length, 0);
}

export function isPrSet(
  exerciseId: string,
  weight: string,
  history: CompletedWorkout[],
  excludeWorkoutId?: string,
) {
  const w = Number.parseFloat(weight);
  if (!Number.isFinite(w) || w <= 0) return false;
  let best = 0;
  for (const session of history) {
    if (excludeWorkoutId && session.id === excludeWorkoutId) continue;
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        const sw = Number.parseFloat(set.weight);
        if (Number.isFinite(sw) && sw > best) best = sw;
      }
    }
  }
  return w > best && best > 0;
}

export function previousSetLabel(
  exerciseId: string,
  setIndex: number,
  history: CompletedWorkout[],
) {
  for (const session of history) {
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const set = ex.sets.filter((s) => s.type !== "warmup")[setIndex] ?? ex.sets[setIndex];
    if (set && set.completed && set.weight && set.reps) {
      return `${set.weight} × ${set.reps}`;
    }
  }
  return "";
}

export function previousFill(
  exerciseId: string,
  setIndex: number,
  history: CompletedWorkout[],
) {
  for (const session of history) {
    const ex = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!ex) continue;
    const working = ex.sets.filter((s) => s.type !== "warmup");
    const set = working[setIndex] ?? ex.sets[setIndex];
    if (set && set.completed) {
      return { weight: set.weight, reps: set.reps };
    }
  }
  return { weight: "", reps: "" };
}


