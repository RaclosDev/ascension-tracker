import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api from '../api/client';
import { setWorkoutAccountIdentity } from '../lib/workout/accountIdentity';
import {
  disablePushNotifications,
  enablePushNotifications,
  pushNotificationsPaused,
} from '../lib/workout/notifications';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const endpoint = 'https://fcm.googleapis.com/test-device';
const subscription = {
  endpoint,
  toJSON: () => ({ endpoint, keys: { p256dh: 'key', auth: 'auth' } }),
};
const getSubscription = vi.fn();
const getRegistration = vi.fn();

beforeEach(() => {
  localStorage.clear();
  setWorkoutAccountIdentity('first@example.com');
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
  getSubscription.mockResolvedValue(subscription);
  getRegistration.mockResolvedValue({ active: {}, pushManager: { getSubscription } });
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration } });
  vi.mocked(api.post).mockResolvedValue({ data: {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('requires a server acknowledgement and retries a failed registration', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new Error('Offline'));
  expect(await enablePushNotifications()).toBe(false);
  expect(await enablePushNotifications()).toBe(true);
  expect(api.post).toHaveBeenLastCalledWith('/push/subscribe', {
    endpoint,
    keys: { p256dh: 'key', auth: 'auth' },
  });
});

it('does not wait forever for a service worker which is not registered', async () => {
  getRegistration.mockResolvedValue(undefined);
  expect(await enablePushNotifications()).toBe(false);
  expect(api.post).not.toHaveBeenCalled();
});

it('registers the new account instead of reusing an in-memory success from another account', async () => {
  expect(await enablePushNotifications()).toBe(true);
  setWorkoutAccountIdentity('second@example.com');
  expect(await enablePushNotifications()).toBe(true);
  expect(api.post).toHaveBeenCalledTimes(2);
});

it('does not send a subscription after the account changes during browser registration', async () => {
  let finish: ((value: typeof subscription) => void) | undefined;
  getSubscription.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = enablePushNotifications();
  await vi.waitFor(() => expect(getSubscription).toHaveBeenCalledOnce());
  setWorkoutAccountIdentity('second@example.com');
  finish?.(subscription);
  expect(await pending).toBe(false);
  expect(api.post).not.toHaveBeenCalled();
});

it('only disables the current endpoint and persists the device choice until explicitly enabled', async () => {
  await enablePushNotifications();
  await disablePushNotifications();
  expect(api.post).toHaveBeenLastCalledWith('/push/unsubscribe', { endpoint });
  expect(pushNotificationsPaused()).toBe(true);
  expect(localStorage.getItem('ascension_push_paused')).toBe('true');
  await enablePushNotifications();
  expect(pushNotificationsPaused()).toBe(false);
});

it('deduplicates simultaneous registration attempts', async () => {
  expect(await Promise.all([enablePushNotifications(), enablePushNotifications()])).toEqual([
    true,
    true,
  ]);
  expect(api.post).toHaveBeenCalledOnce();
});

it('reports permission errors as failed activation', async () => {
  vi.stubGlobal('Notification', {
    permission: 'default',
    requestPermission: vi.fn().mockRejectedValue(new Error('Unsupported')),
  });
  expect(await enablePushNotifications()).toBe(false);
  expect(api.post).not.toHaveBeenCalled();
});
