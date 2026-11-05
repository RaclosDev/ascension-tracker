import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Exercise } from '../workout/types';

export interface CoachPermissions {
  training: boolean;
  nutrition: boolean;
  body: boolean;
  /** Lets the coach assign programs. Only meaningful together with {@link training}. */
  editTraining: boolean;
}

export interface CoachPerson {
  name: string | null;
  email: string;
  picture: string | null;
}

export interface CoachClient {
  linkId: string;
  client: CoachPerson;
  permissions: CoachPermissions;
  since: string;
}

export interface MyCoach {
  linkId: string;
  coach: CoachPerson;
  permissions: CoachPermissions;
  since: string;
}

export interface PendingInvitation {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreatedInvitation extends PendingInvitation {
  token: string;
}

export interface InvitationPreview {
  coach: CoachPerson;
  expiresAt: string;
  alreadyLinked: boolean;
}

export interface AccessLogEntry {
  coach: CoachPerson;
  action: string;
  date: string;
  lastAt: string;
  hits: number;
}

export interface CoachTargets {
  kcal: number | null;
  macroStrategy: string | null;
  customProteinGrams: number | null;
  customFatGrams: number | null;
  customCarbsGrams: number | null;
}

export const PERMISSION_LABELS: Record<keyof CoachPermissions, { title: string; detail: string }> =
  {
    body: { title: 'Cuerpo', detail: 'Peso y pasos.' },
    training: { title: 'Entrenamiento', detail: 'Entrenamientos registrados y estadísticas.' },
    editTraining: {
      title: 'Pautar entrenamiento',
      detail: 'Asignarte programas de entrenamiento. Nunca cambia lo que registras.',
    },
    nutrition: {
      title: 'Nutrición',
      detail: 'Comidas registradas y objetivos de calorías y macros.',
    },
  };

const ACTION_LABELS: Record<string, string> = {
  VIEW_WEIGHT: 'Peso',
  VIEW_STEPS: 'Pasos',
  VIEW_WORKOUTS: 'Entrenamientos',
  VIEW_NUTRITION: 'Comidas',
  VIEW_TARGETS: 'Objetivos de nutrición',
  VIEW_PROGRAMS: 'Programas asignados',
  COMMENT_WORKOUT: 'Comentar entrenamiento',
  ASSIGN_PROGRAM: 'Asignar programa',
};

export const accessActionLabel = (action: string) => ACTION_LABELS[action] ?? action;

const dateFmt = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
export const formatCoachDate = (iso: string) => dateFmt.format(new Date(iso));

export const sharedScopes = (permissions: CoachPermissions) =>
  (Object.keys(PERMISSION_LABELS) as (keyof CoachPermissions)[])
    .filter((scope) => permissions[scope])
    .map((scope) => PERMISSION_LABELS[scope].title)
    .join(' · ');

/** Pautar needs seeing training: dropping training drops the edit permission too. */
export const withScope = (
  permissions: CoachPermissions,
  scope: keyof CoachPermissions,
  checked: boolean,
): CoachPermissions => {
  const next = { ...permissions, [scope]: checked };
  if (!next.training) next.editTraining = false;
  return next;
};

export const scopeDisabled = (permissions: CoachPermissions, scope: keyof CoachPermissions) =>
  scope === 'editTraining' && !permissions.training;

export const personName = (person: CoachPerson) => person.name?.trim() || person.email;

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { error?: string; message?: string } } })?.response
    ?.data;
  return data?.error || data?.message || fallback;
}

/** Link the coach sends to a client. The token travels in the path, never in a query string. */
export const invitationUrl = (token: string) =>
  new URL(`/invitacion/${encodeURIComponent(token)}`, window.location.origin).href;

const keys = {
  profile: ['coach', 'profile'] as const,
  invitations: ['coach', 'invitations'] as const,
  clients: ['coach', 'clients'] as const,
  client: (linkId: string, area: string) => ['coach', 'client', linkId, area] as const,
  myCoaches: ['coaching', 'coaches'] as const,
  accessLog: ['coaching', 'access-log'] as const,
};

// ---- Coach side ----

export const useCoachProfile = () =>
  useQuery({
    queryKey: keys.profile,
    queryFn: async () => (await api.get<{ coach: boolean }>('/coach/profile')).data,
  });

export function useActivateCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<{ coach: boolean }>('/coach/profile')).data,
    onSuccess: (data) => queryClient.setQueryData(keys.profile, data),
  });
}

export const useCoachInvitations = (enabled: boolean) =>
  useQuery({
    queryKey: keys.invitations,
    enabled,
    queryFn: async () => (await api.get<PendingInvitation[]>('/coach/invitations')).data,
  });

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<CreatedInvitation>('/coach/invitations')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.invitations }),
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/coach/invitations/${encodeURIComponent(id)}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.invitations }),
  });
}

export const useCoachClients = (enabled: boolean) =>
  useQuery({
    queryKey: keys.clients,
    enabled,
    queryFn: async () => (await api.get<CoachClient[]>('/coach/clients')).data,
  });

export function useEndClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await api.post(`/coach/clients/${encodeURIComponent(linkId)}/end`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.clients }),
  });
}

/** One read-only area of a client's data, fetched only when the client shared it. */
export function useClientData<T>(linkId: string, path: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.client(linkId, path),
    enabled,
    retry: false,
    queryFn: async () =>
      (await api.get<T>(`/coach/clients/${encodeURIComponent(linkId)}/${path}`)).data,
  });
}

/** The client's own exercises, so their names show instead of a generic label. */
export const useClientCustomExercises = (linkId: string) =>
  useQuery({
    queryKey: keys.client(linkId, 'workouts/custom-exercises'),
    retry: false,
    queryFn: async () =>
      (
        await api.get<Exercise[]>(
          `/coach/clients/${encodeURIComponent(linkId)}/workouts/custom-exercises`,
        )
      ).data.map((ex) => ({ ...ex, custom: true })),
  });

// ---- Client side ----

export const useInvitationPreview = (token: string) =>
  useQuery({
    queryKey: ['coaching', 'invitation', token],
    retry: false,
    queryFn: async () =>
      (await api.get<InvitationPreview>(`/coaching/invitations/${encodeURIComponent(token)}`)).data,
  });

export function useAcceptInvitation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (permissions: CoachPermissions) =>
      (
        await api.post<MyCoach>(
          `/coaching/invitations/${encodeURIComponent(token)}/accept`,
          permissions,
        )
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.myCoaches }),
  });
}

export const useMyCoaches = () =>
  useQuery({
    queryKey: keys.myCoaches,
    queryFn: async () => (await api.get<MyCoach[]>('/coaching/coaches')).data,
  });

export function useUpdateCoachPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      linkId,
      permissions,
    }: {
      linkId: string;
      permissions: CoachPermissions;
    }) => {
      await api.patch(`/coaching/coaches/${encodeURIComponent(linkId)}`, permissions);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.myCoaches }),
  });
}

export function useEndCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await api.post(`/coaching/coaches/${encodeURIComponent(linkId)}/end`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.myCoaches }),
  });
}

export const useCoachAccessLog = () =>
  useQuery({
    queryKey: keys.accessLog,
    queryFn: async () => (await api.get<AccessLogEntry[]>('/coaching/access-log')).data,
  });

// ---- Invitation links opened while signed out ----

const PENDING_INVITATION_KEY = 'ascension:pending-invitation';
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;

export function rememberPendingInvitation(token: string) {
  if (TOKEN_FORMAT.test(token)) sessionStorage.setItem(PENDING_INVITATION_KEY, token);
}

/** The invitation opened before signing in, if any. Pure, so it is safe to call while rendering. */
export function peekPendingInvitation(): string | null {
  const token = sessionStorage.getItem(PENDING_INVITATION_KEY);
  return token && TOKEN_FORMAT.test(token) ? token : null;
}

export function clearPendingInvitation() {
  sessionStorage.removeItem(PENDING_INVITATION_KEY);
}
