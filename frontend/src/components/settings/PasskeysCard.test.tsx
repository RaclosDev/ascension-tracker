import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasskeysCard } from './PasskeysCard';
import { PasskeyPrompt } from '../PasskeyPrompt';

const mocks = vi.hoisted(() => ({
  listPasskeys: vi.fn(),
  deletePasskey: vi.fn(),
  addPasskeyOnThisDevice: vi.fn(),
  passkeysSupported: vi.fn(),
  platformPasskeyAvailable: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: { onSuccess: (response: { credential?: string }) => void }) => (
    <button type="button" onClick={() => onSuccess({ credential: 'google-credential' })}>
      Continuar con Google
    </button>
  ),
}));
vi.mock('../../auth/accountAccess', () => ({
  listPasskeys: mocks.listPasskeys,
  deletePasskey: mocks.deletePasskey,
  addPasskeyOnThisDevice: mocks.addPasskeyOnThisDevice,
}));
vi.mock('../../utils/webauthn', () => ({
  passkeysSupported: mocks.passkeysSupported,
  platformPasskeyAvailable: mocks.platformPasskeyAvailable,
  isPasskeyCancel: (error: unknown) =>
    error instanceof DOMException && error.name === 'NotAllowedError',
  isDuplicatePasskey: (error: unknown) =>
    error instanceof DOMException && error.name === 'InvalidStateError',
}));

const confirmWithPassword = (password = 'una-clave') => {
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } });
  fireEvent.submit(screen.getByLabelText('Contraseña').closest('form')!);
};

const apiError = (status: number, error: string) => ({ response: { status, data: { error } } });

const withQueries = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {ui}
    </QueryClientProvider>,
  );

describe('PasskeysCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.passkeysSupported.mockReturnValue(true);
    mocks.platformPasskeyAvailable.mockResolvedValue(true);
  });

  it('lists, adds and deletes passkeys', async () => {
    mocks.listPasskeys.mockResolvedValue([
      {
        id: 7,
        name: 'iPhone',
        createdAt: '2026-11-01T10:00:00Z',
        lastUsedAt: '2026-11-02T10:00:00Z',
      },
    ]);
    mocks.addPasskeyOnThisDevice.mockResolvedValue({});
    mocks.deletePasskey.mockResolvedValue(undefined);
    withQueries(<PasskeysCard />);

    expect(await screen.findByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText(/usada el/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Añadir llave en este dispositivo' }));
    // Nothing is created before the identity is confirmed.
    expect(mocks.addPasskeyOnThisDevice).not.toHaveBeenCalled();
    confirmWithPassword();
    await waitFor(() =>
      expect(mocks.toast.success).toHaveBeenCalledWith('Llave de acceso guardada'),
    );
    expect(mocks.addPasskeyOnThisDevice).toHaveBeenCalledWith({ password: 'una-clave' });
    await waitFor(() => expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Borrar la llave iPhone' }));
    await waitFor(() => expect(mocks.deletePasskey).toHaveBeenCalledWith(7));
    await waitFor(() =>
      expect(mocks.toast.success).toHaveBeenCalledWith('Llave de acceso borrada'),
    );
  });

  it('explains a duplicate and stays quiet on cancel', async () => {
    mocks.listPasskeys.mockResolvedValue([]);
    withQueries(<PasskeysCard />);
    const add = screen.getByRole('button', { name: 'Añadir llave en este dispositivo' });

    mocks.addPasskeyOnThisDevice.mockRejectedValueOnce(new DOMException('x', 'NotAllowedError'));
    fireEvent.click(add);
    confirmWithPassword();
    await waitFor(() => expect(mocks.addPasskeyOnThisDevice).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument());
    expect(mocks.toast.error).not.toHaveBeenCalled();

    mocks.addPasskeyOnThisDevice.mockRejectedValueOnce(new DOMException('x', 'InvalidStateError'));
    fireEvent.click(add);
    confirmWithPassword();
    expect(
      await screen.findByText('Este dispositivo ya tiene una llave de esta cuenta.'),
    ).toBeInTheDocument();
  });

  it('shows a wrong password and too many attempts inside the dialog and clears the password', async () => {
    mocks.listPasskeys.mockResolvedValue([]);
    withQueries(<PasskeysCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Añadir llave en este dispositivo' }));

    mocks.addPasskeyOnThisDevice.mockRejectedValueOnce(apiError(403, 'No hemos podido confirmar.'));
    confirmWithPassword('mala-clave');
    expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido confirmar.');
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');

    mocks.addPasskeyOnThisDevice.mockRejectedValueOnce(apiError(429, 'Demasiados intentos.'));
    confirmWithPassword('mala-clave');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Demasiados intentos.'),
    );
    expect(mocks.toast.success).not.toHaveBeenCalled();
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it('confirms with a Google credential and forgets the password when cancelled', async () => {
    mocks.listPasskeys.mockResolvedValue([]);
    mocks.addPasskeyOnThisDevice.mockResolvedValue({});
    withQueries(<PasskeysCard />);
    const open = screen.getByRole('button', { name: 'Añadir llave en este dispositivo' });

    fireEvent.click(open);
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'sin-enviar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument());
    expect(mocks.addPasskeyOnThisDevice).not.toHaveBeenCalled();

    fireEvent.click(open);
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
    await waitFor(() =>
      expect(mocks.addPasskeyOnThisDevice).toHaveBeenCalledWith({
        googleCredential: 'google-credential',
      }),
    );
  });

  it('says when the browser cannot hold passkeys', () => {
    mocks.passkeysSupported.mockReturnValue(false);
    mocks.listPasskeys.mockResolvedValue([]);
    withQueries(<PasskeysCard />);
    expect(screen.getByText('Este navegador no admite llaves de acceso.')).toBeInTheDocument();
  });
});

describe('PasskeyPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.passkeysSupported.mockReturnValue(true);
    mocks.platformPasskeyAvailable.mockResolvedValue(true);
    mocks.listPasskeys.mockResolvedValue([]);
  });

  it('does not offer activation when the account already has a passkey', async () => {
    mocks.listPasskeys.mockResolvedValue([{ id: 7, name: 'iPhone' }]);
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    await act(async () => {
      await mocks.listPasskeys.mock.results[0].value;
    });
    expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument();
  });

  it('asks once per account and remembers "Ahora no"', async () => {
    const { unmount } = withQueries(<PasskeyPrompt email="ana@example.com" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ahora no' }));
    expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument();
    unmount();

    withQueries(<PasskeyPrompt email="ana@example.com" />);
    await waitFor(() => expect(mocks.platformPasskeyAvailable).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument();
  });

  it('saves a passkey and closes', async () => {
    mocks.addPasskeyOnThisDevice.mockResolvedValue({});
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar huella' }));
    expect(mocks.addPasskeyOnThisDevice).not.toHaveBeenCalled();
    confirmWithPassword();

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument(),
    );
    expect(mocks.addPasskeyOnThisDevice).toHaveBeenCalledWith({ password: 'una-clave' });
    expect(mocks.toast.success).toHaveBeenCalled();
  });

  it('keeps the offer after a failure and shows the error', async () => {
    mocks.addPasskeyOnThisDevice.mockRejectedValue(new Error('x'));
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar huella' }));
    confirmWithPassword();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se ha podido activar la huella.',
    );
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('shows the confirmation error when the password is wrong', async () => {
    mocks.addPasskeyOnThisDevice.mockRejectedValue(apiError(403, 'No hemos podido confirmar.'));
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar huella' }));
    confirmWithPassword('mala-clave');

    expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido confirmar.');
  });

  it('does not show without a fingerprint or face unlock', async () => {
    mocks.platformPasskeyAvailable.mockResolvedValue(false);
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    await waitFor(() => expect(mocks.platformPasskeyAvailable).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument();
  });
});
