const memory = new Map<string, { raw: string; persisted: boolean } | null>();
const PREFIX = 'ascension:draft:';

export function clearSessionDrafts() {
  memory.clear();
}

export function readDraft<T>(
  key: string,
  validate: (value: unknown) => value is T,
): { value: T; persisted: boolean } | null {
  const cached = memory.get(PREFIX + key);
  if (cached === null) return null;
  let raw = cached?.raw;
  try {
    raw ??= sessionStorage.getItem(PREFIX + key) ?? undefined;
  } catch {
    /* Memory remains available. */
  }
  if (!raw) return null;
  try {
    const stored: unknown = JSON.parse(raw);
    if (
      stored &&
      typeof stored === 'object' &&
      'savedAt' in stored &&
      'value' in stored &&
      typeof stored.savedAt === 'number' &&
      Date.now() - stored.savedAt < 7 * 86400000 &&
      validate(stored.value)
    )
      return { value: stored.value, persisted: cached?.persisted ?? true };
  } catch {
    /* Ignore incomplete or obsolete drafts. */
  }
  return null;
}

export function writeDraft(key: string, value: unknown): boolean {
  const raw = JSON.stringify({ savedAt: Date.now(), value });
  let persisted = false;
  try {
    sessionStorage.setItem(PREFIX + key, raw);
    persisted = true;
  } catch {
    /* Keep the draft in memory. */
  }
  memory.set(PREFIX + key, { raw, persisted });
  return persisted;
}

export function removeDraft(key: string) {
  memory.set(PREFIX + key, null);
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* Storage can be disabled. */
  }
}
