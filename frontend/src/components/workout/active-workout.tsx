import { useState } from "react";
import { Bookmark, Plus, Square, Check } from "lucide-react";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { RestBanner } from "@/components/workout/rest-banner";
import { EmptyCard } from "@/components/workout/dashboard";
import { useNow } from "@/hooks/use-now";
import { formatDuration } from "@/lib/workout/format";
import { useWorkoutStore } from "@/lib/workout/store";

export function ActiveWorkout() {
  const active = useWorkoutStore((s) => s.active);
  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const templates = useWorkoutStore((s) => s.templates);
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const setPickerOpen = useWorkoutStore((s) => s.setPickerOpen);

  if (!active) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <header style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-secondary)" }}>
            Entrenar
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Sin sesión activa
          </h1>
        </header>
        <EmptyCard
          title="Empieza cuando quieras"
          body="Crea una sesión vacía o lanza una plantilla. El historial rellena kilos y reps."
        />
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={startEmpty} className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem" }}>
            <Plus size={18} style={{ marginRight: "0.5rem" }} />
            Entrenamiento vacío
          </button>
          <button onClick={() => useWorkoutStore.getState().setTab("templates")} className="btn btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem" }}>
            <Bookmark size={18} style={{ marginRight: "0.5rem", color: "var(--text-secondary)" }} />
            Mis Plantillas
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LiveSession />
      <ExercisePicker />
      <button onClick={() => setPickerOpen(true)} className="add-exercise-btn">
        <Plus size={18} />
        Añadir ejercicio
      </button>
      <FooterActions />
    </>
  );
}

function LiveSession() {
  const active = useWorkoutStore((s) => s.active)!;
  const now = useNow(true, 500);
  const elapsed = now - active.startedAt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Floating timer pill */}
      <div className="active-workout-header" style={{ padding: "0.5rem 1rem", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <div className="active-workout-timer">
          <span className="active-workout-timer-dot" />
          <span className="active-workout-timer-text">
            {formatDuration(elapsed)}
          </span>
        </div>
        <input
          value={active.notes ?? ""}
          onChange={(e) => useWorkoutStore.setState(s => ({ active: s.active ? { ...s.active, notes: e.target.value } : null }))}
          placeholder="Notas..."
          className="active-workout-notes-input"
          style={{ textAlign: "right", flex: 1 }}
        />
      </div>

      <RestBanner />

      {active.exercises.length === 0 ? (
        <EmptyCard
          title="Añade el primer ejercicio"
          body="Elige de la biblioteca o crea uno propio. Las series vacías esperan kilos y reps."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {active.exercises.map((row, i) => (
            <div key={row.id} style={{ display: "flex", gap: "0.5rem" }}>
              {row.supersetId && (
                <div style={{ width: "4px", background: "var(--accent-primary)", borderRadius: "4px", opacity: 0.8 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <ExerciseCard
                  row={row}
                  index={i}
                  total={active.exercises.length}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useSaveWorkout, useSaveTemplate } from "@/lib/workout/api";

function FooterActions() {
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);
  const saveAsTemplate = useWorkoutStore((s) => s.saveAsTemplate);
  const saveWorkoutMutation = useSaveWorkout();
  const saveTemplateMutation = useSaveTemplate();

  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState(0);
  const active = useWorkoutStore((s) => s.active);

  function openFinish() {
    if (!active) return;
    const hasWork = active.exercises.some((e) => e.sets.some((s) => s.completed));
    if (!hasWork) {
      setEmptyOpen(true);
      return;
    }
    
    setCustomName(active.name);
    setCustomDuration(Math.round((Date.now() - active.startedAt) / 60000));
    setFinishOpen(true);
  }

  function confirmFinish() {
    const record = finishWorkout(customName, customDuration * 60000);
    if (record) saveWorkoutMutation.mutate(record);
    setFinishOpen(false);
  }

  function doDiscard() {
    discardWorkout();
    setDiscardOpen(false);
  }

  function doSaveTemplate() {
    const tpl = saveAsTemplate();
    if (tpl) saveTemplateMutation.mutate(tpl);
  }

  return (
    <div className="workout-footer-actions">
      <button onClick={openFinish} className="workout-finish-btn">
        <Check size={20} />
        Terminar Entrenamiento
      </button>
      <button
        className="workout-secondary-btn"
        onClick={doSaveTemplate}
        disabled={!active || active.exercises.length === 0}
      >
        <Bookmark size={16} />
        Guardar como plantilla
      </button>
      <button
        className="workout-secondary-btn danger"
        onClick={() => setDiscardOpen(true)}
      >
        <Square size={16} />
        Descartar
      </button>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", width: "95vw", maxWidth: "400px", maxHeight: "85dvh", overflowY: "auto" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>¿Descartar la sesión?</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Se pierde el cronómetro y las series de esta sesión. El historial no cambia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn btn-secondary">Seguir entrenando</AlertDialogCancel>
            <AlertDialogAction className="btn btn-danger" onClick={discardWorkout}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={emptyOpen} onOpenChange={setEmptyOpen}>
        <AlertDialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", width: "95vw", maxWidth: "400px", maxHeight: "85dvh", overflowY: "auto" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>No hay series completadas</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Marca al menos una serie para guardar el entrenamiento en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn btn-primary">Entendido</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={finishOpen} onOpenChange={setFinishOpen}>
        <AlertDialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", width: "95vw", maxWidth: "400px", maxHeight: "85dvh", overflowY: "auto" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Finalizar Sesión</AlertDialogTitle>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Nombre del entrenamiento</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)} 
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-medium)", color: "var(--text-primary)", borderRadius: "8px", padding: "0.5rem" }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Duración (minutos)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={customDuration} 
                  onChange={(e) => setCustomDuration(Number(e.target.value))} 
                  min="1"
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-medium)", color: "var(--text-primary)", borderRadius: "8px", padding: "0.5rem" }}
                />
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter style={{ marginTop: "1.5rem" }}>
            <AlertDialogCancel className="btn btn-secondary">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="btn btn-primary" onClick={confirmFinish}>
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
