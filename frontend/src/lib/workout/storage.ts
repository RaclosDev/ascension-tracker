import { useSyncExternalStore } from 'react';
import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
import { validatePersistedWorkout } from './persistedState';

let persistenceError: string | null = null;
const listeners = new Set<() => void>();
const LEGACY_OWNER_KEY = 'ascension_workout_legacy_owner';
export const UNBOUND_WORKOUT_KEY = 'ascension-workout-unbound';
const ACCOUNT_PREFIX = 'ascension-workout-account:';
let legacyOwner: string | null | undefined;
let unclaimedBackup: string | null = null;
const latestValues = new Map<string, string>();
const pendingWrites = new Map<string, Promise<void>>();
export const workoutAccountKey = (email: string) =>
  `${ACCOUNT_PREFIX}${encodeURIComponent(email.trim().toLowerCase())}`;
export const registerLegacyWorkoutOwner = (email: string | null) => {
  if (legacyOwner !== undefined) return;
  try {
    const stored = localStorage.getItem(LEGACY_OWNER_KEY);
    legacyOwner = stored
      ? stored === 'unclaimed'
        ? null
        : stored
      : email?.trim().toLowerCase() || null;
    if (!stored) localStorage.setItem(LEGACY_OWNER_KEY, legacyOwner ?? 'unclaimed');
  } catch {
    legacyOwner = email?.trim().toLowerCase() || null;
  }
};
export const useUnclaimedWorkoutBackup = () =>
  useSyncExternalStore(
    subscribe,
    () => unclaimedBackup,
    () => null,
  );
const reportFailure = () => {
  persistenceError =
    'No se puede guardar el entrenamiento en este dispositivo. No cierres la aplicación hasta guardarlo en el servidor.';
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const useWorkoutPersistenceError = () =>
  useSyncExternalStore(
    subscribe,
    () => persistenceError,
    () => null,
  );

export const workoutStorage: StateStorage = {
  getItem: async (name) => {
    if (name === UNBOUND_WORKOUT_KEY) return null;
    if (latestValues.has(name)) return latestValues.get(name) ?? null;
    try {
      let value = await get<string>(name);
      if (!value && name.startsWith(ACCOUNT_PREFIX)) {
        const legacy =
          (await get<string>('ascension-workout-v1')) || (await get<string>('forja-v1'));
        if (legacy && legacyOwner && name === workoutAccountKey(legacyOwner)) {
          value = validatePersistedWorkout(legacy);
          latestValues.set(name, value);
          try {
            await set(name, value);
            await Promise.all([del('ascension-workout-v1'), del('forja-v1')]);
          } catch {
            reportFailure();
          }
        } else if (legacy && !legacyOwner) {
          unclaimedBackup = legacy;
          listeners.forEach((listener) => listener());
        }
      }
      if (!value && name === 'ascension-workout-v1') {
        value = await get<string>('forja-v1');
        if (value) {
          value = validatePersistedWorkout(value);
          try {
            await set(name, value);
            await del('forja-v1');
          } catch {
            reportFailure();
          }
        }
      }
      return value ? validatePersistedWorkout(value) : null;
    } catch {
      reportFailure();
      return null;
    }
  },
  setItem: async (name, value) => {
    if (name === UNBOUND_WORKOUT_KEY) return;
    latestValues.set(name, value);
    const pending = (pendingWrites.get(name) ?? Promise.resolve()).then(async () => {
      try {
        await set(name, value);
      } catch {
        reportFailure();
      }
    });
    pendingWrites.set(name, pending);
    await pending;
    if (pendingWrites.get(name) === pending) pendingWrites.delete(name);
  },
  removeItem: async (name) => {
    latestValues.delete(name);
    await pendingWrites.get(name);
    try {
      await del(name);
    } catch {
      reportFailure();
    }
  },
};
