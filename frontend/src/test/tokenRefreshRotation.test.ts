import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { memoryToken, setMemoryToken, isTokenValid, refreshAccessToken } from '../api/client';

describe('Token Refresh & Cross-tab Serialization (Audit #2)', () => {
  beforeEach(() => {
    localStorage.clear();
    setMemoryToken(null);
    delete api.defaults.headers.common['Authorization'];
    vi.restoreAllMocks();
  });

  const createFakeJwt = (expSecondsFromNow: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
    const payload = btoa(JSON.stringify({ sub: 'user@example.com', exp }));
    return `${header}.${payload}.signature`;
  };

  describe('isTokenValid', () => {
    it('returns false for null, empty or malformed tokens', () => {
      expect(isTokenValid(null)).toBe(false);
      expect(isTokenValid('')).toBe(false);
      expect(isTokenValid('not-a-jwt')).toBe(false);
    });

    it('returns true when token expiration is comfortably in the future', () => {
      const validToken = createFakeJwt(3600);
      expect(isTokenValid(validToken)).toBe(true);
    });

    it('returns false when token is expired or within the 10-second safety buffer', () => {
      const expiredToken = createFakeJwt(-60);
      expect(isTokenValid(expiredToken)).toBe(false);

      const expiringSoon = createFakeJwt(5);
      expect(isTokenValid(expiringSoon)).toBe(false);
    });
  });

  describe('refreshAccessToken and navigator.locks', () => {
    it('does not rotate if a valid access token is already in memory', async () => {
      const existingValidToken = createFakeJwt(3600);
      setMemoryToken(existingValidToken);

      const postSpy = vi.spyOn(api, 'post');

      const result = await refreshAccessToken();

      expect(result).toBe(existingValidToken);
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('uses navigator.locks when available to serialize refresh across tabs', async () => {
      const newFreshToken = createFakeJwt(3600);
      const requestMock = vi.fn().mockImplementation(async (_lockName, callback) => callback());

      Object.defineProperty(navigator, 'locks', {
        value: { request: requestMock },
        writable: true,
        configurable: true,
      });

      vi.spyOn(api, 'post').mockResolvedValueOnce({
        data: { token: newFreshToken },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      });

      const result = await refreshAccessToken();

      expect(requestMock).toHaveBeenCalledWith('ascension_token_refresh', expect.any(Function));
      expect(result).toBe(newFreshToken);
      expect(memoryToken).toBe(newFreshToken);
    });

    it('clears memoryToken and returns null on 401 expired session', async () => {
      const error401 = { response: { status: 401, data: { message: 'Session expired' } } };
      vi.spyOn(api, 'post').mockRejectedValueOnce(error401);

      const result = await refreshAccessToken();

      expect(result).toBeNull();
      expect(memoryToken).toBeNull();
    });

    it('does not convert a 403 origin/policy failure into a logout', async () => {
      setMemoryToken(createFakeJwt(-60));
      const authFailed = vi.fn();
      window.addEventListener('auth_failed', authFailed);
      vi.spyOn(api, 'post').mockRejectedValueOnce({
        response: { status: 403, data: { error: 'Forbidden origin' } },
      });

      await expect(refreshAccessToken()).rejects.toBeDefined();

      expect(authFailed).not.toHaveBeenCalled();
      window.removeEventListener('auth_failed', authFailed);
    });
  });
});
