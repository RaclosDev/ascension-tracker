import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem('ascension_logout_pending');
  document.cookie = 'ascension_logout_pending=; Path=/; Max-Age=0';
  vi.resetModules();
});

it('keeps logout pending after module reload until explicit login', async () => {
  const boundary = await import('../auth/sessionBoundary');
  boundary.markSessionLogoutPending();
  vi.resetModules();
  const reloaded = await import('../auth/sessionBoundary');
  expect(reloaded.isSessionLogoutPending()).toBe(true);
  reloaded.clearSessionLogoutPending();
  vi.resetModules();
  expect((await import('../auth/sessionBoundary')).isSessionLogoutPending()).toBe(false);
});

it('retains the logout marker in a cookie when Web Storage is blocked', async () => {
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  (await import('../auth/sessionBoundary')).markSessionLogoutPending();
  write.mockRestore();
  vi.resetModules();
  expect((await import('../auth/sessionBoundary')).isSessionLogoutPending()).toBe(true);
});
