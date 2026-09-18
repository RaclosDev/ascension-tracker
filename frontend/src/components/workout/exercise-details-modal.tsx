import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dumbbell, Trophy, Activity, Calendar } from "lucide-react";
import { useWorkoutStore } from "@/lib/workout/store";
import { useRecentWorkouts } from "@/lib/workout/api";
import { MUSCLE_LABEL, type Exercise } from "@/lib/workout/types";
import { formatKg } from "@/lib/workout/format";

interface Props {
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseDetailsModal({ exercise, onClose }: Props) {
  const { data: history = [] } = useRecentWorkouts(365);

  const stats = useMemo(() => {
    if (!exercise) return null;
    
    let maxWeight = 0;
    const maxWeightPerRange = {
      "1-5": 0,
      "6-10": 0,
      "11-15": 0,
      "16+": 0
    };
    const sessions: Array<{ date: number; name: string; sets: Array<{ weight: string, reps: string }> }> = [];

    for (const session of history) {
      const exData = session.exercises.find(e => e.exerciseId === exercise.id);
      if (!exData) continue;
      
      const validSets = exData.sets.filter(s => s.completed);
      if (validSets.length === 0) continue;

      let sessionVol = 0;
      const sessionSets: Array<{ weight: string, reps: string }> = [];

      for (const set of validSets) {
        const w = Number.parseFloat(set.weight);
        const r = Number.parseFloat(set.reps);
        
        sessionSets.push({ weight: set.weight, reps: set.reps });

        if (Number.isFinite(w) && w > maxWeight) {
          maxWeight = w;
        }

        if (Number.isFinite(w) && Number.isFinite(r)) {
          if (r >= 1 && r <= 5) maxWeightPerRange["1-5"] = Math.max(maxWeightPerRange["1-5"], w);
          else if (r >= 6 && r <= 10) maxWeightPerRange["6-10"] = Math.max(maxWeightPerRange["6-10"], w);
          else if (r >= 11 && r <= 15) maxWeightPerRange["11-15"] = Math.max(maxWeightPerRange["11-15"], w);
          else if (r >= 16) maxWeightPerRange["16+"] = Math.max(maxWeightPerRange["16+"], w);
        }
      }

      sessions.push({
        date: session.finishedAt,
        name: session.name || "Entrenamiento",
        sets: sessionSets
      });
    }

    return {
      maxWeight,
      maxWeightPerRange,
      sessions: sessions.sort((a, b) => b.date - a.date)
    };
  }, [exercise, history]);

  if (!exercise) return null;

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="card" style={{ padding: 0, background: "var(--bg-primary)", border: "1px solid var(--border-color)", maxWidth: "500px", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <DialogHeader style={{ display: "none" }}>
          <DialogTitle>Detalles de {exercise.name}</DialogTitle>
          <DialogDescription>Estadísticas e historial del ejercicio.</DialogDescription>
        </DialogHeader>

        {/* Header Section */}
        <div style={{ padding: "1.5rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1rem" }}>
          {exercise.gifUrl ? (
            <img 
              src={exercise.gifUrl} 
              alt={exercise.name} 
              style={{ width: "64px", height: "64px", borderRadius: "12px", objectFit: "cover", background: "var(--bg-primary)", border: "1px solid rgba(255,255,255,0.1)" }} 
            />
          ) : (
            <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "var(--bg-primary)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Dumbbell size={28} style={{ color: "var(--text-secondary)" }} />
            </div>
          )}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>{exercise.name}</h2>
            <p style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "capitalize", fontWeight: 600, letterSpacing: "0.05em" }}>
              {MUSCLE_LABEL[exercise.muscle]} · {exercise.equipment} {exercise.custom ? "· Personalizado" : ""}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* PRs and Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", background: "linear-gradient(145deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%)", border: "1px solid rgba(255,215,0,0.2)" }}>
              <Trophy size={20} style={{ color: "#FBBF24" }} />
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>Peso Máximo Absoluto</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{stats?.maxWeight ? formatKg(stats.maxWeight) : ""}</p>
            </div>
            
            <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", marginBottom: "0.5rem" }}>
                <Activity size={20} style={{ color: "var(--color-primary)" }} />
                <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)" }}>Récords por Repeticiones</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", width: "100%" }}>
                {Object.entries(stats?.maxWeightPerRange || {}).map(([range, weight]) => (
                  <div key={range} style={{ background: "var(--bg-primary)", padding: "0.5rem", borderRadius: "8px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>{range} reps</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{weight > 0 ? formatKg(weight) : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Muscles Section */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={18} style={{ color: "var(--color-primary)" }} />
              Implicación Muscular
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(() => {
                const syns = exercise.synergists && Object.keys(exercise.synergists).length > 0 
                  ? Object.entries(exercise.synergists).sort(([,a], [,b]) => b - a)
                  : [[exercise.muscle, 10]];

                return syns.map(([muscle, score]) => (
                  <div key={muscle} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", width: "100px", textTransform: "capitalize", flexShrink: 0 }}>
                      {MUSCLE_LABEL[muscle as any] || muscle}
                    </span>
                    <div style={{ flex: 1, height: "10px", background: "var(--bg-primary)", borderRadius: "5px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                      <div style={{ 
                        height: "100%", 
                        width: `${(Number(score) / 10) * 100}%`,
                        background: Number(score) >= 8 ? "var(--gradient-primary)" : Number(score) >= 5 ? "var(--accent-primary-light)" : "var(--text-muted)",
                        borderRadius: "5px",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", width: "30px", textAlign: "right", flexShrink: 0 }}>
                      {score}/10
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* History List */}
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} style={{ color: "var(--text-secondary)" }} />
              Historial de Sesiones
            </h3>
            
            {stats?.sessions.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center", padding: "2rem 0" }}>
                Aún no has registrado este ejercicio.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {stats?.sessions.map((session, idx) => (
                  <div key={idx} style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{session.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {format(session.date, "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {session.sets.map((set, setIdx) => (
                        <span key={setIdx} style={{ fontSize: "0.75rem", fontWeight: 600, background: "rgba(255,255,255,0.05)", padding: "0.25rem 0.5rem", borderRadius: "6px", color: "var(--text-secondary)" }}>
                          {set.weight} × {set.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
