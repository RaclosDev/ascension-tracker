import { useQuery } from '@tanstack/react-query';
import type { PlanOffer } from './coach/plan';

/** Mirrors CoachSubscriptionDtos.PublicInfo: readable without signing in. */
export interface PublicInfo {
  plans: PlanOffer[];
  annualMonths: number;
  contactEmail: string | null;
}

// Plain fetch: the axios client retries 401s with a token refresh, pointless when signed out.
async function fetchPublicInfo(): Promise<PublicInfo> {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${baseUrl}/api/public/info`);
  if (!res.ok) throw new Error(`public info: ${res.status}`);
  return (await res.json()) as PublicInfo;
}

export const usePublicInfo = () =>
  useQuery({
    queryKey: ['public-info'],
    queryFn: fetchPublicInfo,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
