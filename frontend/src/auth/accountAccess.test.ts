import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addPasskeyOnThisDevice,
  confirmSignUp,
  deletePasskey,
  listPasskeys,
  requestPasswordReset,
  resetPassword,
  signInWithPasskey,
  signInWithPassword,
  startSignUp,
} from './accountAccess';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  createPasskey: vi.fn(),
  getPasskey: vi.fn(),
}));
vi.mock('../api/client', () => ({
  default: { post: mocks.post, get: mocks.get, delete: mocks.del },
}));
vi.mock('../utils/webauthn', () => ({
  createPasskey: mocks.createPasskey,
  getPasskey: mocks.getPasskey,
  deviceName: () => 'Android',
}));

describe('accountAccess', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the password endpoints and returns the session token', async () => {
    mocks.post.mockResolvedValue({ data: { token: 't' } });

    await startSignUp('a@b.es', 'clave');
    expect(await confirmSignUp('a@b.es', '123456', 'clave')).toBe('t');
    expect(await signInWithPassword('a@b.es', 'clave')).toBe('t');
    await requestPasswordReset('a@b.es');
    expect(await resetPassword('tok', 'clave')).toBe('t');

    expect(mocks.post.mock.calls.map(([url]) => url)).toEqual([
      '/auth/password/register',
      '/auth/password/register/confirm',
      '/auth/password/login',
      '/auth/password/reset-request',
      '/auth/password/reset',
    ]);
  });

  it('rejects an answer without a token', async () => {
    mocks.post.mockResolvedValue({ data: {} });
    await expect(signInWithPassword('a@b.es', 'clave')).rejects.toThrow();
  });

  it('runs the passkey ceremonies', async () => {
    const options = { publicKey: { challenge: 'AQ' } };
    mocks.post
      .mockResolvedValueOnce({ data: { requestId: 'r1', options } })
      .mockResolvedValueOnce({ data: { token: 't' } })
      .mockResolvedValueOnce({ data: { requestId: 'r2', options } })
      .mockResolvedValueOnce({ data: { id: 1, name: 'Android' } });
    mocks.getPasskey.mockResolvedValue({ id: 'signed' });
    mocks.createPasskey.mockResolvedValue({ id: 'created' });

    expect(await signInWithPasskey()).toBe('t');
    expect(mocks.post).toHaveBeenNthCalledWith(2, '/auth/passkeys/login', {
      requestId: 'r1',
      credential: { id: 'signed' },
    });

    expect(await addPasskeyOnThisDevice()).toEqual({ id: 1, name: 'Android' });
    expect(mocks.post).toHaveBeenNthCalledWith(4, '/passkeys', {
      requestId: 'r2',
      credential: { id: 'created' },
      name: 'Android',
    });
  });

  it('lists and deletes passkeys', async () => {
    mocks.get.mockResolvedValue({ data: [] });
    mocks.del.mockResolvedValue({});
    expect(await listPasskeys()).toEqual([]);
    await deletePasskey(3);
    expect(mocks.del).toHaveBeenCalledWith('/passkeys/3');
  });
});
