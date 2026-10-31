const LOGOUT_KEY = 'ascension_logout_pending';
let logoutInMemory = false;

export function isSessionLogoutPending(): boolean {
  if (logoutInMemory) return true;
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
  try {
    localStorage.removeItem(LOGOUT_KEY);
  } catch {
    /* Explicit login remains usable in this tab. */
  }
  if (typeof document !== 'undefined')
    document.cookie = `${LOGOUT_KEY}=; Path=/; Max-Age=0; SameSite=Strict`;
}
