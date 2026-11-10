/**
 * Sign-in without Google: email and password, a link to reset the password, and passkeys.
 * Every call that opens a session answers `{ token }`; the refresh cookie comes with it.
 */
import api from '../api/client';
import { createPasskey, deviceName, getPasskey, type BrowserOptions } from '../utils/webauthn';

interface SessionResponse {
  token?: string;
}

interface Ceremony {
  requestId: string;
  options: BrowserOptions;
}

export interface PasskeySummary {
  id: number;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const sessionToken = (data: SessionResponse) => {
  if (!data.token) throw new Error('Invalid authentication response');
  return data.token;
};

/** Creates an account and opens its session. */
export async function startSignUp(email: string, password: string) {
  const { data } = await api.post<SessionResponse>('/auth/password/register', { email, password });
  return sessionToken(data);
}

export async function signInWithPassword(email: string, password: string) {
  const { data } = await api.post<SessionResponse>('/auth/password/login', { email, password });
  return sessionToken(data);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/password/reset-request', { email });
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<SessionResponse>('/auth/password/reset', { token, password });
  return sessionToken(data);
}

/** Opens the device's passkey chooser and signs in with the one picked. */
export async function signInWithPasskey() {
  const { data: ceremony } = await api.post<Ceremony>('/auth/passkeys/login/options');
  const credential = await getPasskey(ceremony.options);
  const { data } = await api.post<SessionResponse>('/auth/passkeys/login', {
    requestId: ceremony.requestId,
    credential,
  });
  return sessionToken(data);
}

export async function listPasskeys() {
  const { data } = await api.get<PasskeySummary[]>('/passkeys');
  return data;
}

export async function deletePasskey(id: number): Promise<void> {
  await api.delete(`/passkeys/${id}`);
}

/** Creates a passkey on this device and saves it in the account under the device's name. */
export async function addPasskeyOnThisDevice() {
  const { data: ceremony } = await api.post<Ceremony>('/passkeys/options');
  const credential = await createPasskey(ceremony.options);
  const { data } = await api.post<PasskeySummary>('/passkeys', {
    requestId: ceremony.requestId,
    credential,
    name: deviceName(),
  });
  return data;
}
