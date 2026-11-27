import { describe, expect, it, vi } from 'vitest';
import {
  focusOrOpen,
  notificationTargetUrl,
  type ClickableWindow,
  type ClientsApi,
} from '../lib/workout/notificationClick';

const ORIGIN = 'https://app.test';
function win(path: string, origin = ORIGIN) {
  const w: ClickableWindow = {
    url: `${origin}${path}`,
    focus: vi.fn(async () => w),
    navigate: vi.fn(async () => undefined),
  };
  return w;
}
const api = (windows: ClickableWindow[]): ClientsApi => ({
  matchAll: vi.fn(async () => windows),
  openWindow: vi.fn(async () => null),
});

describe('tapping a notification', () => {
  it('focuses the window already on that page without opening another', async () => {
    const open = win('/workout');
    const clients = api([win('/'), open]);
    await focusOrOpen(clients, '/workout', ORIGIN);
    expect(open.focus).toHaveBeenCalled();
    expect(open.navigate).not.toHaveBeenCalled();
    expect(clients.openWindow).not.toHaveBeenCalled();
  });

  it('reuses an open window on another page instead of opening a second copy', async () => {
    const other = win('/nutrition');
    const clients = api([other]);
    await focusOrOpen(clients, '/workout', ORIGIN);
    expect(other.focus).toHaveBeenCalled();
    expect(other.navigate).toHaveBeenCalledWith('/workout');
    expect(clients.openWindow).not.toHaveBeenCalled();
  });

  it('opens a window only when the app is not open', async () => {
    const clients = api([win('/workout', 'https://other.test')]);
    await focusOrOpen(clients, '/workout', ORIGIN);
    expect(clients.openWindow).toHaveBeenCalledWith('/workout');
  });

  it('only follows relative paths from the notification', () => {
    expect(notificationTargetUrl({ url: '/nutrition' })).toBe('/nutrition');
    expect(notificationTargetUrl({ url: '//evil.test' })).toBe('/workout');
    expect(notificationTargetUrl({ url: 'https://evil.test' })).toBe('/workout');
    expect(notificationTargetUrl(null)).toBe('/workout');
  });
});
