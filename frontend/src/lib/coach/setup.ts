import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export interface CoachSetup {
  services: { training: boolean; nutrition: boolean; progress: boolean };
  goal: string | null;
  experience: string | null;
  trainingDays: number | null;
  equipment: string | null;
  reviewed: boolean;
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
