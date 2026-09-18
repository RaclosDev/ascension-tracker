import { useState, useRef } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { getExerciseMap } from "@/lib/workout/exercises";
import { isPrSet, previousSetLabel } from "@/lib/workout/format";
import { initAudioAndNotifications } from "@/lib/workout/notifications";
import { useWorkoutStore } from "@/lib/workout/store";
import { useRecentWorkouts } from "@/lib/workout/api";
import { MUSCLE_LABEL, SET_TYPE_LABEL, type WorkoutExercise, type WorkoutSet } from "@/lib/workout/types";

function SwipeableSetRow({
  s,
  i,
  row,
  showRpe,
  isCardio,
  cols,
  workingIndex,
  recentWorkouts,
}: {
  s: WorkoutSet;
  i: number;
  row: WorkoutExercise;
  showRpe: boolean;
  isCardio: boolean;
  cols: string;
  workingIndex: number;
  recentWorkouts: any[];
}) {
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const cycleSetType = useWorkoutStore((s) => s.cycleSetType);
  const toggleSet = useWorkoutStore((s) => s.toggleSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);

  const prev = previousSetLabel(row.exerciseId, i, recentWorkouts);
  const pr = s.completed && isPrSet(row.exerciseId, s.weight, recentWorkouts);
  const typeLabel = SET_TYPE_LABEL[s.type] || String(workingIndex + 1);

  // Swipe state
  const [offsetX, setOffsetX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    
    // Only start horizontal drag if more horizontal than vertical
    if (!isDragging.current) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        isDragging.current = true;
      } else if (Math.abs(dy) > 10) {
        touchStart.current = null;
        return;
      } else {
        return;
      }
    }
    
    if (isDragging.current) {
      // Only allow left swipe (negative dx), clamped
      const clamped = Math.max(-80, Math.min(0, dx));
      setOffsetX(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (offsetX < -40) {
      setOffsetX(-72);
      setSwiped(true);
    } else {
      setOffsetX(0);
      setSwiped(false);
    }
    touchStart.current = null;
    isDragging.current = false;
  };

  const closeSwipe = () => {
    setOffsetX(0);
    setSwiped(false);
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: "8px" }}>
      {/* Delete button behind */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ef4444",
          borderRadius: "0 8px 8px 0",
          cursor: "pointer",
          opacity: offsetX < -10 ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
        onClick={() => removeSet(row.id, s.id)}
      >
        <Trash2 size={18} color="white" />
      </div>

      {/* Swipeable row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? closeSwipe : undefined}
        className={`set-row ${s.completed ? "completed" : ""}`}
        style={{
          gridTemplateColumns: cols,
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 0.2s ease",
          background: s.completed ? "rgba(0, 133, 255, 0.04)" : "var(--bg-card)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Set number + previous info */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.05rem" }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); cycleSetType(row.id, s.id); }}
            title="Cambiar tipo de serie"
            className={`set-type-btn ${s.type === "warmup" ? "warmup" : s.type === "failure" ? "failure" : ""}`}
            style={{ width: "30px", height: "28px", fontSize: "0.7rem" }}
          >
            {typeLabel}
          </button>
          {prev !== "—" && (
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", whiteSpace: "nowrap", maxWidth: "48px", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1 }}>
              {prev}
            </span>
          )}
          {pr && (
            <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--accent-primary-light)", textTransform: "uppercase" }}>PR</span>
          )}
        </div>

        <input
          inputMode="decimal"
          value={isCardio ? s.distance || "" : s.weight || ""}
          placeholder={prev === "—" ? "0" : prev.split("×")[0]?.trim()}
          onChange={(e) => {
            if (isCardio) {
              updateSet(row.id, s.id, { distance: e.target.value.replace(",", ".") });
            } else {
              updateSet(row.id, s.id, { weight: e.target.value.replace(",", ".") });
            }
          }}
          className={`set-input ${s.completed ? "completed" : ""}`}
        />
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={isCardio ? s.duration || "" : s.reps || ""}
          placeholder="0"
          onChange={(e) => {
            if (isCardio) {
              updateSet(row.id, s.id, { duration: e.target.value });
            } else {
              updateSet(row.id, s.id, { reps: e.target.value.replace(/[^\d]/g, "") });
            }
          }}
          className={`set-input ${s.completed ? "completed" : ""}`}
        />
        
        {showRpe && (
          <input
            inputMode="decimal"
            value={s.rpe || ""}
            placeholder="—"
            onChange={(e) => updateSet(row.id, s.id, { rpe: e.target.value.replace(",", ".") })}
            className={`set-input ${s.completed ? "completed" : ""}`}
          />
        )}

        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            initAudioAndNotifications();
            toggleSet(row.id, s.id); 
          }}
          aria-label={s.completed ? "Desmarcar serie" : "Completar serie"}
          className={`set-check-btn ${s.completed ? "checked" : ""}`}
        >
          <Check size={16} strokeWidth={s.completed ? 3 : 2} />
        </button>
      </div>
    </div>
  );
}

export function ExerciseCard({
  row,
  index,
  total,
}: {
  row: WorkoutExercise;
  index: number;
  total: number;
}) {
  const customExercises = useWorkoutStore((s) => s.customExercises);
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const setExerciseNotes = useWorkoutStore((s) => s.setExerciseNotes);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);
  const restTimers = useWorkoutStore((s) => s.restTimers);
  const restPreset = useWorkoutStore((s) => s.restPreset);
  const setExerciseRestTimer = useWorkoutStore((s) => s.setExerciseRestTimer);

  const catalog = getExerciseMap(customExercises);
  const meta = catalog.get(row.exerciseId);
  const settings = useWorkoutStore((s) => s.settings);
  const showRpe = settings?.showRpe ?? false;
  const isCardio = meta?.muscle === "cardio";

  // Compact columns: set#(with prev below), kg, reps, [rpe], check
  const cols = showRpe
    ? "50px minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr) 38px"
    : "50px minmax(0,1fr) minmax(0,1fr) 38px";

  return (
    <article className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div className="exercise-card-header">
        <div style={{ minWidth: 0 }}>
          <h3 className="exercise-card-name">
            {meta?.name ?? "Ejercicio"}
          </h3>
          <div className="exercise-card-meta">
            <span>{meta ? MUSCLE_LABEL[meta.muscle] : "—"}</span>
            <span style={{ color: "var(--border-medium)" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
               
              <select
                value={restTimers[row.exerciseId] ?? restPreset}
                onChange={(e) => setExerciseRestTimer(row.exerciseId, Number(e.target.value))}
                className="exercise-card-rest-select"
              >
                {[30, 60, 90, 120, 150, 180, 240, 300].map(s => (
                  <option key={s} value={s}>{s}s</option>
                ))}
              </select>
            </span>
          </div>
        </div>
        <div className="exercise-card-actions">
          <button
            disabled={index === 0}
            aria-label="Subir"
            onClick={() => moveExercise(row.id, -1)}
            className="exercise-card-action-btn"
          >
            <ChevronUp size={20} />
          </button>
          <button
            disabled={index === total - 1}
            aria-label="Bajar"
            onClick={() => moveExercise(row.id, 1)}
            className="exercise-card-action-btn"
          >
            <ChevronDown size={20} />
          </button>
          <button
            aria-label="Quitar ejercicio"
            onClick={() => removeExercise(row.id)}
            className="exercise-card-action-btn danger"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "0.4rem 1rem" }}>
        <input
          value={row.notes}
          onChange={(e) => setExerciseNotes(row.id, e.target.value)}
          placeholder="Notas de la serie, tempo, RIR…"
          className="form-input" style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.8rem", background: "rgba(0,0,0,0.2)", border: "none" }}
        />
      </div>

      {/* Sets */}
      <div style={{ padding: "0.25rem 0.5rem 0.75rem" }}>
        {/* Header */}
        <div className="set-grid-header" style={{ gridTemplateColumns: cols }}>
          <span>#</span>
          <span>{isCardio ? "Km" : "Kg"}</span>
          <span>{isCardio ? "Tpo" : "Reps"}</span>
          {showRpe && <span>RPE</span>}
          <span />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {row.sets.map((s, i) => {
            let normalCount = 0;
            for (let j = 0; j < i; j++) {
              if (row.sets[j].type === "normal") normalCount++;
            }
            return (
              <SwipeableSetRow
                key={s.id}
                s={s}
                i={i}
                workingIndex={normalCount}
                row={row}
                showRpe={showRpe}
                isCardio={isCardio}
                cols={cols}
                recentWorkouts={recentWorkouts}
              />
            );
          })}
        </div>

        <button onClick={() => addSet(row.id, recentWorkouts)} className="add-set-btn">
          <Plus size={16} />
          Añadir serie
        </button>
      </div>
    </article>
  );
}
