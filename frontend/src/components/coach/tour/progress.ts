export interface TourProgress {
  status: 'started' | 'dismissed' | 'completed';
  step: number;
}

const memory = new Map<string, TourProgress>();
const keyFor = (account: string) => `ascension:coach-tour:v1:${encodeURIComponent(account)}`;

export function readTourProgress(account: string): TourProgress | null {
  try {
    const raw = localStorage.getItem(keyFor(account));
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (
        typeof value === 'object' &&
        value !== null &&
        'status' in value &&
        'step' in value &&
        ['started', 'dismissed', 'completed'].includes(String(value.status)) &&
        typeof value.step === 'number' &&
        Number.isInteger(value.step) &&
        value.step >= 0
      ) {
        return value as TourProgress;
      }
    }
  } catch {
    /* Storage can be unavailable in private or restricted browsing. */
  }
  return memory.get(account) ?? null;
}

export function saveTourProgress(account: string, progress: TourProgress) {
  memory.set(account, progress);
  try {
    localStorage.setItem(keyFor(account), JSON.stringify(progress));
  } catch {
    /* Keep this session usable. */
  }
}
