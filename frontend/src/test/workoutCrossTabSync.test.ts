import { beforeEach, describe, expect, it, vi } from 'vitest';

const disk = new Map<string, string>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => disk.get(key)),
  set: vi.fn(async (key: string, value: string) => void disk.set(key, value)),
  del: vi.fn(async (key: string) => void disk.delete(key)),
}));
vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
}));

// A tiny in-memory BroadcastChannel: every instance with the same name hears the others, never itself.
class FakeChannel {
  static all: FakeChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor(public name: string) {
    FakeChannel.all.push(this);
  }
  postMessage(data: unknown) {
    for (const other of FakeChannel.all)
      if (other !== this && other.name === this.name) other.onmessage?.({ data } as MessageEvent);
  }
  close() {}
}

async function openTab() {
  vi.resetModules();
  vi.stubGlobal('BroadcastChannel', FakeChannel);
  const storage = await import('../lib/workout/storage');
  const store = await import('../lib/workout/store');
  store.useWorkoutStore.persist.setOptions({ name: 'ascension-workout-account:me' });
  await store.useWorkoutStore.persist.rehydrate();
  return { storage, store: store.useWorkoutStore };
}

describe('the same workout open in two tabs', () => {
  beforeEach(() => {
    disk.clear();
    FakeChannel.all = [];
  });

  it('shows in the second tab what the first one saved', async () => {
    const a = await openTab();
    const b = await openTab();
    a.store.getState().startEmpty('Torso');
    await vi.waitFor(() => expect(b.store.getState().active?.name).toBe('Torso'));
  });

  it('does not echo a followed change back, so the tabs settle', async () => {
    const a = await openTab();
    const b = await openTab();
    const { set } = await import('idb-keyval');
    a.store.getState().startEmpty('Torso');
    await vi.waitFor(() => expect(b.store.getState().active?.name).toBe('Torso'));
    await new Promise((r) => setTimeout(r, 50));
    const writes = vi.mocked(set).mock.calls.length;
    await new Promise((r) => setTimeout(r, 100));
    expect(vi.mocked(set).mock.calls.length).toBe(writes);
  });
});
