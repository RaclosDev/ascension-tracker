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
