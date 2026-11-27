import type { QueryClient } from '@tanstack/react-query';

// Everything that shows food eaten, calories or the week's adherence. Prefix matching covers the
// per-date keys, e.g. ['nutrition', 'today-summary', date] or ['coaching', 'today', date].
const DIARY_KEYS: string[][] = [
  ['nutritionData'],
  ['nutrition'],
  ['coaching', 'today'],
  ['dashboard'],
  ['weekSummaries'],
  ['trackingWeeks'],
];

/** One place to refresh every view that depends on the food diary after logging, editing or deleting food. */
export function invalidateDiary(queryClient: QueryClient) {
  return Promise.all(DIARY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
