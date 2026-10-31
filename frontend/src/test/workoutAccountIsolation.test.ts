import { beforeEach, expect, it, vi } from 'vitest';
import '../lib/workout/account';

const database = vi.hoisted(() => new Map<string, string>());
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => database.get(key)),
  set: vi.fn(async (key: string, value: string) => {
    database.set(key, value);
  }),
  del: vi.fn(async (key: string) => {
    database.delete(key);
  }),
}));
vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
}));

beforeEach(() => {
  database.clear();
  localStorage.clear();
  vi.resetModules();
  vi.clearAllMocks();
});
const persisted = (name: string) =>
  JSON.stringify({ version: 1, state: { active: { name, startedAt: 1, exercises: [] } } });

it('isolates A and B and restores A after logout without deleting its offline work', async () => {
  const { switchWorkoutAccount } = await import('../lib/workout/account');
  const { useWorkoutStore } = await import('../lib/workout/store');
  await switchWorkoutAccount('a@example.com');
  useWorkoutStore.getState().startEmpty('Session A');
  await switchWorkoutAccount('b@example.com');
  expect(useWorkoutStore.getState().active).toBeNull();
  useWorkoutStore.getState().startEmpty('Session B');
  await switchWorkoutAccount(null);
  expect(useWorkoutStore.getState().active).toBeNull();
  await switchWorkoutAccount('a@example.com');
  expect(useWorkoutStore.getState().active?.name).toBe('Session A');
  await switchWorkoutAccount('b@example.com');
  expect(useWorkoutStore.getState().active?.name).toBe('Session B');
});

it('migrates legacy data only to its previously known owner', async () => {
  database.set('ascension-workout-v1', persisted('Legacy A'));
  const { registerLegacyWorkoutOwner } = await import('../lib/workout/storage');
  registerLegacyWorkoutOwner('a@example.com');
  const { switchWorkoutAccount } = await import('../lib/workout/account');
  const { useWorkoutStore } = await import('../lib/workout/store');
  await switchWorkoutAccount('b@example.com');
  expect(useWorkoutStore.getState().active).toBeNull();
  expect(database.has('ascension-workout-v1')).toBe(true);
  await switchWorkoutAccount('a@example.com');
  expect(useWorkoutStore.getState().active?.name).toBe('Legacy A');
  expect(database.has('ascension-workout-v1')).toBe(false);
});

it('preserves legacy without an owner instead of assigning it to the next login', async () => {
  database.set('forja-v1', persisted('Unknown owner'));
  (await import('../lib/workout/storage')).registerLegacyWorkoutOwner(null);
  const { switchWorkoutAccount } = await import('../lib/workout/account');
  const { useWorkoutStore } = await import('../lib/workout/store');
  await switchWorkoutAccount('b@example.com');
  expect(useWorkoutStore.getState().active).toBeNull();
  expect(database.get('forja-v1')).toBe(persisted('Unknown owner'));
});

it('ignores late hydration of A after switching to B', async () => {
  const { get } = await import('idb-keyval');
  const { workoutAccountKey } = await import('../lib/workout/storage');
  let release: ((value: string) => void) | undefined;
  vi.mocked(get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  database.set(workoutAccountKey('b@example.com'), persisted('Saved B'));
  const { switchWorkoutAccount } = await import('../lib/workout/account');
  const { useWorkoutStore } = await import('../lib/workout/store');
  const a = switchWorkoutAccount('a@example.com');
  await switchWorkoutAccount('b@example.com');
  release?.(persisted('Late A'));
  await a;
  expect(useWorkoutStore.getState().active?.name).toBe('Saved B');
});
