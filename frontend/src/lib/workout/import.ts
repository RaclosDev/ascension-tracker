import Papa from "papaparse";
import { uid } from "@/lib/utils";
import type { CompletedWorkout, WorkoutExercise, WorkoutSet, Exercise, SetType } from "./types";
import { EXERCISE_CATALOG } from "./exercises";

const MONTH_MAP: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sept: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

function parseHevyDate(dateStr: string): number {
  if (!dateStr) return Date.now();
  const match = dateStr.toLowerCase().match(/(\d+)\s+([a-z]+)\s+(\d+),\s+(\d+):(\d+)/);
  if (!match) return Date.now();
  const [, day, monthStr, year, hour, minute] = match;
  const month = MONTH_MAP[monthStr] ?? 0;
  return new Date(parseInt(year), month, parseInt(day), parseInt(hour), parseInt(minute)).getTime();
}

function parseSetType(type: string): SetType {
  switch (type.toLowerCase()) {
    case "warmup":
      return "warmup";
    case "drop":
    case "dropset":
      return "drop";
    case "failure":
      return "failure";
    case "normal":
    default:
      return "normal";
  }
}

export function importHevyCSV(
  file: File,
  currentCustomExercises: Exercise[],
  onComplete: (workouts: CompletedWorkout[], newCustomExercises: Exercise[]) => void,
  onError: (error: Error) => void
) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const rows = results.data as any[];
        
        // Dictionaries to keep track of workouts and exercises
        const workoutsMap = new Map<string, CompletedWorkout>();
        const newCustomExercises: Exercise[] = [];

        // Helper to find or create an exercise ID
        const getExerciseId = (title: string): string => {
          const normalizedTitle = title.trim().toLowerCase();
          
          // 1. Search in catalog
          const catalogMatch = EXERCISE_CATALOG.find((e) => e.name.toLowerCase() === normalizedTitle);
          if (catalogMatch) return catalogMatch.id;

          // 2. Search in current custom exercises
          const customMatch = currentCustomExercises.find((e) => e.name.toLowerCase() === normalizedTitle);
          if (customMatch) return customMatch.id;

          // 3. Search in newly created custom exercises
          const newMatch = newCustomExercises.find((e) => e.name.toLowerCase() === normalizedTitle);
          if (newMatch) return newMatch.id;

          // Create new custom exercise
          // Try to infer equipment
          let equipment: Exercise["equipment"] = "peso corporal";
          if (normalizedTitle.includes("barbell") || normalizedTitle.includes("barra")) equipment = "barra";
          else if (normalizedTitle.includes("dumbbell") || normalizedTitle.includes("mancuerna")) equipment = "mancuernas";
          else if (normalizedTitle.includes("machine") || normalizedTitle.includes("maquina")) equipment = "maquina";
          else if (normalizedTitle.includes("cable") || normalizedTitle.includes("polea")) equipment = "polea";

          // Try to infer muscle group
          let muscle: Exercise["muscle"] = "pecho"; // Default fallback
          if (normalizedTitle.includes("squat") || normalizedTitle.includes("leg")) muscle = "cuadriceps";
          if (normalizedTitle.includes("curl") && !normalizedTitle.includes("leg")) muscle = "biceps";
          if (normalizedTitle.includes("tricep")) muscle = "triceps";
          if (normalizedTitle.includes("row") || normalizedTitle.includes("pulldown") || normalizedTitle.includes("pull up") || normalizedTitle.includes("pull-up")) muscle = "dorsales";
          if (normalizedTitle.includes("shoulder") || normalizedTitle.includes("overhead press") || normalizedTitle.includes("lateral raise")) muscle = "hombros";
          if (normalizedTitle.includes("jump rope") || normalizedTitle.includes("treadmill") || normalizedTitle.includes("cycling")) muscle = "cardio";

          const newEx: Exercise = {
            id: uid(),
            name: title.trim(),
            muscle,
            equipment,
            custom: true,
          };
          newCustomExercises.push(newEx);
          return newEx.id;
        };

        for (const row of rows) {
          const workoutKey = `${row.title}_${row.start_time}`;
          
          if (!workoutsMap.has(workoutKey)) {
            workoutsMap.set(workoutKey, {
              id: uid(),
              name: row.title || "Entrenamiento importado",
              startedAt: parseHevyDate(row.start_time),
              finishedAt: parseHevyDate(row.end_time),
              notes: row.description || "",
              exercises: [],
            });
          }

          const workout = workoutsMap.get(workoutKey)!;
          const exerciseTitle = row.exercise_title || "Unknown Exercise";
          const supersetId = row.superset_id || undefined;
          
          // Try to find the last exercise block if it matches the current title and supersetId
          let currentExerciseBlock = workout.exercises.length > 0 ? workout.exercises[workout.exercises.length - 1] : null;
          const exerciseId = getExerciseId(exerciseTitle);

          // If the last exercise block doesn't match the current one, create a new block
          if (!currentExerciseBlock || currentExerciseBlock.exerciseId !== exerciseId) {
            currentExerciseBlock = {
              id: uid(),
              exerciseId,
              notes: row.exercise_notes || "",
              supersetId: supersetId ? `superset_${supersetId}` : undefined,
              sets: [],
            };
            workout.exercises.push(currentExerciseBlock);
          }

          const newSet: WorkoutSet = {
            id: uid(),
            type: parseSetType(row.set_type),
            weight: row.weight_kg || "",
            reps: row.reps || "",
            distance: row.distance_km || "",
            duration: row.duration_seconds ? `${row.duration_seconds}s` : "",
            rpe: row.rpe || "",
            completed: true,
          };

          currentExerciseBlock.sets.push(newSet);
        }

        const workoutsList = Array.from(workoutsMap.values());
        onComplete(workoutsList, newCustomExercises);

      } catch (err: any) {
        onError(err);
      }
    },
    error: (error) => {
      onError(new Error(error.message));
    }
  });
}
