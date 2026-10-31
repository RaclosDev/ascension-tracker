import type { InternalAxiosRequestConfig } from 'axios';

const PATHS = new Set([
  '/workouts',
  '/workouts/templates',
  '/nutrition/logs',
  '/nutrition/ai/assistant-apply',
  '/user/restore',
  '/nutrition/meals',
  '/nutrition/recipes',
  '/nutrition/my-foods',
]);
const STORAGE = 'ascension_idempotency_v1';
const TTL = 24 * 60 * 60 * 1000;
type Intent = { signature: string; key: string; created: number };
const active = new Set<string>();
let intents: Intent[] = [];
try {
  const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE) || '[]');
  if (Array.isArray(stored))
    intents = stored.filter(
      (item: unknown): item is Intent =>
        typeof item === 'object' &&
        item !== null &&
        'signature' in item &&
        typeof item.signature === 'string' &&
        'key' in item &&
        typeof item.key === 'string' &&
        'created' in item &&
        typeof item.created === 'number' &&
        Number.isFinite(item.created) &&
        Date.now() - item.created < TTL,
    );
} catch {
  /* Memory still protects retries while storage is unavailable. */
}
const persist = () => {
  intents = intents.filter((item) => Date.now() - item.created < TTL);
  try {
    sessionStorage.setItem(STORAGE, JSON.stringify(intents));
  } catch {
    /* Keep in-memory intents. */
  }
};

export function clearIdempotencyIntents() {
  active.clear();
  intents = [];
  try {
    sessionStorage.removeItem(STORAGE);
  } catch {
    /* In-memory state is already cleared. */
  }
}

export async function prepareIdempotency(
  config: InternalAxiosRequestConfig,
  account: string | null,
) {
  const path = (config.url || '').split('?')[0];
  const supported = PATHS.has(path) || /^\/workouts\/exercises\/[^/]+\/merge$/.test(path);
  if (!account || config.method?.toUpperCase() !== 'POST' || !supported) return;
  const existing = config.headers.get('Idempotency-Key');
  if (typeof existing === 'string') {
    active.add(existing);
    return;
  }
  const payload = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? {});
  const bytes = new TextEncoder().encode(JSON.stringify([account, config.url, payload]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const signature = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  // Concurrent identical submissions are separate intents. Only uncertain, inactive attempts are retried.
  let intent = intents.find(
    (item) =>
      item.signature === signature && !active.has(item.key) && Date.now() - item.created < TTL,
  );
  if (!intent) {
    intent = { signature, key: crypto.randomUUID(), created: Date.now() };
    intents.push(intent);
  }
  active.add(intent.key);
  config.headers.set('Idempotency-Key', intent.key);
  persist();
}

export function settleIdempotency(config: InternalAxiosRequestConfig | undefined, status?: number) {
  const key = config?.headers.get('Idempotency-Key');
  if (typeof key !== 'string') return;
  active.delete(key);
  // A transport/5xx error may follow a committed write; keep its key for the next attempt.
  if (status !== undefined && status < 500 && status !== 408 && status !== 429 && status !== 401) {
    intents = intents.filter((item) => item.key !== key);
    persist();
  }
}
