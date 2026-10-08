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




