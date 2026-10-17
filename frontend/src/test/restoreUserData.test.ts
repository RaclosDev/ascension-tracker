import { describe, it, expect, vi, afterEach } from 'vitest';
import api, { restoreUserData, UserDataRestoreSummary } from '../api/client';

describe('restoreUserData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts backup to /user/restore with default MERGE mode and returns summary', async () => {
    const mockSummary: UserDataRestoreSummary = {
      mode: 'MERGE',
      workoutsRestored: 8,
      customExercisesRestored: 3,
      workoutTemplatesRestored: 2,
      foodLogsRestored: 15,
      mealsRestored: 4,
      recipesRestored: 5,
      savedFoodsRestored: 10,
      stepsEntriesRestored: 20,
      weightEntriesRestored: 12,
      settingsRestored: true,
      restoredAt: '2026-10-13T23:00:00Z',
    };

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: mockSummary,
    });

    const payload = { version: '1.0', workouts: [] };
    const result = await restoreUserData(payload);

    expect(postSpy).toHaveBeenCalledWith('/user/restore?mode=MERGE', payload);
    expect(result).toEqual(mockSummary);
    expect(result.workoutsRestored).toBe(8);
    expect(result.mode).toBe('MERGE');
  });

  it('posts backup to /user/restore with explicit OVERWRITE mode and confirmEmpty flag', async () => {
    const mockSummary: UserDataRestoreSummary = {
      mode: 'OVERWRITE',
      workoutsRestored: 2,
      customExercisesRestored: 0,
      workoutTemplatesRestored: 1,
      foodLogsRestored: 5,
      mealsRestored: 0,
      recipesRestored: 1,
      savedFoodsRestored: 2,
      stepsEntriesRestored: 5,
      weightEntriesRestored: 3,
      settingsRestored: false,
      restoredAt: '2026-10-13T23:00:00Z',
    };

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: mockSummary,
    });

    const payload = { version: '1.0', workouts: [] };
    const result = await restoreUserData(payload, 'OVERWRITE', true);

    expect(postSpy).toHaveBeenCalledWith('/user/restore?mode=OVERWRITE&confirmEmpty=true', payload);
    expect(result).toEqual(mockSummary);
    expect(result.mode).toBe('OVERWRITE');
  });
});
