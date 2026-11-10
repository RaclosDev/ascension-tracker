export type AccessMode = 'login' | 'register';

export const EMAIL_ACCESS_EVENT = 'ascension:email-access';

/**
 * Lets any call to action on the page (nav "Entrar", "Empezar ahora") bring the access panel
 * into view in the right mode and put the cursor in the email field.
 */
export function requestEmailAccess(mode: AccessMode) {
  return (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('entrar')
      ?.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    window.dispatchEvent(new CustomEvent<AccessMode>(EMAIL_ACCESS_EVENT, { detail: mode }));
  };
}
