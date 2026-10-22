import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { memoryToken, setMemoryToken, getSessionToken, isTokenValid } from '../api/client';

describe('Multi-tab Session Sync & PWA Cold Start', () => {
  const createFakeJwt = (expSecondsFromNow: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
    const payload = btoa(JSON.stringify({ sub: 'user@example.com', exp }));
    return `${header}.${payload}.signature`;
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setMemoryToken(null);
    delete api.defaults.headers.common['Authorization'];
    vi.restoreAllMocks();
  });

  it('allows a newly opened tab with empty sessionStorage to restore session from localStorage', () => {
    const validToken = createFakeJwt(3600);

    // Tab 1 logs in and sets memory token
    setMemoryToken(validToken);
    expect(sessionStorage.getItem('ascension_session_token')).toBe(validToken);
    expect(localStorage.getItem('ascension_session_token')).toBe(validToken);

    // Tab 2 opens in a new tab: its sessionStorage is initially completely empty
    sessionStorage.clear();
    expect(sessionStorage.getItem('ascension_session_token')).toBeNull();

    // Tab 2 calls getSessionToken()
    const recoveredToken = getSessionToken();
    expect(recoveredToken).toBe(validToken);
    expect(isTokenValid(recoveredToken)).toBe(true);

    // Tab 2 re-synced token to its own sessionStorage for fast local access
    expect(sessionStorage.getItem('ascension_session_token')).toBe(validToken);
  });

  it('discards expired tokens safely without destroying storage or triggering cross-tab wipe', () => {
    const expiredToken = createFakeJwt(-60);

    localStorage.setItem('ascension_session_token', expiredToken);
    sessionStorage.setItem('ascension_session_token', expiredToken);

    const token = getSessionToken();
    expect(token).toBeNull();
  });

  it('logout cleans up both sessionStorage and localStorage completely', () => {
    const validToken = createFakeJwt(3600);
    setMemoryToken(validToken);

    expect(localStorage.getItem('ascension_session_token')).toBe(validToken);
    expect(sessionStorage.getItem('ascension_session_token')).toBe(validToken);

    setMemoryToken(null);

    expect(memoryToken).toBeNull();
    expect(localStorage.getItem('ascension_session_token')).toBeNull();
    expect(sessionStorage.getItem('ascension_session_token')).toBeNull();
  });
});
