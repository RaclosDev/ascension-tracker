import { clearSessionLogoutPending } from '../auth/sessionBoundary';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import api, {
  memoryToken,
  refreshAccessToken,
  setMemoryToken,
  logoutSession,
  authBroadcast,
} from '../api/client';
import * as idempotency from '../api/idempotency';
import { setWorkoutAccountIdentity } from '../lib/workout/accountIdentity';

const adapter = api.defaults.adapter;
const jwt = (id: string, jti = 'initial') =>
  `${btoa('{}')}.${btoa(JSON.stringify({ sub: id, jti, exp: Date.now() / 1000 + 3600 }))}.signature`;
const response = (config: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({
  config,
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
});

beforeEach(() => {
  clearSessionLogoutPending();
  setMemoryToken(jwt('test-session'));
  setMemoryToken(null);
  delete api.defaults.headers.common.Authorization;
});
afterEach(() => {
  api.defaults.adapter = adapter;
  vi.restoreAllMocks();
});

it('cancels a mutation when the account changes while its intent hash is pending', async () => {
  setMemoryToken(jwt('account-a'));
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prepare = vi.spyOn(idempotency, 'prepareIdempotency').mockReturnValue(pending);
  const dispatch = vi.fn(async (config: InternalAxiosRequestConfig) => response(config, {}));
  api.defaults.adapter = dispatch;
  const request = api.post('/workouts', { name: 'A workout' });
  const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  await vi.waitFor(() => expect(prepare).toHaveBeenCalled());
  setMemoryToken(jwt('account-b'));
  release?.();
  await rejected;
  expect(dispatch).not.toHaveBeenCalled();
});

it('cancels an offline mutation when account activation changes before dispatch', async () => {
  setWorkoutAccountIdentity('account-a');
  setMemoryToken('offline-session');
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prepare = vi.spyOn(idempotency, 'prepareIdempotency').mockReturnValue(pending);
  const dispatch = vi.fn(async (config: InternalAxiosRequestConfig) => response(config, {}));
  api.defaults.adapter = dispatch;
  const request = api.post('/workouts', { name: 'Offline workout' });
  const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  await vi.waitFor(() => expect(prepare).toHaveBeenCalled());
  setWorkoutAccountIdentity('account-b');
  setMemoryToken(jwt('account-b'));
  release?.();
  await rejected;
  expect(dispatch).not.toHaveBeenCalled();
});

it('reconnects an offline session by rotating its refresh cookie', async () => {
  setMemoryToken('offline-session');
  const fresh = jwt('fresh');
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: fresh } });
  expect(await refreshAccessToken()).toBe(fresh);
  expect(post).toHaveBeenCalledTimes(1);
});

it('shares one refresh between startup and concurrent 401 recovery', async () => {
  const fresh = jwt('fresh');
  let release: (() => void) | undefined;
  let refreshCalls = 0;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh') {
      refreshCalls++;
      await pending;
      return response(config, { token: fresh });
    }
    if (config.headers.Authorization !== `Bearer ${fresh}`) {
      throw new AxiosError('unauthorized', '401', config, undefined, {
        ...response(config, {}),
        status: 401,
      });
    }
    return response(config, { ok: true });
  };
  const startup = refreshAccessToken();
  const load = api.get('/settings');
  await vi.waitFor(() => expect(refreshCalls).toBeGreaterThan(0));
  await new Promise((resolve) => setTimeout(resolve, 20));
  release?.();
  await Promise.all([startup, load]);
  expect(refreshCalls).toBe(1);
});

it('does not overwrite a newer login with an older refresh response', async () => {
  let resolveRefresh: ((response: { data: { token: string } }) => void) | undefined;
  vi.spyOn(api, 'post').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
  );
  const refresh = refreshAccessToken();
  await vi.waitFor(() => expect(resolveRefresh).toBeDefined());
  const newLogin = jwt('new-account');
  setMemoryToken(newLogin);
  resolveRefresh?.({ data: { token: jwt('old-account') } });
  await refresh;
  expect(memoryToken).toBe(newLogin);
});

it('rotates a rejected access token even before its claimed expiration', async () => {
  const stale = jwt('account', 'rejected');
  const fresh = jwt('account', 'fresh');
  setMemoryToken(stale);
  let rotations = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh') {
      rotations++;
      return response(config, { token: fresh });
    }
    if (config.headers.Authorization !== `Bearer ${fresh}`) {
      throw new AxiosError('unauthorized', '401', config, undefined, {
        ...response(config, {}),
        status: 401,
      });
    }
    return response(config, { ok: true });
  };
  expect((await api.get('/settings')).data).toEqual({ ok: true });
  expect(rotations).toBe(1);
});

it('finishes refresh before revoking its cookie and does not restore the token during logout', async () => {
  let complete: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const calls: string[] = [];
  api.defaults.adapter = async (config) => {
    calls.push(config.url ?? '');
    if (config.url === '/auth/refresh') await pending;
    return response(config, { token: jwt('old-account') });
  };
  const refresh = refreshAccessToken();
  await vi.waitFor(() => expect(calls).toEqual(['/auth/refresh']));
  const logout = logoutSession();
  expect(calls).toEqual(['/auth/refresh']);
  complete?.();
  await Promise.all([refresh, logout]);
  expect(calls).toEqual(['/auth/refresh', '/auth/logout']);
  expect(memoryToken).toBeNull();
});

it('does not replay an aborted data request after shared refresh succeeds', async () => {
  const controller = new AbortController();
  let complete: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    complete = resolve;
  });
  let requests = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/refresh') {
      await pending;
      return response(config, { token: jwt('fresh') });
    }
    requests++;
    throw new AxiosError('unauthorized', '401', config, undefined, {
      ...response(config, {}),
      status: 401,
    });
  };
  const request = api.get('/settings', { signal: controller.signal });
  const rejected = expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  await vi.waitFor(() => expect(requests).toBe(1));
  controller.abort();
  complete?.();
  await rejected;
  expect(requests).toBe(1);
});

it('does not replay an old mutation under a different signed-in account', async () => {
  setMemoryToken(jwt('account-a'));
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests++;
    if (requests === 1) {
      await pending;
      throw new AxiosError('unauthorized', '401', config, undefined, {
        ...response(config, {}),
        status: 401,
      });
    }
    return response(config, {});
  };
  const request = api.post('/workouts', { name: 'Account A workout' });
  const rejected = expect(request).rejects.toMatchObject({ response: { status: 401 } });
  await vi.waitFor(() => expect(requests).toBe(1));
  setMemoryToken(jwt('account-b'));
  release?.();
  await rejected;
  expect(requests).toBe(1);
});

it('does not start refresh for a late 401 after logout begins', async () => {
  setMemoryToken(jwt('account-a'));
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const calls: string[] = [];
  api.defaults.adapter = async (config) => {
    calls.push(config.url ?? '');
    if (config.url === '/settings') {
      await pending;
      throw new AxiosError('unauthorized', '401', config, undefined, {
        ...response(config, {}),
        status: 401,
      });
    }
    return response(config, { token: jwt('account-a') });
  };
  const request = api.get('/settings');
  const rejected = expect(request).rejects.toMatchObject({ response: { status: 401 } });
  await vi.waitFor(() => expect(calls).toContain('/settings'));
  await logoutSession();
  release?.();
  await rejected;
  expect(calls).not.toContain('/auth/refresh');
  expect(memoryToken).toBeNull();
});

it('ignores a late token broadcast after logout', async () => {
  setMemoryToken(jwt('account-a'));
  api.defaults.adapter = async (config) => response(config, {});
  await logoutSession();
  const event = new MessageEvent('message', {
    data: { type: 'TOKEN_REFRESHED', token: jwt('account-a') },
  });
  authBroadcast?.onmessage?.call(authBroadcast, event);
  expect(memoryToken).toBeNull();
});

it('does not restore a logged-out session on reconnect even if server logout failed', async () => {
  setMemoryToken(jwt('account-a'));
  api.defaults.adapter = async (config) => {
    if (config.url === '/auth/logout') throw new AxiosError('offline', 'ERR_NETWORK', config);
    return response(config, { token: jwt('account-a') });
  };
  await expect(logoutSession()).rejects.toMatchObject({ code: 'ERR_NETWORK' });
  expect(await refreshAccessToken()).toBeNull();
  expect(memoryToken).toBeNull();
});
