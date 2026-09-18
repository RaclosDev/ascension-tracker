import { useMemo } from "react";
import Model from "react-body-highlighter";
import type { CompletedWorkout, Exercise } from "../../lib/workout/types";
import { getExerciseMap } from "../../lib/workout/exercises";

const MUSCLE_MAP: Record<string, string[]> = {
  pecho: ["chest"],
  espalda_alta: ["upper-back"],
  dorsales: ["upper-back", "lower-back"],
  lumbares: ["lower-back"],
  trapecios: ["trapezius"],
  cuadriceps: ["quadriceps"],
  femorales: ["hamstring"],
  gluteos: ["gluteal"],
  gemelos: ["calves"],
  abductores: ["abductors"],
  aductores: ["adductor"],
  hombros: ["front-deltoids", "back-deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  antebrazos: ["forearm"],
  abdominales: ["abs", "obliques"],
  cardio: [],
};

interface BodyHeatmapProps {
  history: CompletedWorkout[];
  customExercises?: Exercise[];
}

export function BodyHeatmap({ history, customExercises = [] }: BodyHeatmapProps) {
  const catalog = useMemo(() => getExerciseMap(customExercises), [customExercises]);

  const bodyData = useMemo(() => {
    // Get workouts from the last 7 days
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const recentWorkouts = history.filter((w) => now - w.finishedAt <= oneWeekMs);

    const data: { name: string; muscles: string[] }[] = [];

    // Tally sets per muscle
    recentWorkouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        const setsCount = ex.sets.filter((s) => s.completed).length;
        if (setsCount === 0) return;

        const dbEx = catalog.get(ex.exerciseId);
        if (!dbEx) return;

        const primaryMuscle = dbEx.muscle?.toLowerCase() || "";
        const synergists = dbEx.synergists;

        // Add dummy data points to increase heat intensity based on sets and synergists scores
        if (synergists) {
          // If we have synergists, we multiply sets by synergist score / 10 to scale it
          Object.entries(synergists).forEach(([synMuscle, score]) => {
            const mappedMuscles = MUSCLE_MAP[synMuscle.toLowerCase()];
            if (mappedMuscles) {
              // Add a data point for every point of "heat" generated
              const heatPoints = Math.round((setsCount * score) / 5); // Scale down a bit to prevent maxing out too fast
              for (let i = 0; i < heatPoints; i++) {
                data.push({ name: "Workout", muscles: mappedMuscles });
              }
            }
          });
        } else {
          // Fallback to primary muscle
          const mappedMuscles = MUSCLE_MAP[primaryMuscle];
          if (mappedMuscles) {
            for (let i = 0; i < setsCount; i++) {
              data.push({ name: "Workout", muscles: mappedMuscles });
            }
          }
        }
      });
    });

    return data;
  }, [history, catalog]);

  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Músculos esta Semana</h3>
      <p className="text-sm mb-6 text-center" style={{ color: "var(--text-secondary)" }}>
        Zonas más trabajadas en los últimos 7 días
      </p>
      <div className="flex gap-4 w-full justify-center">
        {/* Front view */}
        <div className="w-[140px] md:w-[180px]">
          <Model
            data={bodyData as any}
            style={{ width: "100%", padding: "0" }}
            type="anterior"
            highlightedColors={["#86efac", "#4ade80", "#22c55e", "#16a34a", "#dc2626"]}
          />
        </div>
        {/* Back view */}
        <div className="w-[140px] md:w-[180px]">
          <Model
            data={bodyData as any}
            style={{ width: "100%", padding: "0" }}
            type="posterior"
            highlightedColors={["#86efac", "#4ade80", "#22c55e", "#16a34a", "#dc2626"]}
          />
        </div>
      </div>
    </div>
  );
}
