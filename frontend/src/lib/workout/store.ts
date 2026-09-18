import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";
import { SEED_TEMPLATES, seedHistory } from "./seed";
import { previousFill } from "./format";
import { scheduleServerRestTimer, cancelServerRestTimer } from "./notifications";
import type {
  ActiveWorkout,
  CompletedWorkout,
  Exercise,
  MuscleGroup,
  Equipment,
  SetType,
  Tab,
  Template,
  WorkoutExercise,
  WorkoutSet,
} from "./types";
import { SET_TYPE_CYCLE } from "./types";

const DEFAULT_SETS = 3;

function blankSet(fill?: { weight: string; reps: string }): WorkoutSet {
  return {
    id: uid(),
    type: "normal",
    weight: fill?.weight ?? "",
    reps: fill?.reps ?? "",
    completed: false,
  };
}

function exercisesFromIds(
  ids: string[],
  history: CompletedWorkout[],
): WorkoutExercise[] {
  return ids.map((exerciseId) => ({
    id: uid(),
    exerciseId,
    notes: "",
    sets: Array.from({ length: DEFAULT_SETS }, (_, i) =>
      blankSet(previousFill(exerciseId, i, history)),
    ),
  }));
}

interface WorkoutState {
  tab: Tab;
  active: ActiveWorkout | null;
  history: CompletedWorkout[];
  templates: Template[];
  customExercises: Exercise[];
  restUntil: number | null;
  restPreset: number;
  restTimers: Record<string, number>;
  pickerOpen: boolean;
  detailId: string | null;
  settings: { showRpe: boolean };
  exerciseAliases: Record<string, string>;
  hiddenEquipments: string[];

  setTab: (tab: Tab) => void;
  setPickerOpen: (open: boolean) => void;
  setDetailId: (id: string | null) => void;
  setSettings: (settings: { showRpe: boolean }) => void;
  importWorkouts: (workouts: CompletedWorkout[], newCustomExercises: Exercise[]) => void;

  startEmpty: () => void;
  startFromTemplate: (tpl: Template, history: CompletedWorkout[]) => void;
  startFromHistory: (w: CompletedWorkout) => void;

  setWorkoutName: (name: string) => void;
  setRestPreset: (s: number) => void;
  setExerciseRestTimer: (exerciseId: string, seconds: number) => void;

  addExercises: (exerciseIds: string[], history: CompletedWorkout[]) => void;
  removeExercise: (id: string) => void;
  setExerciseNotes: (id: string, notes: string) => void;
  moveExercise: (id: string, dir: -1 | 1) => void;

  addSet: (exerciseRowId: string, history: CompletedWorkout[]) => void;
  removeSet: (exerciseRowId: string, setId: string) => void;
  updateSet: (exerciseRowId: string, setId: string, patch: Partial<WorkoutSet>) => void;
  cycleSetType: (exerciseRowId: string, setId: string) => void;
  toggleSet: (exerciseRowId: string, setId: string) => void;

  skipRest: () => void;
  adjustRest: (deltaSec: number) => void;

  finishWorkout: (customName?: string, customDurationMs?: number) => CompletedWorkout | null;
  discardWorkout: () => void;
  saveAsTemplate: () => Template | null;

  deleteHistory: (id: string) => void;
  updateHistoryWorkout: (id: string, patch: Partial<CompletedWorkout>) => void;
  deleteTemplate: (id: string) => void;
  deleteCustomExercise: (id: string) => void;
  updateCustomExercise: (id: string, patch: Partial<Exercise>) => void;
  mergeExercise: (sourceId: string, targetId: string) => void;
  addCustomExercise: (input: {
    name: string;
    muscle: MuscleGroup;
    equipment: Equipment;
    gifUrl?: string;
  }) => string;
  setExerciseAlias: (id: string, name: string) => void;
  toggleHiddenEquipment: (equip: string) => void;
  restoreDemo: () => void;
  clearMigratedData: () => void;
}

function patchActive(
  active: ActiveWorkout | null,
  exerciseRowId: string,
  fn: (ex: WorkoutExercise) => WorkoutExercise,
): ActiveWorkout | null {
  if (!active) return active;
  return {
    ...active,
    exercises: active.exercises.map((ex) => (ex.id === exerciseRowId ? fn(ex) : ex)),
  };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      tab: "home",
      active: null,
      history: seedHistory(),
      templates: SEED_TEMPLATES,
      customExercises: [],
      restUntil: null,
      restPreset: 90,
      restTimers: {},
      pickerOpen: false,
      detailId: null,
      settings: { showRpe: false },
      exerciseAliases: {},
      hiddenEquipments: [],

      setTab: (tab) => set({ tab }),
      setPickerOpen: (pickerOpen) => set({ pickerOpen }),
      setDetailId: (detailId) => set({ detailId }),
      setSettings: (settings) => set({ settings }),

      importWorkouts: (workouts, newCustomExercises) => {
        set((state) => ({
          history: [...workouts, ...state.history].sort((a, b) => b.startedAt - a.startedAt),
          customExercises: [...newCustomExercises, ...state.customExercises],
        }));
      },

      startEmpty: () => {
        set({
          active: {
            name: "Entrenamiento",
            startedAt: Date.now(),
            notes: "",
            exercises: [],
          },
          restUntil: null,
          tab: "train",
          pickerOpen: true,
        });
      },

      startFromTemplate: (tpl, history) => {
        if (!tpl) return;
        set({
          active: {
            name: tpl.name,
            startedAt: Date.now(),
            exercises: exercisesFromIds(tpl.exerciseIds, history),
          },
          restUntil: null,
          tab: "train",
        });
      },

      startFromHistory: (w) => {
        if (!w) return;
        set({
          active: {
            name: w.name,
            startedAt: Date.now(),
            exercises: w.exercises.map((ex) => ({
              id: uid(),
              exerciseId: ex.exerciseId,
              notes: "",
              sets: ex.sets.map((s) =>
                blankSet({
                  weight: s.weight,
                  reps: s.reps,
                }),
              ),
            })),
          },
          restUntil: null,
          tab: "train",
          detailId: null,
        });
      },

      setWorkoutName: (name) => {
        const active = get().active;
        if (!active) return;
        set({ active: { ...active, name } });
      },

      setRestPreset: (restPreset) => set({ restPreset }),

      setExerciseRestTimer: (exerciseId, seconds) => {
        set((state) => ({
          restTimers: {
            ...state.restTimers,
            [exerciseId]: seconds,
          },
        }));
      },

      addExercises: (exerciseIds, history) => {
        const active = get().active;
        if (!active) return;
        const existing = new Set(active.exercises.map((e) => e.exerciseId));
        const next = exerciseIds.filter((id) => !existing.has(id));
        if (next.length === 0) {
          set({ pickerOpen: false });
          return;
        }
        set({
          active: {
            ...active,
            exercises: [
              ...active.exercises,
              ...exercisesFromIds(next, history),
            ],
          },
          pickerOpen: false,
        });
      },

      removeExercise: (id) => {
        const active = get().active;
        if (!active) return;
        set({
          active: {
            ...active,
            exercises: active.exercises.filter((e) => e.id !== id),
          },
        });
      },

      setExerciseNotes: (id, notes) => {
        set({
          active: patchActive(get().active, id, (ex) => ({ ...ex, notes })),
        });
      },

      moveExercise: (id, dir) => {
        const active = get().active;
        if (!active) return;
        const idx = active.exercises.findIndex((e) => e.id === id);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= active.exercises.length) return;
        const copy = [...active.exercises];
        const [row] = copy.splice(idx, 1);
        copy.splice(next, 0, row);
        set({ active: { ...active, exercises: copy } });
      },

      addSet: (exerciseRowId, history) => {
        set({
          active: patchActive(get().active, exerciseRowId, (ex) => {
            const last = ex.sets[ex.sets.length - 1];
            return {
              ...ex,
              sets: [
                ...ex.sets,
                blankSet(
                  last
                    ? { weight: last.weight, reps: last.reps }
                    : previousFill(ex.exerciseId, ex.sets.length, history),
                ),
              ],
            };
          }),
        });
      },

      removeSet: (exerciseRowId, setId) => {
        set({
          active: patchActive(get().active, exerciseRowId, (ex) => ({
            ...ex,
            sets: ex.sets.length <= 1 ? ex.sets : ex.sets.filter((s) => s.id !== setId),
          })),
        });
      },

      updateSet: (exerciseRowId, setId, patch) => {
        set({
          active: patchActive(get().active, exerciseRowId, (ex) => ({
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
          })),
        });
      },

      cycleSetType: (exerciseRowId, setId) => {
        set({
          active: patchActive(get().active, exerciseRowId, (ex) => ({
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              const i = SET_TYPE_CYCLE.indexOf(s.type);
              const type = SET_TYPE_CYCLE[(i + 1) % SET_TYPE_CYCLE.length] as SetType;
              return { ...s, type };
            }),
          })),
        });
      },

      toggleSet: (exerciseRowId, setId) => {
        const { active, restTimers, restPreset } = get();
        if (!active) return;
        let completing = false;
        let exerciseId = "";
        const next = patchActive(active, exerciseRowId, (ex) => {
          exerciseId = ex.exerciseId;
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id !== setId) return s;
              completing = !s.completed;
              return { ...s, completed: !s.completed };
            }),
          };
        });
        const delay = restTimers[exerciseId] ?? restPreset;
        set({
          active: next,
          restUntil: completing ? Date.now() + delay * 1000 : get().restUntil,
        });
        // Schedule server-side push notification for background delivery
        if (completing) {
          scheduleServerRestTimer(delay);
        }
      },

      skipRest: () => {
        set({ restUntil: null });
        cancelServerRestTimer();
      },

      adjustRest: (deltaSec) => {
        const until = get().restUntil;
        if (!until) return;
        const next = Math.max(Date.now() + 1000, until + deltaSec * 1000);
        set({ restUntil: next });
        // Reschedule server timer with new remaining time
        const newDelay = Math.max(1, Math.ceil((next - Date.now()) / 1000));
        scheduleServerRestTimer(newDelay);
      },

      finishWorkout: (customName?: string, customDurationMs?: number) => {
        const active = get().active;
        if (!active) return null;
        const hasWork = active.exercises.some((e) => e.sets.some((s) => s.completed));
        if (!hasWork) return null;

        const startedAt = active.startedAt;
        const finishedAt = customDurationMs !== undefined 
          ? startedAt + customDurationMs 
          : Date.now();

        const record: CompletedWorkout = {
          id: uid(),
          name: customName?.trim() || active.name.trim() || "Entrenamiento",
          startedAt,
          finishedAt,
          exercises: active.exercises,
        };
        set({
          active: null,
          restUntil: null,
          tab: "history",
          detailId: record.id,
        });
        return record;
      },

      setExerciseAlias: (id, name) => {
        set((state) => ({
          exerciseAliases: { ...state.exerciseAliases, [id]: name },
        }));
      },

      toggleHiddenEquipment: (equip) => {
        set((state) => {
          const arr = state.hiddenEquipments || [];
          const next = arr.includes(equip) ? arr.filter((e) => e !== equip) : [...arr, equip];
          return { hiddenEquipments: next };
        });
      },

      clearMigratedData: () => {
        set({
          history: [],
          templates: [],
          customExercises: [],
        });
      },

      discardWorkout: () => {
        set({ active: null, restUntil: null, tab: "home" });
      },

      saveAsTemplate: () => {
        const active = get().active;
        if (!active || active.exercises.length === 0) return null;
        const tpl: Template = {
          id: uid(),
          name: active.name.trim() || "Plantilla",
          exerciseIds: active.exercises.map((e) => e.exerciseId),
        };
        return tpl;
      },

      deleteHistory: (id) => {
        set({
          history: get().history.filter((w) => w.id !== id),
          detailId: get().detailId === id ? null : get().detailId,
        });
      },

      updateHistoryWorkout: (id, patch) => {
        set({
          history: get().history.map((w) =>
            w.id === id ? { ...w, ...patch } : w
          ),
        });
      },

      deleteTemplate: (id) => {
        set({ templates: get().templates.filter((t) => t.id !== id) });
      },

      addCustomExercise: ({ name, muscle, equipment, gifUrl }) => {
        const id = uid();
        const ex: Exercise = {
          id,
          name: name.trim(),
          muscle,
          equipment,
          custom: true,
          gifUrl,
        };
        set({ customExercises: [ex, ...get().customExercises] });
        return id;
      },

      deleteCustomExercise: (id) => {
        set({ customExercises: get().customExercises.filter((e) => e.id !== id) });
      },

      updateCustomExercise: (id, patch) => {
        set({
          customExercises: get().customExercises.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        });
      },

      mergeExercise: (sourceId, targetId) => {
        const { history, templates, active, customExercises } = get();

        // 1. Update history
        const newHistory = history.map((w) => ({
          ...w,
          exercises: w.exercises.map((ex) =>
            ex.exerciseId === sourceId ? { ...ex, exerciseId: targetId } : ex
          ),
        }));

        // 2. Update templates
        const newTemplates = templates.map((t) => ({
          ...t,
          exerciseIds: t.exerciseIds.map((id) => (id === sourceId ? targetId : id)),
        }));

        // 3. Update active workout
        const newActive = active
          ? {
              ...active,
              exercises: active.exercises.map((ex) =>
                ex.exerciseId === sourceId ? { ...ex, exerciseId: targetId } : ex
              ),
            }
          : null;

        // 4. Remove sourceId from customExercises
        const newCustomExercises = customExercises.filter((e) => e.id !== sourceId);

        set({
          history: newHistory,
          templates: newTemplates,
          active: newActive,
          customExercises: newCustomExercises,
        });
      },

      restoreDemo: () => {
        set({
          history: seedHistory(),
          templates: SEED_TEMPLATES,
          customExercises: [],
          active: null,
          restUntil: null,
          tab: "home",
          detailId: null,
        });
      },
    }),
    {
      name: "forja-v1",
      partialize: (s) => ({
        active: s.active,
        history: s.history,
        templates: s.templates,
        customExercises: s.customExercises,
        restUntil: s.restUntil,
        restPreset: s.restPreset,
        restTimers: s.restTimers,
        tab: s.tab,
        settings: s.settings,
        hiddenEquipments: s.hiddenEquipments,
        exerciseAliases: s.exerciseAliases,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          if (persistedState.customExercises) {
            persistedState.customExercises = persistedState.customExercises.map((ex: any) => {
              const name = (ex.name || "").toLowerCase();
              if ((name.includes("smith ") || name.endsWith("smith") || name.includes(" smith") || name === "smith") && ex.equipment !== "multipower") {
                return { ...ex, equipment: "multipower" };
              }
              return ex;
            });
          }
        }
        return persistedState as WorkoutState;
      },
    },
  ),
);
