import { expect, it, vi } from 'vitest';
import api from '../api/client';
import { scheduleServerRestTimer, cancelServerRestTimer } from '../lib/workout/notifications';

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }));

it('waits for a pending schedule before sending cancel so the timer stays cancelled', async () => {
  let release: (() => void) | undefined;
  const calls: string[] = [];
  vi.mocked(api.post).mockImplementation(async (url) => {
    calls.push(url);
    if (url === '/push/rest-timer')
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return { data: {} };
  });
  const schedule = scheduleServerRestTimer(90);
  await vi.waitFor(() => expect(calls).toEqual(['/push/rest-timer']));
  const cancel = cancelServerRestTimer();
  await Promise.resolve();
  expect(calls).toEqual(['/push/rest-timer']);
  release?.();
  await Promise.all([schedule, cancel]);
  expect(calls).toEqual(['/push/rest-timer', '/push/rest-timer/cancel']);
});
