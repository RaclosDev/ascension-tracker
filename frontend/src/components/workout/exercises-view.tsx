import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Search, Dumbbell, ArrowLeft, Link as LinkIcon, AlertTriangle, Copy, Image as ImageIcon, MoreVertical } from "lucide-react";
import { getExerciseMap, EXERCISE_CATALOG } from "@/lib/workout/exercises";
import type { Exercise } from "@/lib/workout/types";
import { useWorkoutStore } from "@/lib/workout/store";
import { MUSCLE_LABEL, type MuscleGroup, type Equipment } from "@/lib/workout/types";
import { ExerciseDetailsModal } from "./exercise-details-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let i = 1; i <= a.length; i++) matrix[0][i] = i;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}


export const EQUIPMENT_OPTIONS = [
  { id: "banda", label: "Banda Elástica" },
  { id: "barra", label: "Barra" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "mancuernas", label: "Mancuernas" },
  { id: "maquina", label: "Máquina" },
  { id: "multipower", label: "Multipower (Smith)" },
  { id: "peso corporal", label: "Peso Corporal" },
  { id: "polea", label: "Polea" }
].sort((a, b) => a.label.localeCompare(b.label, "es"));

export const MUSCLE_OPTIONS = Object.entries(MUSCLE_LABEL)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label, "es"));

import { useCustomExercises, useSaveCustomExercise, useDeleteCustomExercise, useRecentWorkouts } from "@/lib/workout/api";

export function ExercisesView() {
  const { data: customExercises = [] } = useCustomExercises();
  const saveExerciseMutation = useSaveCustomExercise();
  const deleteExerciseMutation = useDeleteCustomExercise();
  
  const deleteCustomExercise = (id: string) => deleteExerciseMutation.mutate(id);
  const addCustomExercise = (ex: any) => saveExerciseMutation.mutate({ ...ex, id: Date.now().toString() } as any);
  const updateCustomExercise = (id: string, patch: any) => {
     const ex = customExercises.find(e => e.id === id);
     if (ex) saveExerciseMutation.mutate({ ...ex, ...patch });
  };
  const mergeExercise = useWorkoutStore((s) => s.mergeExercise);
  const setTab = useWorkoutStore((s) => s.setTab);
  const aliases = useWorkoutStore((s) => s.exerciseAliases);
  const setExerciseAlias = useWorkoutStore((s) => s.setExerciseAlias);
  const hiddenEquipments = useWorkoutStore((s) => s.hiddenEquipments) || [];

  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const history = recentWorkouts;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"custom" | "all">("custom");
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "ALL">("ALL");
  const [filterEquip, setFilterEquip] = useState<Equipment | "ALL">("ALL");
  const [creating, setCreating] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [mergeTargetQuery, setMergeTargetQuery] = useState("");
  const [mergeFilterMuscle, setMergeFilterMuscle] = useState<MuscleGroup | "ALL">("ALL");
  const [mergeFilterEquip, setMergeFilterEquip] = useState<Equipment | "ALL">("ALL");
  const [mergeConfirmTargetId, setMergeConfirmTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!mergeSourceId) {
      setMergeTargetQuery("");
      setMergeFilterMuscle("ALL");
      setMergeFilterEquip("ALL");
      setMergeConfirmTargetId(null);
    }
  }, [mergeSourceId]);

  // Form state
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>("pecho");
  const [newEquip, setNewEquip] = useState<Equipment>("barra");
  const [newImage, setNewImage] = useState<string | undefined>(undefined);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate last used times and usage count
  const lastUsedMap = new Map<string, number>();
  const usageCountMap = new Map<string, number>();
  history.forEach((w) => {
    w.exercises.forEach((ex) => {
      const current = lastUsedMap.get(ex.exerciseId) || 0;
      if (w.startedAt > current) {
        lastUsedMap.set(ex.exerciseId, w.startedAt);
      }
      usageCountMap.set(ex.exerciseId, (usageCountMap.get(ex.exerciseId) || 0) + 1);
    });
  });

  const list = (filter === "custom" ? customExercises : [...customExercises, ...EXERCISE_CATALOG])
    .filter((ex) => !hiddenEquipments.includes(ex.equipment))
    .filter((ex) => {
      const displayName = aliases[ex.id] || ex.name;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const queryWords = q.split(/\s+/);
      const targetName = displayName.toLowerCase();
      return queryWords.every(w => targetName.includes(w));
    })
    .filter((ex) => filterMuscle === "ALL" || ex.muscle === filterMuscle)
    .filter((ex) => filterEquip === "ALL" || ex.equipment === filterEquip)
    .sort((a, b) => {
      const aTime = lastUsedMap.get(a.id) || 0;
      const bTime = lastUsedMap.get(b.id) || 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return 0; // fallback to original order
    });



  function handleCreate() {
    if (!newName.trim()) return;
    addCustomExercise({
      name: newName.trim(),
      muscle: newMuscle,
      equipment: newEquip,
      gifUrl: newImage,
    });
    setCreating(false);
    setNewName("");
    setNewImage(undefined);
  }

  function handleUpdate() {
    if (!editingExercise || !newName.trim()) return;
    updateCustomExercise(editingExercise.id, {
      name: newName.trim(),
      muscle: newMuscle,
      equipment: newEquip,
      gifUrl: newImage,
    });
    setEditingExercise(null);
    setNewName("");
    setNewImage(undefined);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setNewImage(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  function handleConfirmMerge() {
    if (!mergeSourceId || !mergeConfirmTargetId) return;
    mergeExercise(mergeSourceId, mergeConfirmTargetId);
    setMergeSourceId(null);
    setMergeConfirmTargetId(null);
    setMergeTargetQuery("");
    setMergeFilterMuscle("ALL");
    setMergeFilterEquip("ALL");
  }

  function handleRename() {
    if (renameTargetId && renameInputValue.trim()) {
      setExerciseAlias(renameTargetId, renameInputValue.trim());
    }
    setRenameTargetId(null);
    setRenameInputValue("");
  }

  const allExercises = [...customExercises, ...EXERCISE_CATALOG];
  const sourceExercise = mergeSourceId ? allExercises.find(e => e.id === mergeSourceId) : null;
  
  let mergeTargetList = [];
  if (sourceExercise) {
    const ignoreWords = new Set(["smith", "machine", "barbell", "dumbbell", "cable", "band", "kettlebell"]);
    const sourceWords = sourceExercise.name.toLowerCase().split(/[\s()]+/).filter(w => w.length > 2 && !ignoreWords.has(w));
    
    const isSearchingOrFiltering = mergeTargetQuery.trim() || mergeFilterMuscle !== "ALL" || mergeFilterEquip !== "ALL";

    mergeTargetList = allExercises
      .filter((ex) => !hiddenEquipments.includes(ex.equipment))
      .filter((ex) => ex.id !== mergeSourceId)
      .filter((ex) => mergeFilterMuscle === "ALL" || ex.muscle === mergeFilterMuscle)
      .filter((ex) => mergeFilterEquip === "ALL" || ex.equipment === mergeFilterEquip)
      .filter((ex) => {
        const dName = aliases[ex.id] || ex.name;
        const q = mergeTargetQuery.trim().toLowerCase();
        if (!q) return true;
        const queryWords = q.split(/\s+/);
        const targetName = dName.toLowerCase();
        return queryWords.every(w => targetName.includes(w));
      })
      .map(ex => {
        let score = 0;
        if (ex.muscle === sourceExercise.muscle) score += 50; // Heavily prioritize same muscle group
        if (ex.equipment === sourceExercise.equipment) score += 20; // Prioritize same equipment
        
        const targetName = ex.name.toLowerCase();
        for (const w of sourceWords) {
          if (targetName.includes(w)) score += 5; // Word match
        }

        const dist = levenshtein(sourceExercise.name.toLowerCase(), targetName);
        score -= (dist * 0.1); // Small penalty as tie-breaker for name similarity
        
        if (isSearchingOrFiltering) score += 1000;
        
        return { ex, score };
      })
      .filter(item => isSearchingOrFiltering || item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.ex);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          <button onClick={() => setTab("home")} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>Mis Ejercicios</h1>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap", padding: "0.4rem 0.75rem" }}>
          <Plus size={16} />
          Crear
        </button>
      </header>

      <section className="card" style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar press, sentadilla…"
              style={{ width: "100%", padding: "0.45rem 0.5rem 0.45rem 2rem", fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select 
              className="form-input" 
              value={filterMuscle} 
              onChange={e => setFilterMuscle(e.target.value as any)}
              style={{ flex: 1, padding: "0.4rem", fontSize: "0.8rem" }}
            >
              <option value="ALL">Músculo (Todos)</option>
              {MUSCLE_OPTIONS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            <select 
              className="form-input" 
              value={filterEquip} 
              onChange={e => setFilterEquip(e.target.value as any)}
              style={{ flex: 1, padding: "0.4rem", fontSize: "0.8rem" }}
            >
              <option value="ALL">Material (Todos)</option>
                {EQUIPMENT_OPTIONS.filter(eq => !hiddenEquipments.includes(eq.id)).map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.label}</option>
                ))}
            </select>
          </div>

          <div style={{ display: "flex", background: "var(--bg-secondary)", padding: "0.2rem", borderRadius: "8px" }}>
            <button
              onClick={() => setFilter("custom")}
              style={{ flex: 1, padding: "0.3rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", background: filter === "custom" ? "var(--color-primary)" : "transparent", color: filter === "custom" ? "#fff" : "var(--text-secondary)", transition: "all 0.2s" }}
            >
              Personalizados
            </button>
            <button
              onClick={() => setFilter("all")}
              style={{ flex: 1, padding: "0.3rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", background: filter === "all" ? "var(--color-primary)" : "transparent", color: filter === "all" ? "#fff" : "var(--text-secondary)", transition: "all 0.2s" }}
            >
              Todos
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
            <p>No hay ejercicios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.35rem", listStyle: "none", margin: 0, padding: 0 }}>
            {list.map((ex) => (
              <li key={ex.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", background: "var(--bg-glass)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", transition: "all 0.2s", position: "relative" }}>
                <button 
                  onClick={() => setSelectedExercise(ex)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                >
                  {ex.gifUrl ? (
                    <img 
                      src={ex.gifUrl} 
                      alt="" 
                      loading="lazy" 
                      style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", background: "var(--bg-primary)", flexShrink: 0 }} 
                    />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Dumbbell size={18} style={{ color: "var(--text-secondary)" }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {aliases[ex.id] || ex.name}
                      {ex.custom && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", background: "var(--accent-primary-light)", color: "var(--bg-primary)", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 700, flexShrink: 0 }}>Custom</span>}
                    </h3>
                    <p style={{ marginTop: "0.15rem", fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                      {MUSCLE_LABEL[ex.muscle]} · {ex.equipment}
                      {lastUsedMap.has(ex.id) && <span style={{ color: "var(--accent-primary-light)" }}> · {usageCountMap.get(ex.id)}× · {new Date(lastUsedMap.get(ex.id)!).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </p>
                  </div>
                </button>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === ex.id ? null : ex.id); }}
                    style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.4rem", display: "flex", alignItems: "center" }}
                    aria-label="Más opciones"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuOpenId === ex.id && (
                    <div
                      ref={menuRef}
                      onClick={() => setMenuOpenId(null)}
                      style={{ position: "absolute", right: 0, top: "100%", zIndex: 50, background: "var(--bg-card)", border: "1px solid var(--border-medium)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", minWidth: "180px", padding: "0.35rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}
                    >
                      <button
                        onClick={() => {
                          if (ex.custom) {
                            setEditingExercise(ex);
                            setNewName(ex.name);
                            setNewMuscle(ex.muscle);
                            setNewEquip(ex.equipment);
                            setNewImage(ex.gifUrl);
                          } else {
                            setRenameTargetId(ex.id);
                            setRenameInputValue(aliases[ex.id] || ex.name);
                          }
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.6rem 0.75rem", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "8px", fontSize: "0.85rem", textAlign: "left" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        {ex.custom ? "Editar" : "Renombrar"}
                      </button>
                      <button
                        onClick={() => {
                          setNewName((aliases[ex.id] || ex.name) + " ()");
                          setNewMuscle(ex.muscle);
                          setNewEquip(ex.equipment);
                          setNewImage(ex.gifUrl);
                          setCreating(true);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.6rem 0.75rem", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "8px", fontSize: "0.85rem", textAlign: "left" }}
                      >
                        <Plus size={16} />
                        Añadir Variante
                      </button>
                      {ex.custom && (
                        <>
                          <button
                            onClick={() => setMergeSourceId(ex.id)}
                            style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.6rem 0.75rem", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "8px", fontSize: "0.85rem", textAlign: "left" }}
                          >
                            <LinkIcon size={16} />
                            Fusionar
                          </button>
                          <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0.2rem 0.5rem" }} />
                          <button
                            onClick={() => deleteCustomExercise(ex.id)}
                            style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.6rem 0.75rem", background: "none", border: "none", color: "#ef4444", cursor: "pointer", borderRadius: "8px", fontSize: "0.85rem", textAlign: "left" }}
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", maxWidth: "450px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.25rem", fontWeight: 700 }}>Crear Ejercicio / Variante</DialogTitle>
            <DialogDescription style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Añade un nuevo ejercicio personalizado a tu catálogo.
            </DialogDescription>
          </DialogHeader>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Nombre</label>
              <input
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Triceps pushdown (cuerda)"
                autoFocus
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Músculo</label>
                <select
                  className="form-input"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_OPTIONS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Equipamiento</label>
                <select
                  className="form-input"
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value as Equipment)}
                >
                  {EQUIPMENT_OPTIONS.filter(eq => !hiddenEquipments.includes(eq.id)).map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Foto de la Máquina (Opcional)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                {newImage ? (
                  <img src={newImage} alt="Preview" style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", background: "var(--bg-primary)" }} />
                ) : (
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={20} style={{ color: "var(--text-secondary)" }} />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: 1 }}
                />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>La imagen se optimizará automáticamente para no ocupar espacio.</p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={() => setCreating(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={!newName.trim()} className="btn btn-primary" style={{ opacity: newName.trim() ? 1 : 0.5 }}>
              Guardar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingExercise} onOpenChange={(o) => !o && setEditingExercise(null)}>
        <DialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", maxWidth: "450px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.25rem", fontWeight: 700 }}>Editar Ejercicio Personalizado</DialogTitle>
          </DialogHeader>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Nombre</label>
              <input
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Músculo</label>
                <select
                  className="form-input"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_OPTIONS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Equipamiento</label>
                <select
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value as Equipment)}
                  className="form-input"
                >
                  {EQUIPMENT_OPTIONS.filter(eq => !hiddenEquipments.includes(eq.id)).map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>Foto de la Máquina (Opcional)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px", border: "1px dashed var(--border-color)" }}>
                {newImage ? (
                  <img src={newImage} alt="Preview" style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", background: "var(--bg-primary)" }} />
                ) : (
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={20} style={{ color: "var(--text-secondary)" }} />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", flex: 1 }}
                />
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button onClick={() => setEditingExercise(null)} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={handleUpdate} disabled={!newName.trim()} className="btn btn-primary" style={{ opacity: newName.trim() ? 1 : 0.5 }}>
              Actualizar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ExerciseDetailsModal 
        exercise={selectedExercise} 
        onClose={() => setSelectedExercise(null)} 
      />

      <Dialog open={!!mergeSourceId} onOpenChange={(o) => !o && setMergeSourceId(null)}>
        <DialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", maxWidth: "500px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.25rem", fontWeight: 700 }}>Fusionar Ejercicio</DialogTitle>
            <DialogDescription style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Busca y selecciona el ejercicio que quieras conservar. Todos los entrenamientos asociados a <strong style={{ color: "var(--text-primary)" }}>{allExercises.find(e => e.id === mergeSourceId)?.name}</strong> se pasarán al nuevo ejercicio.
            </DialogDescription>
          </DialogHeader>

          {!mergeConfirmTargetId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                  <input
                    className="form-input"
                    value={mergeTargetQuery}
                    onChange={(e) => setMergeTargetQuery(e.target.value)}
                    placeholder="Buscar ejercicio de destino..."
                    style={{ width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem" }}
                    autoFocus
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select 
                    className="form-input" 
                    value={mergeFilterMuscle} 
                    onChange={e => setMergeFilterMuscle(e.target.value as any)}
                    style={{ width: "50%", padding: "0.5rem", fontSize: "0.8rem" }}
                  >
                    <option value="ALL">Músculo (Todos)</option>
                    {MUSCLE_OPTIONS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <select 
                    className="form-input" 
                    value={mergeFilterEquip} 
                    onChange={e => setMergeFilterEquip(e.target.value as any)}
                    style={{ width: "50%", padding: "0.5rem", fontSize: "0.8rem" }}
                  >
                    <option value="ALL">Material (Todos)</option>
                    {EQUIPMENT_OPTIONS.filter(eq => !hiddenEquipments.includes(eq.id)).map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {mergeTargetList.length > 0 ? (
                <>
                  {!mergeTargetQuery.trim() && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Sugerencias:</p>
                  )}
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.25rem", listStyle: "none", margin: 0, padding: "0 0.25rem 0 0", maxHeight: "45vh", overflowY: "auto" }}>
                    {mergeTargetList.map((ex) => (
                      <li key={ex.id}>
                        <button
                          onClick={() => setMergeConfirmTargetId(ex.id)}
                          style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {ex.gifUrl ? (
                              <img src={ex.gifUrl} alt={ex.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", background: "var(--bg-primary)" }} />
                            ) : (
                              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ImageIcon size={18} style={{ color: "var(--text-secondary)" }} />
                              </div>
                            )}
                            <div>
                              <p style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                                {ex.name}
                                {ex.custom && <span style={{ fontSize: "0.55rem", padding: "0.05rem 0.25rem", background: "var(--accent-primary-light)", color: "var(--bg-primary)", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 700 }}>Custom</span>}
                              </p>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "capitalize", marginTop: "0.1rem" }}>
                                {MUSCLE_LABEL[ex.muscle]} · {ex.equipment}
                              </p>
                            </div>
                          </div>
                          <Plus size={16} style={{ color: "var(--text-secondary)" }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "1.5rem" }}>
                  Escribe para buscar el ejercicio destino.
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <AlertTriangle size={20} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: "0.1rem" }} />
                  <div>
                    <h4 style={{ color: "var(--color-danger)", fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>Confirmar Fusión</h4>
                    <p style={{ color: "var(--text-primary)", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
                      Estás a punto de mover todos los datos de <strong>{allExercises.find(e => e.id === mergeSourceId)?.name}</strong> hacia <strong>{allExercises.find(e => e.id === mergeConfirmTargetId)?.name}</strong>.
                    </p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
                      Esta acción no se puede deshacer y el ejercicio original será eliminado.
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button onClick={() => setMergeConfirmTargetId(null)} className="btn btn-secondary">
                  Atrás
                </button>
                <button onClick={handleConfirmMerge} className="btn btn-danger">
                  Fusionar Definitivamente
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTargetId} onOpenChange={(o) => !o && setRenameTargetId(null)}>
        <DialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", maxWidth: "400px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "1.25rem", fontWeight: 700 }}>Renombrar Ejercicio</DialogTitle>
            <DialogDescription style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Este nombre se mostrará en lugar del original.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <input
              className="form-input"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              placeholder="Ej: Press Pecho Multipower"
              style={{ width: "100%", padding: "0.75rem" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setRenameTargetId(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={handleRename} className="btn btn-primary" disabled={!renameInputValue.trim()}>
                Guardar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
