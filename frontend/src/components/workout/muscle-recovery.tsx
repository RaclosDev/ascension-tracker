import { type CompletedWorkout, type Exercise } from "@/lib/workout/types";
import { getExerciseMap } from "@/lib/workout/exercises";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const MUSCLE_GROUPS = {
  push: {
    label: "Empuje (Pecho, Hombros, Tríceps)",
    muscles: ["pecho", "triceps", "hombros"],
    color: "var(--color-primary)" // Red/orange
  },
  pull: {
    label: "Tirón (Espalda, Bíceps)",
    muscles: ["dorsales", "espalda_alta", "biceps", "trapecios", "lumbares", "antebrazos"],
    color: "var(--color-success)" // Green/Blue
  },
  legs: {
    label: "Piernas (Cuádriceps, Femorales...)",
    muscles: ["cuadriceps", "gluteos", "femorales", "gemelos", "aductores"],
    color: "var(--color-fat)" // Yellow/Orange
  },
  core: {
    label: "Core (Abdominales)",
    muscles: ["abdominales"],
    color: "var(--color-carbs)" // Purple/Blue
  }
};

const MAX_SETS_FATIGUE = 150; // 15 sets * 10 max points = 150 points for 100% fatigue
const RECOVERY_MS = 72 * 60 * 60 * 1000; // 72 hours

export function MuscleRecovery({ history, customExercises = [] }: { history: CompletedWorkout[], customExercises?: Exercise[] }) {
  const catalog = getExerciseMap(customExercises);
  const now = Date.now();

  const fatigueScores = {
    push: 0,
    pull: 0,
    legs: 0,
    core: 0
  };

  // Calculate fatigue
  history.forEach(workout => {
    const timeSince = now - workout.finishedAt;
    if (timeSince > RECOVERY_MS) return;

    // Fatigue weight decreases over 72 hours (1.0 at 0h, 0.0 at 72h)
    const weight = 1 - (timeSince / RECOVERY_MS);

    workout.exercises.forEach(ex => {
      const dbEx = catalog.get(ex.exerciseId);
      if (!dbEx) return;

      const muscle = dbEx.muscle?.toLowerCase() || "";
      const setsCount = ex.sets.filter(s => s.completed).length;
      
      const applyFatigue = (targetMuscle: string, points: number) => {
        const fatigueAdded = setsCount * weight * points;
        if (MUSCLE_GROUPS.push.muscles.includes(targetMuscle)) fatigueScores.push += fatigueAdded;
        else if (MUSCLE_GROUPS.pull.muscles.includes(targetMuscle)) fatigueScores.pull += fatigueAdded;
        else if (MUSCLE_GROUPS.legs.muscles.includes(targetMuscle)) fatigueScores.legs += fatigueAdded;
        else if (MUSCLE_GROUPS.core.muscles.includes(targetMuscle)) fatigueScores.core += fatigueAdded;
      };

      if (dbEx.synergists) {
        Object.entries(dbEx.synergists).forEach(([synMuscle, score]) => {
          applyFatigue(synMuscle.toLowerCase(), score);
        });
      } else {
        // Fallback if no synergists exist: 10 points to the primary muscle
        applyFatigue(muscle, 10);
      }
    });
  });

  const getStatusText = (score: number) => {
    if (score < 30) return "Fresco";
    if (score < 80) return "Recuperando";
    if (score < 120) return "Algo fatigado";
    return "Muy fatigado";
  };

  return (
    <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%" }}>
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>Estado de Recuperación</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Basado en el volumen de las últimas 72 horas.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {(Object.keys(MUSCLE_GROUPS) as Array<keyof typeof MUSCLE_GROUPS>).map(key => {
          const group = MUSCLE_GROUPS[key];
          const score = fatigueScores[key];
          
          // Reverse progress bar: 100% means fully recovered, 0% means fully fatigued.
          const fatiguePct = Math.min(100, Math.round((score / MAX_SETS_FATIGUE) * 100));
          const recoveryPct = 100 - fatiguePct;
          
          let barColor = "var(--color-success)";
          if (recoveryPct < 30) barColor = "var(--color-fat)";
          else if (recoveryPct < 60) barColor = "var(--color-carbs)";

          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{group.label}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{getStatusText(score)} ({recoveryPct}%)</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                <div 
                  style={{ 
                    width: `${recoveryPct}%`, 
                    height: "100%", 
                    background: barColor, 
                    borderRadius: "4px",
                    transition: "width 1s ease-in-out, background 0.5s" 
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
