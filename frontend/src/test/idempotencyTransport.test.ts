import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { webcrypto } from 'node:crypto';
import api, { setMemoryToken } from '../api/client';
import { clearIdempotencyIntents } from '../api/idempotency';
import { clearSessionLogoutPending } from '../auth/sessionBoundary';

const adapter = api.defaults.adapter;
beforeEach(() => {
  clearSessionLogoutPending();
  clearIdempotencyIntents();
  vi.stubGlobal('crypto', webcrypto);
  setMemoryToken(
    `${btoa('{}')}.${btoa(JSON.stringify({ sub: 'alice', exp: Date.now() / 1000 + 3600 }))}.signature`,
  );
});
afterEach(() => {
  api.defaults.adapter = adapter;
  setMemoryToken(null);
  vi.unstubAllGlobals();
});

it('reuses the request key when a committed write loses its HTTP response', async () => {
  const receipts = new Map<string, { id: string }>();
  let calls = 0;
  api.defaults.adapter = async (config) => {
    const key = config.headers.get('Idempotency-Key');
    expect(key).toBeTypeOf('string');
    if (typeof key !== 'string') throw new Error('Missing idempotency key');
    let result = receipts.get(key);
    if (!result) {
      result = { id: `saved-${receipts.size + 1}` };
      receipts.set(key, result);
    }
    if (++calls === 1) throw new AxiosError('Response lost after commit', 'ERR_NETWORK', config);
    return { config, data: result, status: 201, statusText: 'Created', headers: {} };
  };
  const payload = { name: 'Entrenamiento guardado' };
  await expect(api.post('/workouts', payload)).rejects.toMatchObject({ code: 'ERR_NETWORK' });
  expect((await api.post('/workouts', payload)).data).toEqual({ id: 'saved-1' });
  expect(receipts.size).toBe(1);
  expect((await api.post('/workouts', payload)).data).toEqual({ id: 'saved-2' });
  expect(receipts.size).toBe(2);
});
