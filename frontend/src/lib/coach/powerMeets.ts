import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { POWER_LIFTS, type PowerLift, type PowerProfile } from './powerlifting';

export interface PowerAttempt {
  lift: PowerLift;
  number: number;
  plannedKg: number | null;
  actualKg: number | null;
  result: 'PENDING' | 'VALID' | 'INVALID' | 'WITHDRAWN';
  recordAttempt: boolean;
}
export interface PowerBlock {
  id: string;
  name: string;
  start: string;
  end: string;
  goal: string;
}
export interface MeetContent {
  name: string;
  date: string;
  equipment: PowerProfile['equipment'];
  federation: string;
  category: string;
  rules: 'CUSTOM' | 'IPF_2026';
  targetTotal: number | null;
  notes: string;
  archived: boolean;
  blocks: PowerBlock[];
  attempts: PowerAttempt[];
}
export interface PowerMeet {
  id: string;
  linkId: string;
  content: MeetContent;
  version: number;
  updatedAt: string | null;
}
export function newPowerMeet(linkId: string, profile: PowerProfile): PowerMeet {
  return {
    id: '',
    linkId,
    version: 0,
    updatedAt: null,
    content: {
      name: '',
      date: '',
      equipment: profile.equipment,
      federation: profile.federation,
      category: '',
      rules: 'CUSTOM',
      targetTotal: null,
      notes: '',
      archived: false,
      blocks: [],
      attempts: POWER_LIFTS.flatMap((lift) =>
        [1, 2, 3].map((number) => ({
          lift,
          number,
          plannedKg: null,
          actualKg: null,
          result: 'PENDING',
          recordAttempt: false,
        })),
      ),
    },
  };
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
const nullableNumber = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v));
export function isPowerMeet(v: unknown): v is PowerMeet {
  if (
    !record(v) ||
    typeof v.id !== 'string' ||
    typeof v.linkId !== 'string' ||
    !Number.isInteger(v.version) ||
    !record(v.content)
  )
    return false;
  const c = v.content;
  return (
    ['name', 'date', 'federation', 'category', 'notes'].every((k) => typeof c[k] === 'string') &&
    ['CLASSIC', 'EQUIPPED', 'OTHER'].includes(String(c.equipment)) &&
    ['CUSTOM', 'IPF_2026'].includes(String(c.rules)) &&
    nullableNumber(c.targetTotal) &&
    typeof c.archived === 'boolean' &&
    Array.isArray(c.blocks) &&
    c.blocks.every(
      (b) =>
        record(b) && ['id', 'name', 'start', 'end', 'goal'].every((k) => typeof b[k] === 'string'),
    ) &&
    Array.isArray(c.attempts) &&
    c.attempts.length === 9 &&
    c.attempts.every(
      (a) =>
        record(a) &&
        POWER_LIFTS.some((l) => l === a.lift) &&
        [1, 2, 3].includes(Number(a.number)) &&
        nullableNumber(a.plannedKg) &&
        nullableNumber(a.actualKg) &&
        typeof a.recordAttempt === 'boolean' &&
        ['PENDING', 'VALID', 'INVALID', 'WITHDRAWN'].includes(String(a.result)),
    )
  );
}
export function meetTotals(attempts: PowerAttempt[]) {
  const best = (lift: PowerLift, actual: boolean) => {
    const weights = attempts
      .filter((a) => a.lift === lift && (!actual || a.result === 'VALID'))
      .map((a) => (actual ? a.actualKg : a.plannedKg))
      .filter((kg): kg is number => kg !== null && Number.isFinite(kg) && kg > 0);
    return weights.length ? Math.max(...weights) : null;
  };
  const total = (actual: boolean) => {
    const values = POWER_LIFTS.map((lift) => best(lift, actual));
    return values.every((n): n is number => n !== null)
      ? Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100
      : null;
  };
  return {
    planned: total(false),
    actual: total(true),
    finished: attempts.every((a) => a.result !== 'PENDING'),
    validLifts: POWER_LIFTS.filter((lift) => best(lift, true) !== null).length,
  };
}
export function attemptWarning(
  attempt: PowerAttempt,
  previous: PowerAttempt | undefined,
  rules: MeetContent['rules'],
) {
  if (rules !== 'IPF_2026') return null;
  const kg = attempt.actualKg ?? attempt.plannedKg;
  if (kg === null) return null;
  if (!attempt.recordAttempt && Math.abs(kg / 2.5 - Math.round(kg / 2.5)) > 0.00001)
    return 'Revisa el peso: el incremento ordinario IPF es de 2,5 kg. Las excepciones de récord tienen requisitos propios.';
  const previousKg = previous?.actualKg ?? previous?.plannedKg;
  if (
    previousKg != null &&
    previous?.result === 'VALID' &&
    kg < previousKg + (attempt.recordAttempt ? 0.5 : 2.5)
  )
    return 'Revisa la progresión tras el intento válido anterior y las condiciones de récord, si corresponde.';
  return null;
}
const key = (linkId: string) => ['coach', 'power-meets', linkId];
const path = (linkId: string) => `/coach/clients/${encodeURIComponent(linkId)}/powerlifting/meets`;
export const usePowerMeets = (linkId: string) =>
  useQuery({
    queryKey: key(linkId),
    retry: false,
    queryFn: async () => (await api.get<PowerMeet[]>(path(linkId))).data,
  });
export function useSavePowerMeet(linkId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (meet: PowerMeet) => {
      const request = { content: meet.content, expectedVersion: meet.version };
      return meet.id
        ? (await api.put<PowerMeet>(`${path(linkId)}/${encodeURIComponent(meet.id)}`, request)).data
        : (await api.post<PowerMeet>(path(linkId), request)).data;
    },
    onSuccess: (saved) =>
      cache.setQueryData<PowerMeet[]>(key(linkId), (current) =>
        [...(current ?? []).filter((m) => m.id !== saved.id), saved].sort((a, b) =>
          a.content.date.localeCompare(b.content.date),
        ),
      ),
  });
}
