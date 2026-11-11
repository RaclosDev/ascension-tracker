import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export const POWER_LIFTS = ['SQUAT', 'BENCH', 'DEADLIFT'] as const;
export type PowerLift = (typeof POWER_LIFTS)[number];
export const POWER_LABELS: Record<PowerLift, string> = {
  SQUAT: 'Sentadilla',
  BENCH: 'Press de banca',
  DEADLIFT: 'Peso muerto',
};
export const MAX_KEYS = { SQUAT: 'squat', BENCH: 'bench', DEADLIFT: 'deadlift' } as const;
export interface PowerMark {
  id: string;
  lift: PowerLift;
  kg: number;
  date: string;
  context: 'TRAINING' | 'COMPETITION';
  reference: string;
}
export interface PowerProfile {
  enabled: boolean;
  equipment: 'CLASSIC' | 'EQUIPPED' | 'OTHER';
  federation: string;
  trainingMax: Record<'squat' | 'bench' | 'deadlift', number | null>;
  marks: PowerMark[];
  notes: string;
}
export interface SavedPowerProfile {
  linkId: string;
  profile: PowerProfile;
  version: number;
  updatedAt: string | null;
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
export function isSavedPowerProfile(v: unknown): v is SavedPowerProfile {
  if (
    !record(v) ||
    typeof v.linkId !== 'string' ||
    !Number.isInteger(v.version) ||
    !record(v.profile)
  )
    return false;
  const p = v.profile;
  return (
    typeof p.enabled === 'boolean' &&
    ['CLASSIC', 'EQUIPPED', 'OTHER'].includes(String(p.equipment)) &&
    typeof p.federation === 'string' &&
    typeof p.notes === 'string' &&
    record(p.trainingMax) &&
    ['squat', 'bench', 'deadlift'].every((k) => {
      const n = (p.trainingMax as Record<string, unknown>)[k];
      return n === null || (typeof n === 'number' && Number.isFinite(n));
    }) &&
    Array.isArray(p.marks) &&
    p.marks.every(
      (m) =>
        record(m) &&
        typeof m.id === 'string' &&
        POWER_LIFTS.some((l) => l === m.lift) &&
        typeof m.kg === 'number' &&
        Number.isFinite(m.kg) &&
        typeof m.date === 'string' &&
        typeof m.reference === 'string' &&
        ['TRAINING', 'COMPETITION'].includes(String(m.context)),
    )
  );
}
const key = (linkId: string) => ['coach', 'powerlifting', linkId];
const path = (linkId: string) => `/coach/clients/${encodeURIComponent(linkId)}/powerlifting`;
export function usePowerProfile(linkId: string) {
  return useQuery({
    queryKey: key(linkId),
    retry: false,
    queryFn: async () => (await api.get<SavedPowerProfile>(path(linkId))).data,
  });
}
export function useSavePowerProfile(linkId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (value: SavedPowerProfile) =>
      (
        await api.put<SavedPowerProfile>(path(linkId), {
          profile: value.profile,
          expectedVersion: value.version,
        })
      ).data,
    onSuccess: (saved) => client.setQueryData(key(linkId), saved),
  });
}
