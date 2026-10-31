import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Access token storage across tabs and reloads', () => {
  const createFakeJwt = (expSecondsFromNow: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
    const payload = btoa(JSON.stringify({ sub: 'user@example.com', exp }));
    return `${header}.${payload}.signature`;
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.resetModules();
  });

  it('never writes the access token to localStorage or sessionStorage', async () => {
    const client = await import('../api/client');
    const validToken = createFakeJwt(3600);

    client.setMemoryToken(validToken);

    expect(client.memoryToken).toBe(validToken);
    expect(localStorage.getItem('ascension_session_token')).toBeNull();
    expect(sessionStorage.getItem('ascension_session_token')).toBeNull();
  });

  it('removes tokens that older builds left in Web Storage', async () => {
    const legacyToken = createFakeJwt(3600);
    localStorage.setItem('ascension_session_token', legacyToken);
    sessionStorage.setItem('ascension_session_token', legacyToken);

    const client = await import('../api/client');

    expect(localStorage.getItem('ascension_session_token')).toBeNull();
    expect(sessionStorage.getItem('ascension_session_token')).toBeNull();
    expect(client.memoryToken).toBeNull();
  });

  it('logout clears the in-memory token', async () => {
    const client = await import('../api/client');
    client.setMemoryToken(createFakeJwt(3600));

    client.setMemoryToken(null);

    expect(client.memoryToken).toBeNull();
  });
});
