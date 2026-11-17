import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem('ascension_logout_pending');
  document.cookie = 'ascension_logout_pending=; Path=/; Max-Age=0';
  vi.doUnmock('../demo/mode');
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
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

it('lifts a pending logout when this window comes back from the Google redirect it started', async () => {
  const boundary = await import('../auth/sessionBoundary');
  boundary.markSessionLogoutPending();
  boundary.setRedirectSignInStarted(true);
  vi.resetModules();
  window.history.replaceState(null, '', '/?signedIn=google');
  const reloaded = await import('../auth/sessionBoundary');
  reloaded.acceptRedirectSignIn();
  expect(reloaded.isSessionLogoutPending()).toBe(false);
  expect(window.location.search).toBe('');
});

it('keeps the logout pending when the sign-in marker was not requested by this window', async () => {
  const boundary = await import('../auth/sessionBoundary');
  boundary.markSessionLogoutPending();
  window.history.replaceState(null, '', '/?signedIn=google');
  boundary.acceptRedirectSignIn();
  expect(boundary.isSessionLogoutPending()).toBe(true);
  expect(window.location.search).toBe('');
});

it('keeps the demo apart from the real account logout marker', async () => {
  (await import('../auth/sessionBoundary')).markSessionLogoutPending();
  vi.resetModules();
  vi.doMock('../demo/mode', () => ({ DEMO: true }));
  const demo = await import('../auth/sessionBoundary');
  expect(demo.isSessionLogoutPending()).toBe(false);
  demo.clearSessionLogoutPending();
  vi.doUnmock('../demo/mode');
  vi.resetModules();
  expect((await import('../auth/sessionBoundary')).isSessionLogoutPending()).toBe(true);
});
