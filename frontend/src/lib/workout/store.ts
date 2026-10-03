import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { uid } from '@/lib/utils';
import { previousFill } from './format';
import { scheduleServerRestTimer, cancelServerRestTimer } from './notifications';
import type {
  ActiveWorkout,
  CompletedWorkout,
  SetType,
  Tab,
  Template,
  WorkoutExercise,
  WorkoutSet,
} from './types';
import { SET_TYPE_CYCLE } from './types';

const DEFAULT_SETS = 3;

function blankSet(fill?: { weight: string; reps: string }): WorkoutSet {
  return {
    id: uid(),
    type: 'normal',
    weight: fill?.weight ?? '',
    reps: fill?.reps ?? '',
    completed: false,
  };
}

export type ExerciseSelection = {
  exerciseId: string;
  variant?: { grip?: string; machine?: string };
};

function exercisesFromIds(
  selections: (ExerciseSelection | string)[],
  history: CompletedWorkout[],
): WorkoutExercise[] {
  return selections.map((sel) => {
    const obj = typeof sel === 'string' ? { exerciseId: sel, variant: undefined } : sel;
    return {
      id: uid(),
      exerciseId: obj.exerciseId,
      variant: obj.variant,
      notes: '',
      sets: Array.from({ length: DEFAULT_SETS }, (_, i) =>
        blankSet(previousFill(obj.exerciseId, obj.variant, i, history)),
      ),
    };
  });
}

interface WorkoutState {
  tab: Tab;
  active: ActiveWorkout | null;
  restUntil: number | null;
  restPreset: number;
  restTimers: Record<string, number>;
  pickerOpen: boolean;
  detailId: string | null;
  settings: { showRpe: boolean };
  exerciseAliases: Record<string, string>;
  exerciseGifs: Record<string, string>;
  globalMachines: string[];
  globalGrips: string[];
  exerciseVariants: Record<string, { grips?: string[]; machines?: string[] }>;

  addGlobalMachine: (name: string) => void;
  removeGlobalMachine: (name: string) => void;
  addGlobalGrip: (name: string) => void;
  removeGlobalGrip: (name: string) => void;
  addExerciseVariant: (exerciseId: string, type: 'grip' | 'machine', name: string) => void;
  removeExerciseVariant: (exerciseId: string, type: 'grip' | 'machine', name: string) => void;
  hiddenEquipments: string[];

  setTab: (tab: Tab) => void;
  setPickerOpen: (open: boolean) => void;
  setDetailId: (id: string | null) => void;
  setSettings: (settings: { showRpe: boolean }) => void;

  startEmpty: () => void;
  startFromTemplate: (tpl: Template, history: CompletedWorkout[]) => void;
  startFromHistory: (w: CompletedWorkout) => void;
  editWorkout: (w: CompletedWorkout) => void;

  setWorkoutName: (name: string) => void;
  setRestPreset: (s: number) => void;
  setExerciseRestTimer: (exerciseId: string, seconds: number) => void;

  addExercises: (selections: (ExerciseSelection | string)[], history: CompletedWorkout[]) => void;
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

  setExerciseAlias: (id: string, name: string) => void;
  setExerciseGif: (id: string, gifUrl: string) => void;
  toggleHiddenEquipment: (equip: string) => void;
  updateExerciseVariant: (id: string, variant: { grip?: string; machine?: string }) => void;
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
      tab: 'home',
      active: null,
      restUntil: null,
      restPreset: 90,
      restTimers: {},
      pickerOpen: false,
      detailId: null,
      settings: { showRpe: false },
      exerciseAliases: {},
      exerciseGifs: {},
      globalMachines: ['Hammer Strength', 'Technogym', 'Technogym Discos'],
      globalGrips: [],
      exerciseVariants: {},
      hiddenEquipments: [],

      setTab: (tab) => set({ tab }),
      setPickerOpen: (pickerOpen) => set({ pickerOpen }),
      setDetailId: (detailId) => set({ detailId }),
      setSettings: (settings) => set({ settings }),

      startEmpty: () => {
        set({
          active: {
            name: 'Entrenamiento',
            startedAt: Date.now(),
            notes: '',
            exercises: [],
          },
          restUntil: null,
          tab: 'train',
          pickerOpen: true,
        });
      },

      startFromTemplate: (tpl, history) => {
        if (!tpl) return;
        set({
          active: {
            name: tpl.name,
            startedAt: Date.now(),
            exercises: exercisesFromIds(
              tpl.exercises.map((e) => ({ exerciseId: e.exerciseId, variant: e.variant })),
              history,
            ),
          },
          restUntil: null,
          tab: 'train',
        });
      },

      editWorkout: (w: any) => {
        if (!w) return;
        set({
          active: {
            name: w.name,
            startedAt: w.startedAt,
            editingId: w.id,
            editingFinishedAt: w.finishedAt,
            notes: w.notes,
            exercises: w.exercises.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) })),
          },
          restUntil: null,
          tab: 'train',
          detailId: null,
        });
      },

      startFromHistory: (w: any) => {
        if (!w) return;
        set({
          active: {
            name: w.name,
            startedAt: Date.now(),
            exercises: w.exercises.map((ex) => ({
              id: uid(),
              exerciseId: ex.exerciseId,
              notes: '',
              sets: ex.sets.map((s) =>
                blankSet({
                  weight: s.weight,
                  reps: s.reps,
                }),
              ),
            })),
          },
          restUntil: null,
          tab: 'train',
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

      addExercises: (selections, history) => {
        const active = get().active;
        if (!active) return;

        // Don't add if exactly same exerciseId + variant is already present
        const isDuplicate = (s: ExerciseSelection | string) => {
          const sel = typeof s === 'string' ? { exerciseId: s } : s;
          return active.exercises.some(
            (e) =>
              e.exerciseId === sel.exerciseId &&
              e.variant?.grip === sel.variant?.grip &&
              e.variant?.machine === sel.variant?.machine,
          );
        };

        const next = selections.filter((sel) => !isDuplicate(sel));
        if (next.length === 0) {
          set({ pickerOpen: false });
          return;
        }
        set({
          active: {
            ...active,
            exercises: [...active.exercises, ...exercisesFromIds(next, history)],
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

      updateExerciseVariant: (id, variant) => {
        set({
          active: patchActive(get().active, id, (ex) => ({ ...ex, variant })),
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
                    : previousFill(ex.exerciseId, ex.variant, ex.sets.length, history),
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
        let exerciseId = '';
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
        const newDelay = Math.max(1, Math.ceil((next - Date.now()) / 1000));
        scheduleServerRestTimer(newDelay);
      },
      finishWorkout: (customName?: string, customDurationMs?: number) => {
        const active = get().active;
        if (!active) return null;
        const hasWork = active.exercises.some((e) => e.sets.some((s) => s.completed));
        if (!hasWork) return null;

        const finalFinishedAt = active.editingFinishedAt || Date.now();
        let finalStartedAt = active.startedAt;

        if (customDurationMs !== undefined) {
          finalStartedAt = finalFinishedAt - customDurationMs;
        }

        const record: CompletedWorkout = {
          id: active.editingId || uid(),
          name: customName?.trim() || active.name.trim() || 'Entrenamiento',
          startedAt: finalStartedAt,
          finishedAt: finalFinishedAt,
          exercises: active.exercises,
        };

        if (active.notes) {
          record.notes = active.notes;
        }

        set({
          active: null,
          restUntil: null,
          tab: active.editingId ? 'history' : 'home',
          detailId: null,
        });
        return record;
      },

      setExerciseAlias: (id, name) => {
        set((state) => ({
          exerciseAliases: { ...state.exerciseAliases, [id]: name },
        }));
      },

      setExerciseGif: (id, gifUrl) => {
        set((state) => ({
          exerciseGifs: { ...state.exerciseGifs, [id]: gifUrl },
        }));
      },
      addGlobalMachine: (name) =>
        set((s) => ({ globalMachines: Array.from(new Set([...s.globalMachines, name])) })),
      removeGlobalMachine: (name) =>
        set((s) => ({ globalMachines: s.globalMachines.filter((m) => m !== name) })),
      addGlobalGrip: (name) =>
        set((s) => ({ globalGrips: Array.from(new Set([...s.globalGrips, name])) })),
      removeGlobalGrip: (name) =>
        set((s) => ({ globalGrips: s.globalGrips.filter((g) => g !== name) })),
      addExerciseVariant: (exerciseId, type, name) =>
        set((s) => {
          const ev = s.exerciseVariants[exerciseId] || {};
          const list = ev[(type + 's') as 'grips' | 'machines'] || [];
          return {
            exerciseVariants: {
              ...s.exerciseVariants,
              [exerciseId]: {
                ...ev,
                [type + 's']: Array.from(new Set([...list, name])),
              },
            },
          };
        }),
      removeExerciseVariant: (exerciseId, type, name) =>
        set((s) => {
          const ev = s.exerciseVariants[exerciseId] || {};
          const list = ev[(type + 's') as 'grips' | 'machines'] || [];
          return {
            exerciseVariants: {
              ...s.exerciseVariants,
              [exerciseId]: {
                ...ev,
                [type + 's']: list.filter((x) => x !== name),
              },
            },
          };
        }),

      toggleHiddenEquipment: (equip) => {
        set((state) => {
          const arr = state.hiddenEquipments || [];
          const next = arr.includes(equip) ? arr.filter((e) => e !== equip) : [...arr, equip];
          return { hiddenEquipments: next };
        });
      },

      discardWorkout: () => {
        const active = get().active;
        set({ active: null, restUntil: null, tab: active?.editingId ? 'history' : 'home' });
      },

      saveAsTemplate: () => {
        const active = get().active;
        if (!active || active.exercises.length === 0) return null;
        const tpl: Template = {
          id: uid(),
          name: active.name.trim() || 'Plantilla',
          exercises: active.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            variant: e.variant,
          })),
        };
        return tpl;
      },
    }),
    {
      name: 'forja-v1',
      storage: createJSONStorage(() => ({
        getItem: async (name) => (await get(name)) || null,
        setItem: async (name, value) => await set(name, value),
        removeItem: async (name) => await del(name),
      })),
      partialize: (s) => ({
        active: s.active,
        restUntil: s.restUntil,
        restPreset: s.restPreset,
        restTimers: s.restTimers,
        tab: s.tab,
        settings: s.settings,
        hiddenEquipments: s.hiddenEquipments,
        exerciseAliases: s.exerciseAliases,
        exerciseGifs: s.exerciseGifs,
        globalMachines: s.globalMachines,
        globalGrips: s.globalGrips,
        exerciseVariants: s.exerciseVariants,
      }),
      version: 1,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any) => {
        return persistedState as WorkoutState;
      },
    },
  ),
);




