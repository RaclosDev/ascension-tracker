import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../lib/workout/notifications', () => ({
  enablePushNotifications: vi.fn(),
  disablePushNotifications: vi.fn(),
  pushNotificationsPaused: vi.fn(() => false),
}));

import {
  disablePushNotifications,
  enablePushNotifications,
  pushNotificationsPaused,
} from '../lib/workout/notifications';
import { PushToggle } from '../components/coach/PushToggle';

const setPermission = (permission: NotificationPermission) =>
  vi.stubGlobal('Notification', { permission });

beforeEach(() => {
  vi.stubGlobal('navigator', { serviceWorker: {} });
  vi.mocked(pushNotificationsPaused).mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe('Avisos de check-in', () => {
  it('asks to turn notices on and updates once allowed', async () => {
    setPermission('default');
    vi.mocked(enablePushNotifications).mockImplementation(async () => {
      setPermission('granted');
      return true;
    });
    render(<PushToggle text="Activa los avisos." />);
    expect(screen.getByText('Activa los avisos.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Activar avisos' }));
    expect(await screen.findByText('Avisos activados en este dispositivo.')).toBeInTheDocument();
  });

  it('registers the device silently when already allowed and explains a block', async () => {
    setPermission('granted');
    vi.mocked(enablePushNotifications).mockResolvedValue(true);
    render(<PushToggle text="x" />);
    expect(enablePushNotifications).toHaveBeenCalledOnce();
    expect(screen.getByText(/Comprobando avisos/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Desactivar/ })).toBeInTheDocument();
    cleanup();

    setPermission('denied');
    render(<PushToggle text="x" />);
    expect(screen.getByText(/bloqueados/)).toBeInTheDocument();
  });

  it('does not present browser permission as successful server registration and allows retry', async () => {
    setPermission('granted');
    vi.mocked(enablePushNotifications).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<PushToggle text="x" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar activación' }));
    expect(await screen.findByText('Avisos activados en este dispositivo.')).toBeInTheDocument();
  });

  it('keeps controls disabled during activation and handles permission refusal', async () => {
    setPermission('default');
    let finish: ((value: boolean) => void) | undefined;
    vi.mocked(enablePushNotifications).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<PushToggle text="x" />);
    fireEvent.click(screen.getByRole('button', { name: 'Activar avisos' }));
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
    setPermission('denied');
    finish?.(false);
    expect(await screen.findByText(/bloqueados/)).toBeInTheDocument();
  });

  it('keeps notices active if disabling fails and does not reactivate a paused device', async () => {
    setPermission('granted');
    vi.mocked(enablePushNotifications).mockResolvedValue(true);
    vi.mocked(disablePushNotifications)
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce();
    render(<PushToggle text="x" />);
    fireEvent.click(await screen.findByRole('button', { name: /Desactivar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se han podido desactivar');
    fireEvent.click(screen.getByRole('button', { name: /Desactivar/ }));
    expect(await screen.findByRole('button', { name: 'Activar avisos' })).toBeInTheDocument();
    cleanup();
    vi.mocked(pushNotificationsPaused).mockReturnValue(true);
    render(<PushToggle text="x" />);
    expect(screen.getByRole('button', { name: 'Activar avisos' })).toBeInTheDocument();
    expect(enablePushNotifications).toHaveBeenCalledOnce();
  });
});
