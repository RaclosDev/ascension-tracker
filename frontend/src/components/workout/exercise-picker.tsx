import { useMemo, useState } from "react";
import { Check, Plus, Search, Dumbbell, X } from "lucide-react";
import { EXERCISE_CATALOG } from "@/lib/workout/exercises";
import { useWorkoutStore } from "@/lib/workout/store";
import {
  MUSCLE_LABEL,
  type Equipment,
  type MuscleGroup,
} from "@/lib/workout/types";
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from "./exercises-view";
import { useRecentWorkouts } from "@/lib/workout/api";

export function ExercisePicker() {
  const open = useWorkoutStore((s) => s.pickerOpen);
  const setPickerOpen = useWorkoutStore((s) => s.setPickerOpen);
  const addExercises = useWorkoutStore((s) => s.addExercises);
  const customExercises = useWorkoutStore((s) => s.customExercises);
  const addCustomExercise = useWorkoutStore((s) => s.addCustomExercise);
  const aliases = useWorkoutStore((s) => s.exerciseAliases);
  const hiddenEquipments = useWorkoutStore((s) => s.hiddenEquipments) || [];
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const history = recentWorkouts;
  const active = useWorkoutStore((s) => s.active);

  const [query, setQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "ALL">("ALL");
  const [filterEquip, setFilterEquip] = useState<Equipment | "ALL">("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>("pecho");
  const [newEquip, setNewEquip] = useState<Equipment>("barra");

  const already = useMemo(
    () => new Set(active?.exercises.map((e) => e.exerciseId) ?? []),
    [active],
  );

  const { lastUsed, usageCount } = useMemo(() => {
    const l = new Map<string, number>();
    const u = new Map<string, number>();
    for (const w of history) {
      for (const ex of w.exercises) {
        const current = l.get(ex.exerciseId) || 0;
        if (w.startedAt > current) {
          l.set(ex.exerciseId, w.startedAt);
        }
        u.set(ex.exerciseId, (u.get(ex.exerciseId) || 0) + 1);
      }
    }
    return { lastUsed: l, usageCount: u };
  }, [history]);

  // Recent exercises (top 8 most recently used, not already in workout)
  const recentExercises = useMemo(() => {
    const all = [...customExercises, ...EXERCISE_CATALOG];
    const exMap = new Map(all.map(ex => [ex.id, ex]));
    
    return Array.from(lastUsed.entries())
      .filter(([id]) => !already.has(id) && exMap.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => exMap.get(id)!)
      .filter(ex => !hiddenEquipments.includes(ex.equipment));
  }, [lastUsed, already, customExercises, hiddenEquipments]);

  const groupedList = useMemo(() => {
    const all = [...customExercises, ...EXERCISE_CATALOG];
    const q = query.trim().toLowerCase();
    const filtered = all
      .filter((ex) => !hiddenEquipments.includes(ex.equipment))
      .filter((ex) => filterMuscle === "ALL" || ex.muscle === filterMuscle)
      .filter((ex) => filterEquip === "ALL" || ex.equipment === filterEquip)
      .filter((ex) => {
        const dName = aliases[ex.id] || ex.name;
        if (!q) return true;
        const queryWords = q.split(/\s+/);
        const targetName = dName.toLowerCase();
        return queryWords.every(w => targetName.includes(w));
      });

    const groups = new Map<string, typeof all>();
    for (const ex of filtered) {
      const dName = aliases[ex.id] || ex.name;
      const baseName = dName.replace(/\s*\(.*$/, "").trim().toLowerCase();
      if (!groups.has(baseName)) groups.set(baseName, []);
      groups.get(baseName)!.push(ex);
    }
    
    return Array.from(groups.values()).sort((a, b) => {
      const maxA = Math.max(...a.map(ex => lastUsed.get(ex.id) || 0));
      const maxB = Math.max(...b.map(ex => lastUsed.get(ex.id) || 0));
      
      if (maxA !== maxB) {
        return maxB - maxA;
      }
      
      const nameA = aliases[a[0].id] || a[0].name;
      const nameB = aliases[b[0].id] || b[0].name;
      return nameA.localeCompare(nameB);
    });
  }, [customExercises, filterMuscle, filterEquip, query, aliases, hiddenEquipments, lastUsed]);

  function toggle(id: string) {
    if (already.has(id)) return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function close() {
    setPickerOpen(false);
    setSelected([]);
    setQuery("");
    setFilterMuscle("ALL");
    setFilterEquip("ALL");
    setCreating(false);
  }

  function handleAdd() {
    addExercises(selected, history);
    setSelected([]);
    setQuery("");
    setCreating(false);
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="workout-sheet-overlay" onClick={close} />
      
      {/* Sheet */}
      <div className="workout-sheet" style={{ maxHeight: "95dvh" }}>
        {/* Handle */}
        <div className="workout-sheet-handle" />
        
        {/* Header */}
        <div className="workout-sheet-header">
          <span className="workout-sheet-title">Añadir ejercicios</span>
          <button className="workout-sheet-close" onClick={close}>
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "0 1.25rem" }}>
            <div className="picker-search-wrapper">
              <Search size={16} className="picker-search-icon" />
              <input
                type="search"
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar press, sentadilla…"
                className="picker-search-input"
              />
            </div>

          {/* Filter Chips */}
          <div className="filter-chips-row">
            <button
              className={`filter-chip ${filterMuscle === "ALL" && filterEquip === "ALL" ? "active" : ""}`}
              onClick={() => { setFilterMuscle("ALL"); setFilterEquip("ALL"); }}
            >
              Todos
            </button>
            {MUSCLE_OPTIONS.map(m => (
              <button
                key={m.id}
                className={`filter-chip ${filterMuscle === m.id ? "active" : ""}`}
                onClick={() => setFilterMuscle(filterMuscle === m.id ? "ALL" : m.id as MuscleGroup)}
              >
                {m.label}
              </button>
            ))}
            <span style={{ width: "1px", background: "var(--border-subtle)", margin: "0.25rem 0.15rem", flexShrink: 0 }} />
            {EQUIPMENT_OPTIONS.filter(eq => !hiddenEquipments.includes(eq.id)).map(eq => (
              <button
                key={eq.id}
                className={`filter-chip ${filterEquip === eq.id ? "active" : ""}`}
                onClick={() => setFilterEquip(filterEquip === eq.id ? "ALL" : eq.id as Equipment)}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0.75rem", WebkitOverflowScrolling: "touch" }}>
          
          {/* Recents Section */}
          {recentExercises.length > 0 && !query && filterMuscle === "ALL" && filterEquip === "ALL" && (
            <div className="picker-recents-section">
              <div className="picker-recents-label">⚡ Recientes</div>
              <div className="picker-recents-grid">
                {recentExercises.map(ex => {
                  const dName = aliases[ex.id] || ex.name;
                  const on = selected.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      className={`picker-recent-chip ${on ? "selected" : ""}`}
                      onClick={() => toggle(ex.id)}
                    >
                      {ex.gifUrl ? (
                        <img src={ex.gifUrl} alt="" className="picker-recent-chip-img" loading="lazy" />
                      ) : null}
                      {dName.length > 25 ? dName.slice(0, 25) + "…" : dName}
                      {on && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exercise List */}
          {groupedList.length === 0 ? (
            <p style={{ padding: "3rem 1rem", textAlign: "center", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              Nada coincide. Crea un ejercicio abajo.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", paddingBottom: "0.5rem" }}>
              {groupedList.map((group) => {
                const isGroup = group.length > 1;
                const baseName = isGroup ? (aliases[group[0].id] || group[0].name).replace(/\s*\(.*$/, "").trim() : null;
                
                return (
                  <div key={group[0].id + "_group"}>
                    {isGroup && (
                      <div className="picker-group-header">{baseName}</div>
                    )}
                    <div style={{ paddingLeft: isGroup ? "0.25rem" : "0" }}>
                      {group.map((ex) => {
                        const on = selected.includes(ex.id);
                        const used = already.has(ex.id);
                        const dName = aliases[ex.id] || ex.name;
                        const shortName = isGroup ? dName.replace(/^[^(]*\(\s*/, '').replace(/\)\s*$/, '') : dName;
                        
                        return (
                          <button
                            key={ex.id}
                            type="button"
                            disabled={used}
                            onClick={() => toggle(ex.id)}
                            className={`picker-exercise-item ${used ? "disabled" : ""}`}
                          >
                            <div className={`picker-checkbox ${on ? "checked" : ""}`}>
                              {on ? <Check size={14} strokeWidth={3} color="white" /> : null}
                            </div>
                            
                            {ex.gifUrl ? (
                              <img src={ex.gifUrl} alt="" loading="lazy" className="picker-exercise-thumb" />
                            ) : (
                              <div className="picker-exercise-thumb-placeholder">
                                <Dumbbell size={18} />
                              </div>
                            )}
                            
                            <div className="picker-exercise-info">
                              <div className="picker-exercise-name">
                                {shortName}
                                {ex.custom && <span className="picker-custom-badge">Custom</span>}
                              </div>
                              <div className="picker-exercise-meta">
                                {MUSCLE_LABEL[ex.muscle]} · {ex.equipment}
                                {used ? " · ya añadido" : ""}
                              </div>
                              {lastUsed.has(ex.id) && (
                                <div className="picker-exercise-usage">
                                  {usageCount.get(ex.id)}× · {new Date(lastUsed.get(ex.id)!).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Exercise */}
        <div className="picker-create-section">
          {creating ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input
                type="text"
                enterKeyHint="done"
                autoCapitalize="sentences"
                className="picker-search-input"
                style={{ paddingLeft: "0.75rem" }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del ejercicio"
                autoFocus
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <select
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                  className="form-input"
                  style={{ padding: "0.5rem", fontSize: "0.85rem" }}
                >
                  {MUSCLE_OPTIONS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value as Equipment)}
                  className="form-input"
                  style={{ padding: "0.5rem", fontSize: "0.85rem" }}
                >
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setCreating(false)} className="workout-secondary-btn" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, borderRadius: "12px" }}
                  disabled={!newName.trim()}
                  onClick={() => {
                    const id = addCustomExercise({
                      name: newName,
                      muscle: newMuscle,
                      equipment: newEquip,
                    });
                    setSelected((prev) => [...prev, id]);
                    setNewName("");
                    setCreating(false);
                  }}
                >
                  Crear
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="picker-create-btn"
            >
              <Plus size={16} />
              Crear ejercicio
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="picker-footer">
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {selected.length === 0
              ? "Ninguno seleccionado"
              : `${selected.length} seleccionado${selected.length === 1 ? "" : "s"}`}
          </span>
          <button
            disabled={selected.length === 0}
            onClick={handleAdd}
            className="btn btn-primary"
            style={{ borderRadius: "12px", padding: "0.5rem 1.25rem", opacity: selected.length === 0 ? 0.4 : 1 }}
          >
            Añadir {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
        </div>
      </div>
    </>
  );
}
