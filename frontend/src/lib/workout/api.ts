import { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { CompletedWorkout, Template, Exercise } from './types';
import { useWorkoutStore } from './store';
import { getWorkoutAccountRevision } from './accountIdentity';
import toast from 'react-hot-toast';

export const useWorkoutHistory = () => {
  return useInfiniteQuery({
    queryKey: ['workoutHistory'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0, signal }) => {
      const { data } = await api.get(`/workouts?page=${pageParam}&size=10`, { signal });
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.number + 1 < lastPage.totalPages) {
        return lastPage.number + 1;
      }
      return undefined;
    },
  });
};

export const useRecentWorkouts = (days: number = 60) => {
  const q = useQuery<CompletedWorkout[], Error>({
    queryKey: ['recentWorkouts'],
    queryFn: async ({ signal }): Promise<CompletedWorkout[]> => {
      const since = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const { data } = await api.get<CompletedWorkout[]>(`/workouts/recent?since=${since}`, {
        signal,
      });
      return data;
    },
  });

  const data = useMemo(() => {
    if (!q.data) return undefined;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return q.data.filter((w: CompletedWorkout) => (w.startedAt ?? 0) >= since);
  }, [q.data, days]);

  return { ...q, data };
};

export const useSaveWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: CompletedWorkout) => {
      // If it's an existing workout with a valid id, use PUT
      if (workout.id && !workout.id.startsWith('temp') && workout.id.trim() !== '') {
        const { data } = await api.put(`/workouts/${workout.id}`, workout);
        return data;
      }
      const { data } = await api.post('/workouts', workout);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Entrenamiento guardado');
    },
    onError: () => {
      toast.error('Error al guardar entrenamiento');
    },
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workoutStats'] });
      toast.success('Entrenamiento eliminado');
    },
  });
};

export const useWorkoutTemplates = () => {
  return useQuery<Template[], Error>({
    queryKey: ['workoutTemplates'],
    queryFn: async ({ signal }): Promise<Template[]> => {
      const { data } = await api.get('/workouts/templates', { signal });
      return data.map(
        (dto: {
          id: string;
          name: string;
          exercises?: { exerciseId: string; variant?: { grip?: string; machine?: string } }[];
          exerciseIds?: string[];
        }) => ({
          ...dto,
          exercises:
            dto.exercises ||
            (dto.exerciseIds ? dto.exerciseIds.map((id: string) => ({ exerciseId: id })) : []),
        }),
      );
    },
  });
};

export const useSaveTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: Template) => {
      const { data } = await api.post('/workouts/templates', template);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
      toast.success('Plantilla guardada');
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workouts/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
      toast.success('Plantilla eliminada');
    },
  });
};

export const useCustomExercises = () => {
  return useQuery<Exercise[], Error>({
    queryKey: ['customExercises'],
    queryFn: async ({ signal }): Promise<Exercise[]> => {
      const { data } = await api.get('/workouts/custom-exercises', { signal });
      return data.map((ex: Exercise) => ({ ...ex, custom: true }));
    },
  });
};

export const useSaveCustomExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: Exercise) => {
      const { data } = await api.post('/workouts/custom-exercises', exercise);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customExercises'] });
      toast.success('Ejercicio guardado');
    },
  });
};

export const useUpdateCustomExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exercise: Exercise) => {
      const { data } = await api.put(`/workouts/custom-exercises/${exercise.id}`, exercise);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customExercises'] });
      toast.success('Ejercicio actualizado');
    },
  });
};

export const useDeleteCustomExercise = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workouts/custom-exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customExercises'] });
      toast.success('Ejercicio eliminado');
    },
  });
};

export interface WorkoutPreferences {
  globalMachines: string[];
  globalGrips: string[];
  exerciseAliases: Record<string, string>;
  exerciseVariants: Record<string, { grips?: string[]; machines?: string[] }>;
  hiddenEquipments: string[];
  exerciseGifs: Record<string, string>;
  restTimers?: Record<string, number>;
  restPreset?: number;
}

export const useWorkoutPreferences = () => {
  return useQuery<WorkoutPreferences, Error>({
    queryKey: ['workoutPreferences'],
    queryFn: async ({ signal }): Promise<WorkoutPreferences> => {
      const { data } = await api.get('/workout-preferences', { signal });
      return {
        globalMachines: data.globalMachines || [],
        globalGrips: data.globalGrips || [],
        exerciseAliases: data.exerciseAliases || {},
        exerciseVariants: data.exerciseVariants || {},
        hiddenEquipments: data.hiddenEquipments || [],
        exerciseGifs: data.exerciseGifs || {},
        restTimers: data.restTimers || {},
        restPreset: data.restPreset ?? 90,
      };
    },
  });
};

type PreferencesUpdate = WorkoutPreferences | ((current: WorkoutPreferences) => WorkoutPreferences);

export const useUpdateWorkoutPreferences = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    scope: { id: 'workout-preferences' },
    mutationFn: async ({ update, revision }: { update: PreferencesUpdate; revision: number }) => {
      if (revision !== getWorkoutAccountRevision()) throw new Error('La cuenta ha cambiado');
      await queryClient.cancelQueries({ queryKey: ['workoutPreferences'] });
      const current = queryClient.getQueryData<WorkoutPreferences>(['workoutPreferences']);
      if (typeof update === 'function' && !current)
        throw new Error('Las preferencias aún no están disponibles');
      const prefs = typeof update === 'function' ? update(current!) : update;
      const { data } = await api.put<WorkoutPreferences>('/workout-preferences', prefs);
      if (revision === getWorkoutAccountRevision())
        queryClient.setQueryData(['workoutPreferences'], data);
      return data;
    },
    onError: () => toast.error('No se han podido guardar las preferencias'),
  });
  return {
    ...mutation,
    mutate: (update: PreferencesUpdate) =>
      mutation.mutate({ update, revision: getWorkoutAccountRevision() }),
    mutateAsync: (update: PreferencesUpdate) =>
      mutation.mutateAsync({ update, revision: getWorkoutAccountRevision() }),
  };
};

export const useWorkoutPreferencesActions = () => {
  const { data: prefs } = useWorkoutPreferences();
  const { mutate: updatePrefs } = useUpdateWorkoutPreferences();
  const syncFromPreferences = useWorkoutStore((s) => s.syncFromPreferences);

  useEffect(() => {
    if (prefs) {
      syncFromPreferences({
        restTimers: prefs.restTimers,
        restPreset: prefs.restPreset,
        hiddenEquipments: prefs.hiddenEquipments,
      });
    }
  }, [prefs, syncFromPreferences]);

  const addGlobalMachine = (name: string) => {
    if (!prefs) return;
    updatePrefs((current) => ({
      ...current,
      globalMachines: Array.from(new Set([...current.globalMachines, name])),
    }));
  };

  const addGlobalGrip = (name: string) => {
    if (!prefs) return;
    updatePrefs((current) => ({
      ...current,
      globalGrips: Array.from(new Set([...current.globalGrips, name])),
    }));
  };

  const addExerciseVariant = (id: string, type: string, name: string) => {
    if (!prefs) return;
    const key = (type + 's') as 'grips' | 'machines';
    updatePrefs((current) => {
      const ev = current.exerciseVariants[id] || {};
      const list = ev[key] || [];
      return {
        ...current,
        exerciseVariants: {
          ...current.exerciseVariants,
          [id]: { ...ev, [key]: Array.from(new Set([...list, name])) },
        },
      };
    });
  };

  // Atomic update: avoids double-PUT race conditions between global and exercise-specific variants
  const addGripOption = (exerciseId: string, name: string) => {
    if (!prefs) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    updatePrefs((current) => {
      const ev = current.exerciseVariants[exerciseId] || {};
      const list = ev.grips || [];
      return {
        ...current,
        globalGrips: Array.from(new Set([...current.globalGrips, trimmed])),
        exerciseVariants: {
          ...current.exerciseVariants,
          [exerciseId]: { ...ev, grips: Array.from(new Set([...list, trimmed])) },
        },
      };
    });
  };

  const addMachineOption = (exerciseId: string, name: string) => {
    if (!prefs) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    updatePrefs((current) => {
      const ev = current.exerciseVariants[exerciseId] || {};
      const list = ev.machines || [];
      return {
        ...current,
        globalMachines: Array.from(new Set([...current.globalMachines, trimmed])),
        exerciseVariants: {
          ...current.exerciseVariants,
          [exerciseId]: { ...ev, machines: Array.from(new Set([...list, trimmed])) },
        },
      };
    });
  };

  const setExerciseRestTimerPref = (exerciseId: string, seconds: number) => {
    if (!prefs) return;
    updatePrefs((current) => ({
      ...current,
      restTimers: {
        ...(current.restTimers || {}),
        [exerciseId]: seconds,
      },
    }));
  };

  const setRestPresetPref = (seconds: number) => {
    if (!prefs) return;
    updatePrefs((current) => ({
      ...current,
      restPreset: seconds,
    }));
  };

  const setExerciseAlias = (id: string, name: string) => {
    if (!prefs) return;
    updatePrefs((current) => ({
      ...current,
      exerciseAliases: { ...current.exerciseAliases, [id]: name },
    }));
  };

  const setExerciseGif = (id: string, gifUrl: string) => {
    if (!prefs) return;
    updatePrefs((current) => ({
      ...current,
      exerciseGifs: { ...current.exerciseGifs, [id]: gifUrl },
    }));
  };

  const toggleHiddenEquipment = (equip: string) => {
    if (!prefs) return;
    updatePrefs((current) => {
      const arr = current.hiddenEquipments || [];
      const newArr = arr.includes(equip) ? arr.filter((e) => e !== equip) : [...arr, equip];
      return { ...current, hiddenEquipments: newArr };
    });
  };

  return {
    prefs,
    addGlobalMachine,
    addGlobalGrip,
    addExerciseVariant,
    addGripOption,
    addMachineOption,
    setExerciseRestTimerPref,
    setRestPresetPref,
    setExerciseAlias,
    setExerciseGif,
    toggleHiddenEquipment,
  };
};

export const useImportWorkouts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { customExercises?: Exercise[]; workouts: CompletedWorkout[] }) => {
      const { data } = await api.post('/workouts/import', payload);
      return data;
    },
    onSuccess: (data: {
      importedWorkouts: number;
      createdExercises: number;
      totalSets: number;
    }) => {
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['customExercises'] });
      queryClient.invalidateQueries({ queryKey: ['workoutStats'] });
      toast.success(
        `Importados con éxito ${data.importedWorkouts} entrenamientos (${data.totalSets} series).`,
      );
    },
    onError: (err: unknown) => {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
        message?: string;
      };
      const msg =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Error al importar entrenamientos';
      toast.error(msg);
    },
  });
};
