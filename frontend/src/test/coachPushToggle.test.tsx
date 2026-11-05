import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../lib/workout/notifications', () => ({ enablePushNotifications: vi.fn() }));

import { enablePushNotifications } from '../lib/workout/notifications';
import { PushToggle } from '../components/coach/PushToggle';

const setPermission = (permission: NotificationPermission) =>
  vi.stubGlobal('Notification', { permission });

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

  it('registers the device silently when already allowed and explains a block', () => {
    setPermission('granted');
    render(<PushToggle text="x" />);
    expect(enablePushNotifications).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    cleanup();

    setPermission('denied');
    render(<PushToggle text="x" />);
    expect(screen.getByText(/bloqueados/)).toBeInTheDocument();
  });
});
