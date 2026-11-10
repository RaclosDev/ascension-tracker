import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  base64UrlToBuffer,
  bufferToBase64Url,
  createPasskey,
  deviceName,
  getPasskey,
  isDuplicatePasskey,
  isPasskeyCancel,
  passkeysSupported,
  platformPasskeyAvailable,
} from './webauthn';
import { markPasskeyPromptAnswered, passkeyPromptAnswered } from './passkeyPrompt';

const bytes = (...values: number[]) => new Uint8Array(values).buffer;

function stubCredentials(credentials: Partial<CredentialsContainer>) {
  vi.stubGlobal('navigator', { ...navigator, credentials });
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('webauthn bridge', () => {
  it('round-trips base64url without padding', () => {
    const encoded = bufferToBase64Url(bytes(251, 255, 0, 1));
    expect(encoded).toBe('-_8AAQ');
    expect(new Uint8Array(base64UrlToBuffer(encoded))).toEqual(new Uint8Array([251, 255, 0, 1]));
  });

  it('turns the server options into buffers and the answer back into JSON', async () => {
    const create = vi.fn().mockResolvedValue({
      type: 'public-key',
      id: 'AQI',
      rawId: bytes(1, 2),
      response: {
        clientDataJSON: bytes(3),
        attestationObject: bytes(4),
        getTransports: () => ['internal'],
      },
      getClientExtensionResults: () => ({}),
    });
    stubCredentials({ create });

    const answer = await createPasskey({
      publicKey: {
        challenge: 'AQI',
        user: { id: 'Aw', name: 'ana@example.com' },
        excludeCredentials: [{ id: 'BA', type: 'public-key' }],
      },
    });

    const sent = create.mock.calls[0][0].publicKey;
    expect(new Uint8Array(sent.challenge)).toEqual(new Uint8Array([1, 2]));
    expect(new Uint8Array(sent.user.id)).toEqual(new Uint8Array([3]));
    expect(new Uint8Array(sent.excludeCredentials[0].id)).toEqual(new Uint8Array([4]));
    expect(answer).toMatchObject({
      rawId: 'AQI',
      response: { clientDataJSON: 'Aw', attestationObject: 'BA', transports: ['internal'] },
    });
  });

  it('signs in with the chosen passkey', async () => {
    const get = vi.fn().mockResolvedValue({
      type: 'public-key',
      id: 'AQ',
      rawId: bytes(1),
      response: {
        clientDataJSON: bytes(2),
        authenticatorData: bytes(3),
        signature: bytes(4),
        userHandle: null,
      },
      getClientExtensionResults: () => ({}),
    });
    stubCredentials({ get });

    const answer = await getPasskey({ publicKey: { challenge: 'AQ' } });

    expect(get.mock.calls[0][0].publicKey.allowCredentials).toBeUndefined();
    expect(answer).toMatchObject({
      response: { authenticatorData: 'Aw', signature: 'BA', userHandle: null },
    });
  });

  it('treats a dialog closed without a passkey as a cancel', async () => {
    stubCredentials({
      create: vi.fn().mockResolvedValue(null),
      get: vi.fn().mockResolvedValue(null),
    });
    const options = { publicKey: { challenge: 'AQ', user: { id: 'AQ' } } };

    await expect(createPasskey(options)).rejects.toSatisfy(isPasskeyCancel);
    await expect(getPasskey(options)).rejects.toSatisfy(isPasskeyCancel);
  });

  it('tells cancels and duplicates apart from real errors', () => {
    expect(isPasskeyCancel(new DOMException('x', 'AbortError'))).toBe(true);
    expect(isPasskeyCancel(new Error('x'))).toBe(false);
    expect(isDuplicatePasskey(new DOMException('x', 'InvalidStateError'))).toBe(true);
    expect(isDuplicatePasskey(new DOMException('x', 'NotAllowedError'))).toBe(false);
  });

  it('names the passkey after the device', () => {
    expect(deviceName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)')).toBe('iPhone');
    expect(deviceName('Mozilla/5.0 (iPad; CPU OS 18_0)')).toBe('iPad');
    expect(deviceName('Mozilla/5.0 (Linux; Android 15)')).toBe('Android');
    expect(deviceName('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('Mac');
    expect(deviceName('Mozilla/5.0 (Windows NT 10.0)')).toBe('Windows');
    expect(deviceName('curl/8')).toBe('Llave de acceso');
  });

  it('detects support and a platform authenticator', async () => {
    vi.stubGlobal('PublicKeyCredential', undefined);
    expect(passkeysSupported()).toBe(false);
    expect(await platformPasskeyAvailable()).toBe(false);

    const credential = Object.assign(function PublicKeyCredential() {}, {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
    });
    vi.stubGlobal('PublicKeyCredential', credential);
    stubCredentials({ get: vi.fn() });
    expect(passkeysSupported()).toBe(true);
    expect(await platformPasskeyAvailable()).toBe(true);

    credential.isUserVerifyingPlatformAuthenticatorAvailable.mockRejectedValue(new Error('x'));
    expect(await platformPasskeyAvailable()).toBe(false);
  });
});

describe('passkey prompt memory', () => {
  it('remembers the answer per account, whatever the case of the email', () => {
    expect(passkeyPromptAnswered('Ana@Example.com')).toBe(false);
    markPasskeyPromptAnswered(' ana@example.com ');
    expect(passkeyPromptAnswered('ANA@example.com')).toBe(true);
    expect(passkeyPromptAnswered('otra@example.com')).toBe(false);
    markPasskeyPromptAnswered(null);
  });
});
