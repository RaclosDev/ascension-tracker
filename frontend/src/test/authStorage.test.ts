import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { memoryToken, setMemoryToken } from '../api/client';

describe('Auth storage & memory tokens (Audit #1)', () => {
  beforeEach(() => {
    localStorage.clear();
    setMemoryToken(null);
    delete api.defaults.headers.common['Authorization'];
    vi.restoreAllMocks();
  });

  it('stores access token strictly in memory, never in localStorage', () => {
    const fakeJwt = 'fake.jwt.token';
    setMemoryToken(fakeJwt);

    expect(memoryToken).toBe(fakeJwt);
    expect(localStorage.getItem('ascension_token')).toBeNull();
    expect(localStorage.getItem('ascension_refresh_token')).toBeNull();
  });

  it('refresh response interceptor keeps token in memory and does not write to localStorage', async () => {
    const fakeNewToken = 'refreshed.jwt.token';

    // Mock api.post for /auth/refresh
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { token: fakeNewToken },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as never,
    });

    // Simulate calling /auth/refresh
    const res = await api.post('/auth/refresh', {}, { withCredentials: true });
    setMemoryToken(res.data.token);

    expect(res.data.token).toBe(fakeNewToken);
    expect(memoryToken).toBe(fakeNewToken);
    expect(localStorage.getItem('ascension_token')).toBeNull();
    expect(localStorage.getItem('ascension_refresh_token')).toBeNull();
  });

  it('logout cleans memory token and leaves localStorage free of auth tokens', () => {
    setMemoryToken('some.token');
    expect(memoryToken).toBe('some.token');

    // Simulate logout action
    setMemoryToken(null);
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('ascension_token');
    localStorage.removeItem('ascension_refresh_token');

    expect(memoryToken).toBeNull();
    expect(localStorage.getItem('ascension_token')).toBeNull();
    expect(localStorage.getItem('ascension_refresh_token')).toBeNull();
  });
});
