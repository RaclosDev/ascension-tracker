import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import api from '../api/client';
import { useWorkoutPreferencesActions, type WorkoutPreferences } from '../lib/workout/api';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
}));

it('serializes preference writes and combines rapid changes using the latest committed state', async () => {
  const prefs: WorkoutPreferences = {
    globalMachines: [],
    globalGrips: [],
    exerciseAliases: {},
    exerciseVariants: {},
    hiddenEquipments: [],
    exerciseGifs: {},
    restTimers: {},
    restPreset: 90,
  };
  let saved = prefs;
  let release: (() => void) | undefined;
  vi.mocked(api.get).mockImplementation(async () => ({ data: saved }));
  vi.mocked(api.put).mockImplementation(async (_url, body: unknown) => {
    if (vi.mocked(api.put).mock.calls.length === 1)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    saved = body as WorkoutPreferences;
    return { data: saved };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useWorkoutPreferencesActions(), { wrapper });
  await waitFor(() => expect(result.current.prefs).toBeDefined());
  act(() => {
    result.current.addGlobalGrip('Prono');
    result.current.addGlobalMachine('Cable');
  });
  await waitFor(() => expect(api.put).toHaveBeenCalled());
  expect(api.put).toHaveBeenCalledTimes(1);
  await act(async () => {
    release?.();
  });
  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2));
  expect(saved.globalGrips).toEqual(['Prono']);
  expect(saved.globalMachines).toEqual(['Cable']);
});
