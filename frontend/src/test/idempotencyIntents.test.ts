import { beforeEach, expect, it, vi } from 'vitest';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { webcrypto } from 'node:crypto';

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  vi.stubGlobal('crypto', webcrypto);
});
const request = (): InternalAxiosRequestConfig => ({
  method: 'post',
  url: '/nutrition/logs',
  data: { quantity: 100 },
  headers: new AxiosHeaders(),
});

it('discards uncertain intents when the user explicitly logs out', async () => {
  const client = await import('../api/idempotency');
  const first = request();
  await client.prepareIdempotency(first, 'alice');
  client.settleIdempotency(first);
  client.clearIdempotencyIntents();
  const next = request();
  await client.prepareIdempotency(next, 'alice');
  expect(next.headers.get('Idempotency-Key')).not.toBe(first.headers.get('Idempotency-Key'));
});

it('reuses uncertain intent after failure and reload, but not after confirmed success', async () => {
  let client = await import('../api/idempotency');
  const first = request();
  await client.prepareIdempotency(first, 'alice');
  const key = first.headers.get('Idempotency-Key');
  client.settleIdempotency(first);
  vi.resetModules();
  client = await import('../api/idempotency');
  const retry = request();
  await client.prepareIdempotency(retry, 'alice');
  expect(retry.headers.get('Idempotency-Key')).toBe(key);
  client.settleIdempotency(retry, 201);
  const next = request();
  await client.prepareIdempotency(next, 'alice');
  expect(next.headers.get('Idempotency-Key')).not.toBe(key);
});
it('keeps concurrent identical intents and different accounts separate', async () => {
  const client = await import('../api/idempotency');
  const first = request(),
    second = request(),
    other = request();
  await Promise.all([
    client.prepareIdempotency(first, 'alice'),
    client.prepareIdempotency(second, 'alice'),
  ]);
  expect(first.headers.get('Idempotency-Key')).not.toBe(second.headers.get('Idempotency-Key'));
  client.settleIdempotency(first);
  await client.prepareIdempotency(other, 'bob');
  expect(other.headers.get('Idempotency-Key')).not.toBe(first.headers.get('Idempotency-Key'));
});

it('replays an uncertain exercise merge under the original intent', async () => {
  const client = await import('../api/idempotency');
  const first = { ...request(), url: '/workouts/exercises/custom-source/merge' };
  await client.prepareIdempotency(first, 'alice');
  client.settleIdempotency(first);
  const retry = { ...request(), url: first.url };
  await client.prepareIdempotency(retry, 'alice');
  expect(retry.headers.get('Idempotency-Key')).toBe(first.headers.get('Idempotency-Key'));
  expect(retry.headers.get('Idempotency-Key')).toBeTypeOf('string');
});
