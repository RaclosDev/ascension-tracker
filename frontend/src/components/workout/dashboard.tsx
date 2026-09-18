import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Clock3, Dumbbell, Flame, Play, Weight, X } from "lucide-react";
import { ActivityHeatmap } from "@/components/workout/heatmap";
import { MuscleRecovery } from "@/components/workout/muscle-recovery";
import { BodyHeatmap } from "@/components/workout/body-heatmap";
import { getExerciseMap } from "@/lib/workout/exercises";
import {
  formatDayLong,
  formatDuration,
  formatKg,
  sessionVolume,
} from "@/lib/workout/format";
import { useWorkoutStore } from "@/lib/workout/store";
import { useRecentWorkouts, useWorkoutTemplates, useCustomExercises } from "@/lib/workout/api";

export function Dashboard() {
  const { data: history = [] } = useRecentWorkouts(60);
  const { data: templates = [] } = useWorkoutTemplates();
  const { data: customExercises = [] } = useCustomExercises();
  
  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const startFromHistory = useWorkoutStore((s) => s.startFromHistory);
  const setTab = useWorkoutStore((s) => s.setTab);
  const setDetailId = useWorkoutStore((s) => s.setDetailId);
  const active = useWorkoutStore((s) => s.active);
  const catalog = getExerciseMap(customExercises);

  const [startModalOpen, setStartModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <TodayHeader>
        {!active && (
          <div className="flex gap-2">
            <button onClick={() => setStartModalOpen(true)} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.8rem", fontSize: "0.9rem" }}>
              <Play size={16} />
              Empezar Entreno
            </button>
          </div>
        )}
      </TodayHeader>

      {/* Start Workout Sheet */}
      {startModalOpen && (
        <>
          <div className="workout-sheet-overlay" onClick={() => setStartModalOpen(false)} />
          <div className="workout-sheet">
            <div className="workout-sheet-handle" />
            <div className="workout-sheet-header">
              <span className="workout-sheet-title">Empezar Entrenamiento</span>
              <button className="workout-sheet-close" onClick={() => setStartModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="workout-sheet-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* Empty workout */}
                <button
                  className="start-workout-option start-workout-option-primary"
                  onClick={() => {
                    startEmpty();
                    setStartModalOpen(false);
                  }}
                >
                  <div className="start-workout-option-icon">
                    <Play size={22} />
                  </div>
                  <div>
                    <div className="start-workout-option-title">Entrenamiento Vacío</div>
                    <div className="start-workout-option-desc">Empezar desde cero sin ejercicios predefinidos</div>
                  </div>
                </button>

                {/* Templates */}
                {templates?.length > 0 && (
                  <>
                    <div className="start-workout-section-label" style={{ marginTop: "0.5rem" }}>Plantillas</div>
                    {templates.map(t => (
                      <button
                        key={t.id}
                        className="start-workout-option start-workout-option-secondary"
                        onClick={() => {
                          startFromTemplate(t, history);
                          setStartModalOpen(false);
                        }}
                      >
                        <div className="start-workout-option-icon">
                          <Dumbbell size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="start-workout-option-title">{t.name}</div>
                          <div className="start-workout-option-desc">{(t as any)?.exercises?.length || t?.exerciseIds?.length || 0} ejercicios</div>
                        </div>
                        <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      </button>
                    ))}
                  </>
                )}

                {/* Recent workouts */}
                {history?.length > 0 && (
                  <>
                    <div className="start-workout-section-label" style={{ marginTop: "0.5rem" }}>Repetir Reciente</div>
                    {history.slice(0, 3).map(w => (
                      <button
                        key={w.id}
                        className="start-workout-option start-workout-option-secondary"
                        onClick={() => {
                          startFromHistory(w);
                          setStartModalOpen(false);
                        }}
                      >
                        <div className="start-workout-option-icon">
                          <Clock3 size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                          <div className="start-workout-option-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.name}</div>
                          <div className="start-workout-option-desc">
                            {formatDuration(w.finishedAt - w.startedAt)} · {w?.exercises?.length || 0} ejercicios
                          </div>
                        </div>
                        <ArrowRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {active ? (
        <button
          type="button"
          onClick={() => setTab("train")}
          className="card" style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", textAlign: "left", cursor: "pointer", marginBottom: "1rem" }}
        >
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--color-success)" }}>
              En curso
            </p>
            <p style={{ marginTop: "0.25rem", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>{active.name}</p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {active?.exercises?.length || 0} ejercicios · continuar
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
        </button>
      ) : null}

      <section className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Mis Ejercicios</h3>
        <button onClick={() => setTab("exercises")} className="btn btn-secondary btn-sm" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
          Gestionar
        </button>
      </section>

      <section className="card" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Mis Plantillas</h3>
        <button onClick={() => setTab("templates")} className="btn btn-secondary btn-sm" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
          Gestionar
        </button>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MuscleRecovery history={history} customExercises={customExercises} />
        <BodyHeatmap history={history} customExercises={customExercises} />
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Actividad</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>12 semanas</span>
          </div>
          <ActivityHeatmap history={history} />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Recientes</h3>
          <button onClick={() => setTab("history")} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer" }}>
            Ver todo
          </button>
        </div>
        {history.length === 0 ? (
          <EmptyCard
            title="Todavía no hay sesiones"
            body="Empieza un entrenamiento vacío o usa una plantilla."
          />
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: 0, margin: 0, listStyle: "none" }}>
            {history.slice(0, 4).map((w) => {
              const names = w.exercises
                .slice(0, 4)
                .map((e) => catalog.get(e.exerciseId)?.name ?? "Ejercicio");
              return (
                <li key={w.id}>
                  <div className="card" style={{ display: "flex", width: "100%", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailId(w.id);
                        setTab("history");
                      }}
                      style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                    >
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{w.name}</p>
                      <p style={{ marginTop: "0.1rem", fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {names.join(" · ")}
                        {w.exercises.length > 4 ? "…" : ""}
                      </p>
                    </button>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {formatKg(sessionVolume(w.exercises))}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {formatDuration(w.finishedAt - w.startedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function TodayHeader({ children }: { children?: ReactNode }) {
  const [label, setLabel] = useState("Hoy");

  useEffect(() => {
    const d = new Date();
    const dayShort = d.toLocaleDateString("es-ES", { weekday: "short" });
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString("es-ES", { month: "short" });
    const formatted = `${dayShort.charAt(0).toUpperCase() + dayShort.slice(1)}, ${dayNum} ${monthShort}`;
    setLabel(formatted);
  }, []);

  return (
    <header style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
        {label}
      </h1>
      {children}
    </header>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Weight;
}) {
  return (
    <div className="card" style={{ padding: "1rem", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        <Icon size={16} />
      </div>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "auto" }}>
        {value}
      </p>
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{hint}</p>
    </div>
  );
}

export function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
      <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>{title}</p>
      <p style={{ margin: "0.5rem auto 0", maxWidth: "400px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {body}
      </p>
    </div>
  );
}
