import { apiErrorMessage } from '../lib/coach/api';

/**
 * Recent proof of identity that the server asks before sensitive actions such as adding a passkey:
 * the account password or, for accounts that only sign in with Google, a fresh Google credential.
 */
export interface Reauth {
  password?: string;
  googleCredential?: string;
}

const statusOf = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status;

/**
 * Message for a failed confirmation (403 wrong or missing proof, 429 too many attempts), or null
 * when the error is something else and the caller should handle it.
 */
export function reauthMessage(error: unknown): string | null {
  const status = statusOf(error);
  if (status === 403) {
    return apiErrorMessage(error, 'No hemos podido confirmar tu identidad. Revisa la contraseña.');
  }
  if (status === 429) {
    return apiErrorMessage(
      error,
      'Demasiados intentos. Espera unos minutos antes de volver a probar.',
    );
  }
  return null;
}
