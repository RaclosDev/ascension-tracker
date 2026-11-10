/**
 * Offer to add a passkey after signing in: asked once per account and device. Saying "Ahora no",
 * adding a passkey or signing in with one all count as an answer.
 */
const ANSWERED_PREFIX = 'ascension_passkey_prompt:';

const key = (email: string) => ANSWERED_PREFIX + email.trim().toLowerCase();

export function passkeyPromptAnswered(email: string): boolean {
  try {
    return localStorage.getItem(key(email)) !== null;
  } catch {
    return true;
  }
}

export function markPasskeyPromptAnswered(email: string | null | undefined): void {
  if (!email) return;
  try {
    localStorage.setItem(key(email), '1');
  } catch {
    // Private mode: the offer may show again, nothing else breaks.
  }
}
