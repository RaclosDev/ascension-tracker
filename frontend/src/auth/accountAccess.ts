/**
 * Sign-in without Google: email and password, a link to reset the password, and passkeys.
 * Every call that opens a session answers `{ token }`; the refresh cookie comes with it. Signing up
 * is the exception: it opens none and asks to check the email.
 */
import api from '../api/client';
import type { Reauth } from './reauth';
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

/**
 * Starts the sign-up. The server answers the same whether or not the address already had an account
 * and opens no session: the person has to check their email. Resolves to the message to show.
 */
export async function startSignUp(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ message?: string }>('/auth/password/register', {
    email,
    password,
  });
  return data.message ?? 'Te hemos enviado un correo.';
}

export async function signInWithPassword(email: string, password: string) {
  const { data } = await api.post<SessionResponse>('/auth/password/login', { email, password });
  return sessionToken(data);
}

/** Confirms the address with the token of the link that was emailed. */
export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/password/verify-email', { token });
}

export interface EmailStatus {
  verified: boolean;
  /** Left when the real owner of the address took the account over; shown until dismissed. */
  notice: string | null;
}

export async function getEmailStatus(): Promise<EmailStatus> {
  const { data } = await api.get<EmailStatus>('/account/email');
  return data;
}

export async function resendVerificationEmail(): Promise<void> {
  await api.post('/account/email/resend');
}

export async function dismissEmailNotice(): Promise<void> {
  await api.delete('/account/email/notice');
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

/**
 * Creates a passkey on this device and saves it in the account under the device's name. The server
 * asks for a recent proof of identity first (403 without it, 429 after too many failures).
 */
export async function addPasskeyOnThisDevice(proof: Reauth) {
  const { data: ceremony } = await api.post<Ceremony>('/passkeys/options', {
    password: proof.password,
    googleCredential: proof.googleCredential,
  });
  const credential = await createPasskey(ceremony.options);
  const { data } = await api.post<PasskeySummary>('/passkeys', {
    requestId: ceremony.requestId,
    credential,
    name: deviceName(),
  });
  return data;
}
