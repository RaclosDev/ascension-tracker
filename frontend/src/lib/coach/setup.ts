import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export interface CoachSetup {
  goalFocus?: 'GENERAL' | 'PERFORMANCE' | 'MAINTAIN' | 'WEIGHT_CHANGE' | null;
  services: { training: boolean; nutrition: boolean; progress: boolean };
  goal: string | null;
  experience: string | null;
  trainingDays: number | null;
  equipment: string | null;
  reviewed: boolean;
  /** Set only when this athlete works with a different effort method than the coach's usual one. */
  effortMethod?: 'RIR' | 'RPE' | 'NONE' | null;
}

export interface AvoidedExercise {
  exerciseId: string;
  name: string | null;
  reason: string | null;
}

/** What the coach keeps to themselves about one athlete. The athlete never receives it. */
export interface CoachNotes {
  pinnedNote: string | null;
  avoidedExercises: AvoidedExercise[];
}

export const SERVICE_LABELS = {
  training: 'Entrenamiento',
  nutrition: 'Nutrición',
  progress: 'Seguimiento corporal',
};

export const emptySetup = (): CoachSetup => ({
  services: { training: true, nutrition: false, progress: false },
  goal: '',
  experience: '',
  trainingDays: null,
  equipment: '',
  reviewed: false,
});

export const serviceNames = (setup: CoachSetup) =>
  (Object.keys(SERVICE_LABELS) as (keyof typeof SERVICE_LABELS)[])
    .filter((key) => setup.services[key])
    .map((key) => SERVICE_LABELS[key])
    .join(' · ');

export function useSaveCoachSetup(linkId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (setup: CoachSetup) =>
      (await api.put<CoachSetup>(`/coach/clients/${encodeURIComponent(linkId)}/setup`, setup)).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ['coach', 'clients'] }),
  });
}

export function useSaveCoachNotes(linkId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (notes: CoachNotes) =>
      (await api.put<CoachNotes>(`/coach/clients/${encodeURIComponent(linkId)}/notes`, notes)).data,
    onSuccess: () => cache.invalidateQueries({ queryKey: ['coach', 'clients'] }),
  });
}
