import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { CompletedWorkout, Template, Exercise } from './types';
import toast from 'react-hot-toast';

export const useWorkoutHistory = () => {
  return useInfiniteQuery({
    queryKey: ['workoutHistory'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get(`/workouts?page=${pageParam}&size=10`);
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
    queryFn: async (): Promise<CompletedWorkout[]> => {
      const since = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const { data } = await api.get(`/workouts/recent?since=${since}`);
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
      // If it's an existing workout (not a temp uid), use PUT
      if (workout.id && !workout.id.includes('-') && workout.id.length > 20) {
        // Assume UUIDs are > 20 chars. Our local uids are short like 'cl...'.
        // Actually our uid() might generate something else. Let's just check if it's already an existing length.
        // Or better yet, we can check if it exists in the history!
        // But for safety, let's just try PUT if we explicitly passed editingId.
        // Wait, in useSaveWorkout we can just use PUT if id doesn't start with 'temp' or whatever uid() produces.
        // Actually, our uid() produces base36 strings `Date.now().toString(36) + Math.random().toString(36)`.
        // The backend UUIDs have hyphens and are 36 chars long!
        if (workout.id.includes('-')) {
          const { data } = await api.put(`/workouts/${workout.id}`, workout);
          return data;
        }
      }
      // New workout
      const { data } = await api.post('/workouts', workout);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
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
      toast.success('Entrenamiento eliminado');
    },
  });
};

export const useWorkoutTemplates = () => {
  return useQuery<Template[], Error>({
    queryKey: ['workoutTemplates'],
    queryFn: async (): Promise<Template[]> => {
      const { data } = await api.get('/workouts/templates');
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
    queryFn: async (): Promise<Exercise[]> => {
      const { data } = await api.get('/workouts/custom-exercises');
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
}

export const useWorkoutPreferences = () => {
  return useQuery<WorkoutPreferences, Error>({
    queryKey: ['workoutPreferences'],
    queryFn: async (): Promise<WorkoutPreferences> => {
      const { data } = await api.get('/workout-preferences');
      return {
        globalMachines: data.globalMachines || [],
        globalGrips: data.globalGrips || [],
        exerciseAliases: data.exerciseAliases || {},
        exerciseVariants: data.exerciseVariants || {},
        hiddenEquipments: data.hiddenEquipments || [],
        exerciseGifs: data.exerciseGifs || {},
      };
    },
  });
};

export const useUpdateWorkoutPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: WorkoutPreferences) => {
      const { data } = await api.put('/workout-preferences', prefs);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPreferences'] });
    },
  });
};

export const useWorkoutPreferencesActions = () => {
  const { data: prefs } = useWorkoutPreferences();
  const { mutate: updatePrefs } = useUpdateWorkoutPreferences();

  const addGlobalMachine = (name: string) => {
    if (!prefs) return;
    updatePrefs({ ...prefs, globalMachines: Array.from(new Set([...prefs.globalMachines, name])) });
  };

  const addGlobalGrip = (name: string) => {
    if (!prefs) return;
    updatePrefs({ ...prefs, globalGrips: Array.from(new Set([...prefs.globalGrips, name])) });
  };

  const addExerciseVariant = (id: string, type: string, name: string) => {
    if (!prefs) return;
    const ev = prefs.exerciseVariants[id] || {};
    const key = (type + 's') as 'grips' | 'machines';
    const list = ev[key] || [];
    updatePrefs({
      ...prefs,
      exerciseVariants: {
        ...prefs.exerciseVariants,
        [id]: { ...ev, [key]: Array.from(new Set([...list, name])) },
      },
    });
  };

  const setExerciseAlias = (id: string, name: string) => {
    if (!prefs) return;
    updatePrefs({
      ...prefs,
      exerciseAliases: { ...prefs.exerciseAliases, [id]: name },
    });
  };

  const setExerciseGif = (id: string, gifUrl: string) => {
    if (!prefs) return;
    updatePrefs({
      ...prefs,
      exerciseGifs: { ...prefs.exerciseGifs, [id]: gifUrl },
    });
  };

  const toggleHiddenEquipment = (equip: string) => {
    if (!prefs) return;
    const arr = prefs.hiddenEquipments || [];
    const newArr = arr.includes(equip) ? arr.filter((e) => e !== equip) : [...arr, equip];
    updatePrefs({ ...prefs, hiddenEquipments: newArr });
  };

  return {
    prefs,
    addGlobalMachine,
    addGlobalGrip,
    addExerciseVariant,
    setExerciseAlias,
    setExerciseGif,
    toggleHiddenEquipment,
  };
};
