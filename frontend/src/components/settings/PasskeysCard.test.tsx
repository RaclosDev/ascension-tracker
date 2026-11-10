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
    await waitFor(() =>
      expect(mocks.toast.success).toHaveBeenCalledWith('Llave de acceso guardada'),
    );

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
    await waitFor(() => expect(mocks.addPasskeyOnThisDevice).toHaveBeenCalledTimes(1));
    expect(mocks.toast.error).not.toHaveBeenCalled();

    mocks.addPasskeyOnThisDevice.mockRejectedValueOnce(new DOMException('x', 'InvalidStateError'));
    fireEvent.click(add);
    await waitFor(() =>
      expect(mocks.toast.error).toHaveBeenCalledWith(
        'Este dispositivo ya tiene una llave de esta cuenta.',
      ),
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

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument(),
    );
    expect(mocks.toast.success).toHaveBeenCalled();
  });

  it('keeps the offer after a failure and shows the error', async () => {
    mocks.addPasskeyOnThisDevice.mockRejectedValue(new Error('x'));
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar huella' }));

    await waitFor(() => expect(mocks.toast.error).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Activar huella' })).toBeInTheDocument();
  });

  it('does not show without a fingerprint or face unlock', async () => {
    mocks.platformPasskeyAvailable.mockResolvedValue(false);
    withQueries(<PasskeyPrompt email="ana@example.com" />);
    await waitFor(() => expect(mocks.platformPasskeyAvailable).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Activar huella' })).not.toBeInTheDocument();
  });
});
