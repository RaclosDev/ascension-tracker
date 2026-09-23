import { Play, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyCard } from "@/components/workout/dashboard";
import { getExerciseMap } from "@/lib/workout/exercises";
import { useWorkoutStore } from "@/lib/workout/store";

import { useWorkoutTemplates, useDeleteTemplate, useCustomExercises, useRecentWorkouts } from "@/lib/workout/api";

export function TemplatesView() {
  const { data: templates = [] } = useWorkoutTemplates();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const deleteMutation = useDeleteTemplate();
  
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const deleteTemplate = (id: string) => deleteMutation.mutate(id);
  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const catalog = getExerciseMap(customExercises);
  const setTab = useWorkoutStore((s) => s.setTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <button onClick={() => setTab("home")} className="btn btn-secondary" style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <Button onClick={startEmpty} size="sm">
          Nueva Plantilla
        </Button>
      </header>

      {templates.length === 0 ? (
        <EmptyCard title="Sin plantillas" body="Guarda un entreno como plantilla para reutilizarlo." />
      ) : (
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", padding: 0, margin: 0, listStyle: "none" }}>
          {templates.map((tpl) => {
            const names = tpl.exerciseIds.map(
              (id) => catalog.get(id)?.name ?? "Ejercicio",
            );
            return (
              <li
                key={tpl.id}
                className="card" style={{ display: "flex", flexDirection: "column", padding: "1.25rem" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>{tpl.name}</h2>
                    <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)" }}>
                      {tpl.exerciseIds.length} ejercicios
                    </p>
                  </div>
                  <button aria-label="Eliminar plantilla" onClick={() => deleteTemplate(tpl.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex", padding: "0.25rem" }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <p style={{ marginTop: "0.75rem", flex: 1, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text-secondary)" }}>
                  {names.slice(0, 6).join(" · ")}
                  {names.length > 6 ? "" : ""}
                </p>
                <button onClick={() => startFromTemplate(tpl, recentWorkouts)} className="btn btn-primary" style={{ marginTop: "1.25rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <Play size={18} />
                  Empezar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
