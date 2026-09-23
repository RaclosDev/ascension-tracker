import { useState } from "react";
import { Repeat2, Trash2, ArrowLeft, Edit3, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { EmptyCard } from "@/components/workout/dashboard";
import { Badge } from "@/components/ui/badge";
import { getExerciseMap } from "@/lib/workout/exercises";
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  isPrSet,
  sessionVolume,
} from "@/lib/workout/format";
import { useWorkoutStore } from "@/lib/workout/store";
import { SET_TYPE_LABEL } from "@/lib/workout/types";
import { cn } from "@/lib/utils";

import { useWorkoutHistory, useDeleteWorkout, useCustomExercises } from "@/lib/workout/api";

export function HistoryView() {
  const { 
    data, 
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useWorkoutHistory();
  const history = data?.pages.flatMap(page => page.content) ?? [];
  const { data: customExercises = [] } = useCustomExercises();
  const deleteWorkout = useDeleteWorkout();
  
  const startFromHistory = useWorkoutStore((s) => s.startFromHistory);
  const deleteHistory = (id: string) => deleteWorkout.mutate(id);
  const updateHistoryWorkout = useWorkoutStore((s) => s.updateHistoryWorkout);
  const detailId = useWorkoutStore((s) => s.detailId);
  const setDetailId = useWorkoutStore((s) => s.setDetailId);
  const setTab = useWorkoutStore((s) => s.setTab);
  const settings = useWorkoutStore((s) => s.settings);
  const showRpe = settings?.showRpe ?? false;
  const catalog = getExerciseMap(customExercises);
  const detail = history.find((w) => w.id === detailId) ?? null;

  const [editHistoryOpen, setEditHistoryOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header style={{ marginBottom: "1rem" }}>
        <button onClick={() => setTab("home")} className="btn btn-secondary" style={{ width: "fit-content", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--text-secondary)" }}>
          Archivo
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>Historial</h1>
      </header>

      {history.length === 0 ? (
        <EmptyCard
          title="El diario está vacío"
          body="Las sesiones terminadas aparecen aquí, con volumen y cada serie."
        />
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: 0, margin: 0, listStyle: "none" }}>
          {history.map((w) => {
            const names = w.exercises.map(
              (e) => catalog.get(e.exerciseId)?.name ?? "Ejercicio",
            );
            return (
              <li key={w.id}>
                <article className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setDetailId(w.id)}
                    style={{ display: "block", width: "100%", padding: "1.25rem", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                      <div>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>{w.name}</h2>
                        <p style={{ marginTop: "0.25rem", fontSize: "0.85rem", textTransform: "capitalize", color: "var(--text-secondary)" }}>
                          {formatDay(w.finishedAt)}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "8px" }}>
                      <Stat label="Duración" value={formatDuration(w.finishedAt - w.startedAt)} />
                      <Stat label="Volumen" value={formatKg(sessionVolume(w.exercises))} />
                      <Stat
                        label="Series"
                        value={`${completedSets(w.exercises)}`}
                      />
                    </div>
                    <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {names.join(" · ")}
                    </p>
                  </button>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderTop: "1px solid var(--border-color)", padding: "0.5rem 1rem" }}>
                    <button onClick={() => startFromHistory(w)} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Repeat2 size={16} />
                      Repetir
                    </button>
                    <button onClick={() => deleteHistory(w.id)} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)" }}>
                      <Trash2 size={16} />
                      Borrar
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
          {hasNextPage && (
            <button 
              className="btn btn-secondary" 
              style={{ width: "100%", padding: '1rem', marginTop: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center' }} 
              onClick={() => fetchNextPage()} 
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Cargando...' : 'Cargar más entrenamientos'}
            </button>
          )}
        </ul>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        {detail ? (
          <DialogContent className="workout-detail-modal" style={{ padding: '0', background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', borderRadius: '16px', display: 'flex', flexDirection: 'column', maxHeight: '90dvh', width: '95vw', maxWidth: '500px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.25rem 1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{detail.name}</h2>
                    <button 
                      onClick={() => {
                        setEditName(detail.name);
                        setEditDuration(Math.max(1, Math.floor((detail.finishedAt - detail.startedAt) / 60000)));
                        setEditHistoryOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'capitalize', marginTop: '0.2rem' }}>
                    {formatDay(detail.finishedAt)}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                <Stat label="Duración" value={formatDuration(detail.finishedAt - detail.startedAt)} />
                <Stat label="Volumen" value={formatKg(sessionVolume(detail.exercises))} />
                <Stat label="Series" value={`${completedSets(detail.exercises)}`} />
              </div>

              {detail.notes ? (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>"{detail.notes}"</p>
                </div>
              ) : null}
            </div>

            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {detail.exercises.map((ex) => {
                  const meta = catalog.get(ex.exerciseId);
                  const isCardio = meta?.muscle === "cardio";
                  return (
                    <div key={ex.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        {meta?.gifUrl ? (
                          <img src={meta.gifUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: 'var(--bg-primary)' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Dumbbell size={18} style={{ color: "var(--text-secondary)" }} />
                          </div>
                        )}
                        <div>
                          {ex.supersetId && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.3rem', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', letterSpacing: '0.5px', marginRight: '0.4rem', display: 'inline-block', marginBottom: '0.2rem' }}>
                              SUPER
                            </span>
                          )}
                          <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                            {meta?.name ?? "Ejercicio"}
                          </h3>
                        </div>
                      </div>
                      
                      {ex.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                          {ex.notes}
                        </p>
                      )}
                      
                      <table className="detail-set-table">
                        <thead>
                          <tr>
                            <th>Serie</th>
                            <th>{isCardio ? "Km" : "Kg"}</th>
                            <th>{isCardio ? "Tiempo" : "Reps"}</th>
                            {showRpe && <th>RPE</th>}
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {ex.sets.map((s, i) => {
                            let normalCount = 0;
                            for (let j = 0; j < i; j++) {
                              if (ex.sets[j].type === "normal") normalCount++;
                            }
                            return (
                            <tr key={s.id} style={{ opacity: s.completed ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                              <td>
                                <span style={{ 
                                  display: 'inline-block', width: '24px', height: '24px', 
                                  lineHeight: '24px', borderRadius: '6px', 
                                  background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)'
                                }}>
                                  {SET_TYPE_LABEL[s.type] || normalCount + 1}
                                </span>
                              </td>
                              <td className="bold-val">{isCardio ? s.distance || "" : s.weight || ""}</td>
                              <td className="bold-val">{isCardio ? s.duration || "" : s.reps || ""}</td>
                              {showRpe && <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.rpe || ""}</td>}
                              <td>
                                {s.completed && isPrSet(ex.exerciseId, s.weight, history, detail.id) ? (
                                  <span className="text-[0.65rem] font-bold text-[var(--color-success)] bg-emerald-500/15 px-1.5 py-1 rounded-sm">PR</span>
                                ) : null}
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ width: "100%", padding: '1rem', display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: '2rem', fontSize: '1rem', fontWeight: 600, borderRadius: '12px' }} 
                onClick={() => startFromHistory(detail)}
              >
                <Repeat2 size={20} />
                Repetir Entrenamiento
              </button>
              
              <button 
                className="btn btn-secondary" 
                style={{ width: "100%", padding: '1rem', display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: '0.75rem', fontSize: '1rem', fontWeight: 600, borderRadius: '12px' }} 
                onClick={() => setDetailId(null)}
              >
                Cerrar
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ width: "100%", padding: '1rem', display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: '0.75rem', fontSize: '1rem', fontWeight: 600, borderRadius: '12px', color: "var(--color-danger)" }} 
                onClick={() => {
                  deleteHistory(detail.id);
                  setDetailId(null);
                }}
              >
                <Trash2 size={20} />
                Borrar Entrenamiento
              </button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <AlertDialog open={editHistoryOpen} onOpenChange={setEditHistoryOpen}>
        <AlertDialogContent className="card" style={{ padding: "1.5rem", background: "var(--bg-primary)", border: "1px solid var(--border-color)", width: "95vw", maxWidth: "400px", maxHeight: "85dvh", overflowY: "auto" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Editar Sesión</AlertDialogTitle>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Nombre del entrenamiento</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-medium)", color: "var(--text-primary)", borderRadius: "8px", padding: "0.5rem" }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Duración (minutos)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editDuration} 
                  onChange={(e) => setEditDuration(Number(e.target.value))} 
                  min="1"
                  style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-medium)", color: "var(--text-primary)", borderRadius: "8px", padding: "0.5rem" }}
                />
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter style={{ marginTop: "1.5rem" }}>
            <AlertDialogCancel className="btn btn-secondary">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="btn btn-primary" 
              onClick={() => {
                if (detail) {
                  updateHistoryWorkout(detail.id, {
                    name: editName.trim() || "Entrenamiento",
                    finishedAt: detail.startedAt + editDuration * 60000
                  });
                }
                setEditHistoryOpen(false);
              }}
            >
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p style={{ marginTop: '0.15rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
