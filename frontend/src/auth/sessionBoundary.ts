import { DEMO } from '../demo/mode';

const LOGOUT_KEY = 'ascension_logout_pending';
const REDIRECT_KEY = 'ascension_google_redirect';
const REDIRECT_PARAM = 'signedIn';
let logoutInMemory = false;

export function isSessionLogoutPending(): boolean {
  if (logoutInMemory) return true;
  // La demo no lee ni escribe el cierre de sesión de la cuenta real: su cookie comparte origen.
  if (DEMO) return false;
  try {
    if (localStorage.getItem(LOGOUT_KEY) === '1') return true;
  } catch {
    /* Try the cookie fallback. */
  }
  return (
    typeof document !== 'undefined' &&
    document.cookie.split(';').some((part) => part.trim() === `${LOGOUT_KEY}=1`)
  );
}

export function markSessionLogoutPending(): void {
  logoutInMemory = true;
  if (DEMO) return;
  try {
    localStorage.setItem(LOGOUT_KEY, '1');
  } catch {
    /* Cookie also preserves logout across reload. */
  }
  if (typeof document !== 'undefined')
    document.cookie = `${LOGOUT_KEY}=1; Path=/; Max-Age=31536000; SameSite=Strict`;
}

export function clearSessionLogoutPending(): void {
  logoutInMemory = false;
  if (DEMO) return;
  try {
    localStorage.removeItem(LOGOUT_KEY);
  } catch {
    /* Explicit login remains usable in this tab. */
  }
  if (typeof document !== 'undefined')
    document.cookie = `${LOGOUT_KEY}=; Path=/; Max-Age=0; SameSite=Strict`;
}

/** The installed app signs in with Google by leaving the page; remember that it was asked for. */
export function setRedirectSignInStarted(started: boolean): void {
  try {
    if (started) sessionStorage.setItem(REDIRECT_KEY, '1');
    else sessionStorage.removeItem(REDIRECT_KEY);
  } catch {
    /* Without session storage the redirect cannot lift a pending logout. */
  }
}

/**
 * Coming back from a Google redirect is an explicit sign-in, like `login()` for the popup, so it
 * lifts a pending logout. Both the server's marker and this window's own request are required:
 * the URL alone must not revive a session whose server logout never arrived.
 */
export function acceptRedirectSignIn(): void {
  if (typeof window === 'undefined' || DEMO) return;
  const url = new URL(window.location.href);
  const returned = url.searchParams.get(REDIRECT_PARAM) === 'google';
  let started = false;
  try {
    started = sessionStorage.getItem(REDIRECT_KEY) === '1';
  } catch {
    /* Treated as not started. */
  }
  if (!returned) return;
  setRedirectSignInStarted(false);
  url.searchParams.delete(REDIRECT_PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  if (started) clearSessionLogoutPending();
}
