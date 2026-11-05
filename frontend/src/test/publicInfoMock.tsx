import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { PublicInfo } from '../lib/publicInfo';

export const PUBLIC_INFO: PublicInfo = {
  annualMonths: 10,
  contactEmail: 'hola@ascension.test',
  plans: [
    { id: 'FREE', maxClients: 1, aiDailyLimit: 5, monthlyPriceEur: 0, annualPriceEur: 0 },
    { id: 'STARTER', maxClients: 10, aiDailyLimit: 20, monthlyPriceEur: 19, annualPriceEur: 190 },
    { id: 'PRO', maxClients: 25, aiDailyLimit: 50, monthlyPriceEur: 39, annualPriceEur: 390 },
    { id: 'ELITE', maxClients: 50, aiDailyLimit: 100, monthlyPriceEur: 69, annualPriceEur: 690 },
  ],
};

/** Stubs fetch for /api/public/info (null = the request fails) and returns a fresh query wrapper. */
export function mockPublicInfo(info: PublicInfo | null = PUBLIC_INFO) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (!String(url).endsWith('/api/public/info') || !info) {
        return new Response('{}', { status: 503 });
      }
      return new Response(JSON.stringify(info), { status: 200 });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
