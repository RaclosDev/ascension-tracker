import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveWorkoutBanner } from '@/components/workout/ActiveWorkoutBanner';
import { useWorkoutStore } from '@/lib/workout/store';
import { playRestSound, notifyRestFinished } from '@/lib/workout/notifications';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
  playRestSound: vi.fn(),
  notifyRestFinished: vi.fn(),
}));

describe('rest finished alert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('rings away from the live session screen, once', async () => {
    useWorkoutStore.setState({
      active: { name: 'Torso', startedAt: Date.now(), exercises: [] },
      restUntil: Date.now() + 1000,
    });
    // The user is on another page (the shell banner is what stays mounted everywhere).
    render(
      <MemoryRouter initialEntries={['/nutrition']}>
        <ActiveWorkoutBanner />
      </MemoryRouter>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(playRestSound).toHaveBeenCalledTimes(1);
    expect(notifyRestFinished).toHaveBeenCalledTimes(1);
    expect(useWorkoutStore.getState().restUntil).toBeNull();
    vi.useRealTimers();
  });
});
