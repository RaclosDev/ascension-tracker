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
    }
  });
};

export const useRecentWorkouts = (days: number = 60) => {
  return useQuery({
    queryKey: ['recentWorkouts', days],
    queryFn: async (): Promise<CompletedWorkout[]> => {
      const since = Date.now() - (days * 24 * 60 * 60 * 1000);
      const { data } = await api.get(`/workouts/recent?since=${since}`);
      return data;
    }
  });
};

export const useSaveWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: CompletedWorkout) => {
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
    }
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
    }
  });
};

export const useWorkoutTemplates = () => {
  return useQuery({
    queryKey: ['workoutTemplates'],
    queryFn: async (): Promise<Template[]> => {
      const { data } = await api.get('/workouts/templates');
      return data;
    }
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
    }
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
    }
  });
};

export const useCustomExercises = () => {
  return useQuery({
    queryKey: ['customExercises'],
    queryFn: async (): Promise<Exercise[]> => {
      const { data } = await api.get('/workouts/custom-exercises');
      return data.map((ex: any) => ({ ...ex, custom: true }));
    }
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
    }
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
    }
  });
};
