import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { CoachSetup } from './setup';
import type { ReviewSchedule } from './coachSchedule';

export interface ProfessionalSettings {
  displayName: string;
  presentation: string;
  showAccountPhoto: boolean;
  services: CoachSetup['services'];
  prefill: boolean;
  review: ReviewSchedule;
  version: number;
}

export function isProfessionalSettings(value: unknown): value is ProfessionalSettings {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ProfessionalSettings>;
  return (
    typeof v.displayName === 'string' &&
    v.displayName.length <= 80 &&
    typeof v.presentation === 'string' &&
    v.presentation.length <= 500 &&
    typeof v.showAccountPhoto === 'boolean' &&
    typeof v.prefill === 'boolean' &&
    typeof v.version === 'number' &&
    Number.isInteger(v.version) &&
    v.version >= 0 &&
    !!v.services &&
    ['training', 'nutrition', 'progress'].every(
      (key) => typeof v.services?.[key as keyof CoachSetup['services']] === 'boolean',
    ) &&
    !!v.review &&
    Number.isInteger(v.review.day) &&
    v.review.day >= 1 &&
    v.review.day <= 7 &&
    typeof v.review.time === 'string' &&
    /^\d{2}:\d{2}(:00)?$/.test(v.review.time) &&
    typeof v.review.timeZone === 'string' &&
    v.review.timeZone.length <= 80 &&
    v.review.paused === false
  );
}

const key = ['coach', 'professional-settings'] as const;
export function useProfessionalSettings() {
  return useQuery({
    queryKey: key,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<unknown>('/coach/settings');
      if (!isProfessionalSettings(data)) throw new Error('No se pudieron cargar los ajustes');
      return data;
    },
  });
}

export function useSaveProfessionalSettings() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (settings: ProfessionalSettings) =>
      (await api.put<ProfessionalSettings>('/coach/settings', settings)).data,
    onSuccess: (saved) => cache.setQueryData(key, saved),
  });
}
