import { useWorkoutStore } from './store';
import { UNBOUND_WORKOUT_KEY, workoutAccountKey } from './storage';
import { getWorkoutAccount, setWorkoutAccountIdentity } from './accountIdentity';
export { getWorkoutAccount } from './accountIdentity';

let switching: Promise<void> | null = null;

export function switchWorkoutAccount(email: string | null): Promise<void> {
  const normalized = email?.trim().toLowerCase() || null;
  const currentAccount = getWorkoutAccount();
  if (normalized === currentAccount && useWorkoutStore.persist.hasHydrated())
    return Promise.resolve();
  if (normalized === currentAccount && switching) return switching;
  setWorkoutAccountIdentity(normalized);
  // Reset under a non-persistent key so neither account's saved session is overwritten.
  useWorkoutStore.persist.setOptions({ name: UNBOUND_WORKOUT_KEY });
  useWorkoutStore.setState(useWorkoutStore.getInitialState(), true);
  useWorkoutStore.persist.setOptions({
    name: normalized ? workoutAccountKey(normalized) : UNBOUND_WORKOUT_KEY,
  });
  const hydration = Promise.resolve(useWorkoutStore.persist.rehydrate());
  switching = hydration;
  void hydration.finally(() => {
    if (switching === hydration) switching = null;
  });
  return hydration;
}
