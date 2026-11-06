import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

/** Mirrors the backend ConsentDtos records. */
export type ConsentKind = 'TERMS' | 'PRIVACY' | 'HEALTH_DATA' | 'AI_HEALTH' | 'COACH_TERMS';

export interface ConsentAnswer {
  granted: boolean;
  version: string;
  at: string;
}

export interface ConsentStatus {
  /** Current version of the legal texts on the server. */
  version: string;
  /** Latest answer per kind; kinds never answered are absent. */
  consents: Partial<Record<ConsentKind, ConsentAnswer>>;
}

export interface ConsentChange {
  kind: ConsentKind;
  granted: boolean;
}

const KEY = ['consents'] as const;

/**
 * The blocking screen shows while the terms or privacy policy of the current version are not
 * accepted, or the health and AI questions were never answered (a "no" is a valid answer).
 */
export function needsConsentScreen(status: ConsentStatus): boolean {
  const accepted = (kind: ConsentKind) => {
    const answer = status.consents[kind];
    return answer?.granted === true && answer.version === status.version;
  };
  return (
    !accepted('TERMS') ||
    !accepted('PRIVACY') ||
    !status.consents.HEALTH_DATA ||
    !status.consents.AI_HEALTH
  );
}

export function useConsents(enabled = true) {
  return useQuery<ConsentStatus>({
    queryKey: KEY,
    queryFn: async () => (await api.get<ConsentStatus>('/consents')).data,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveConsents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consents: ConsentChange[]) =>
      (await api.post<ConsentStatus>('/consents', { consents })).data,
    onSuccess: (status) => queryClient.setQueryData(KEY, status),
  });
}
