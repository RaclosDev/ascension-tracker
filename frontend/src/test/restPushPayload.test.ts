import { expect, it, vi } from 'vitest';
import { parseRestPushPayload, showRestPush } from '../lib/workout/pushPayload';

it.each([
  null,
  [],
  7,
  { title: {}, body: [], tag: 'other-app' },
  { title: '', body: '  ', tag: 'ascension-rest-timer-invalid' },
])('uses safe notification defaults for malformed payload %j', (payload) => {
  expect(parseRestPushPayload(payload)).toEqual({
    title: '¡Descanso terminado!',
    body: 'Es hora de la siguiente serie.',
    tag: 'ascension-rest-timer',
    url: '/workout',
  });
});

it('replaces a repeated timer silently while closing older timer notifications only', async () => {
  const same = { tag: 'ascension-rest-timer-42', close: vi.fn() };
  const previous = { tag: 'ascension-rest-timer-41', close: vi.fn() };
  const unrelated = { tag: 'other-app', close: vi.fn() };
  const registration = {
    getNotifications: vi.fn().mockResolvedValue([same, previous, unrelated]),
    showNotification: vi.fn().mockResolvedValue(undefined),
  };
  await showRestPush(registration, { title: 'Done', body: 'Next set', tag: same.tag });
  expect(same.close).not.toHaveBeenCalled();
  expect(previous.close).toHaveBeenCalledOnce();
  expect(unrelated.close).not.toHaveBeenCalled();
  expect(registration.showNotification).toHaveBeenCalledWith(
    'Done',
    expect.objectContaining({ tag: same.tag, renotify: false }),
  );
});

it('keeps check-in links inside the app and leaves rest timers alone', async () => {
  const linkId = '0b6f1c1e-3a52-4c1b-9a7e-1f2d3c4b5a69';
  expect(
    parseRestPushPayload({
      title: 'T',
      body: 'B',
      tag: `ascension-checkin-${linkId}`,
      url: `/checkin/${linkId}`,
    }),
  ).toMatchObject({ tag: `ascension-checkin-${linkId}`, url: `/checkin/${linkId}` });
  expect(parseRestPushPayload({ url: 'https://evil.example' }).url).toBe('/workout');
  expect(parseRestPushPayload({ url: '//evil.example' }).url).toBe('/workout');
  expect(parseRestPushPayload({ url: '//evil' }).url).toBe('/workout');

  const timer = { tag: 'ascension-rest-timer-7', close: vi.fn() };
  const registration = {
    getNotifications: vi.fn().mockResolvedValue([timer]),
    showNotification: vi.fn().mockResolvedValue(undefined),
  };
  await showRestPush(registration, {
    title: 'T',
    body: 'B',
    tag: `ascension-checkin-${linkId}`,
    url: '/checkin/x',
  });
  expect(timer.close).not.toHaveBeenCalled();
  expect(registration.showNotification).toHaveBeenCalledWith(
    'T',
    expect.objectContaining({ data: { url: '/checkin/x' } }),
  );
});
