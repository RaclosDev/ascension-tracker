import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { del } from 'idb-keyval';
import { useWorkoutStore } from '../lib/workout/store';
import { AuthProvider, useAuth, getCachedUser } from '../context/AuthContext';
import { switchWorkoutAccount } from '../lib/workout/account';
import { clearSessionLogoutPending } from '../auth/sessionBoundary';
import { refreshAccessToken } from '../api/client';
import { SettingsWorkoutSection } from '../components/settings/SettingsWorkoutSection';
import { ExerciseCard } from '../components/workout/exercise-card';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
  initAudioAndNotifications: vi.fn(),
  playRestSound: vi.fn(),
  notifyRestFinished: vi.fn(),
}));

vi.mock('@/api/client', () => {
  return {
    default: {
      defaults: { headers: { common: {} } },
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
    },
    memoryToken: null,
    setMemoryToken: vi.fn(),
    invalidateAuthSession: vi.fn(),
    logoutSession: vi.fn().mockResolvedValue(undefined),
    refreshAccessToken: vi.fn().mockResolvedValue(null),
    isTokenValid: vi.fn().mockReturnValue(true),
    authBroadcast: {
      postMessage: vi.fn(),
      onmessage: null,
    },
  };
});

// Mock jwt-decode with a valid payload
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ email: 'test@example.com', name: 'Tester', exp: 9999999999 }),
}));

describe('Workout Session & Stepper Anti-Regression Suite', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    clearSessionLogoutPending();
    await switchWorkoutAccount(null);
    await switchWorkoutAccount('test@example.com');
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it.each(['{"email":4,"name":[]}', '{"email":" ","name":"Unknown"}'])(
    'rejects malformed cached profiles: %s',
    (profile) => {
      localStorage.setItem('ascension_cached_user', profile);
      expect(getCachedUser()).toBeNull();
    },
  );

  it('waits for remote logout cleanup before activating a new login', async () => {
    let release: ((keys: string[]) => void) | undefined;
    const descriptor = Object.getOwnPropertyDescriptor(window, 'caches');
    const keys = vi.fn(
      () =>
        new Promise<string[]>((resolve) => {
          release = resolve;
        }),
    );
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys, delete: vi.fn().mockResolvedValue(true) },
    });
    try {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        window.dispatchEvent(new CustomEvent('auth_failed', { detail: { reason: 'logout' } }));
      });
      await waitFor(() => expect(keys).toHaveBeenCalled());
      let signedIn = false;
      let login: Promise<void>;
      act(() => {
        login = result.current.login('header.payload.signature').then(() => {
          signedIn = true;
        });
      });
      expect(result.current.isReady).toBe(false);
      expect(signedIn).toBe(false);
      await act(async () => {
        release?.([]);
        await login;
      });
      expect(result.current.token).toBe('header.payload.signature');
      expect(result.current.isReady).toBe(true);
    } finally {
      if (descriptor) Object.defineProperty(window, 'caches', descriptor);
      else Reflect.deleteProperty(window, 'caches');
    }
  });

  it('finishes the auth gate when remote logout interrupts startup refresh', async () => {
    let release: ((token: string | null) => void) | undefined;
    vi.mocked(refreshAccessToken).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      window.dispatchEvent(new CustomEvent('auth_failed', { detail: { reason: 'logout' } }));
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(async () => {
      release?.(null);
    });
    expect(result.current.token).toBeNull();
    expect(result.current.isReady).toBe(true);
  });

  it('clears remote logout data even if browser storage is unavailable', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
    renderHook(() => useAuth(), { wrapper });
    useWorkoutStore.getState().startEmpty('Private workout');
    queryClient.setQueryData(['private-data'], { secret: true });
    const storage = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      await act(async () => {
        window.dispatchEvent(new CustomEvent('auth_failed', { detail: { reason: 'logout' } }));
      });
      expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
      expect(useWorkoutStore.getState().active).toBeNull();
      expect(del).not.toHaveBeenCalled();
      await act(async () => {
        await switchWorkoutAccount('test@example.com');
      });
      expect(useWorkoutStore.getState().active?.name).toBe('Private workout');
    } finally {
      storage.mockRestore();
    }
  });

  it('preserves in-progress workout and localStorage when auth_failed event fires', () => {
    // 1. Setup active workout in Zustand store
    const initialActive = {
      name: 'Pecho Pesado',
      startedAt: Date.now() - 60000,
      exercises: [
        {
          id: 'ex-1',
          exerciseId: 'bench-press',
          notes: '',
          variant: {},
          sets: [
            { id: 's-1', type: 'normal' as const, weight: '100', reps: '5', completed: false },
          ],
        },
      ],
    };
    useWorkoutStore.setState({ active: initialActive });
    localStorage.setItem('workout_preferences', JSON.stringify({ restPreset: 120 }));

    // 2. Render AuthProvider to register listeners
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div>App Child</div>
        </AuthProvider>
      </QueryClientProvider>,
    );

    // 3. Dispatch auth_failed (simulating token refresh drop in gym)
    act(() => {
      window.dispatchEvent(new CustomEvent('auth_failed'));
    });

    // 4. Assert active workout is NOT cleared
    expect(useWorkoutStore.getState().active).not.toBeNull();
    expect(useWorkoutStore.getState().active?.name).toBe('Pecho Pesado');
    expect(useWorkoutStore.getState().active?.exercises[0].sets[0].weight).toBe('100');

    // 5. Assert IndexedDB was NOT wiped
    expect(del).not.toHaveBeenCalledWith('ascension-workout-v1');
    expect(del).not.toHaveBeenCalledWith('forja-v1');

    // 6. Assert user preferences in localStorage were NOT wiped
    expect(localStorage.getItem('workout_preferences')).toContain('120');
  });

  it('preserves in-progress workout when the same known account logs back in', async () => {
    const initialActive = {
      name: 'Espalda y Bíceps',
      startedAt: Date.now() - 30000,
      exercises: [
        {
          id: 'ex-pull',
          exerciseId: 'pull-ups',
          notes: '',
          variant: {},
          sets: [
            { id: 's-pull-1', type: 'normal' as const, weight: '20', reps: '8', completed: false },
          ],
        },
      ],
    };
    useWorkoutStore.setState({ active: initialActive });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('header.payload.signature');
    });

    // Active workout must still exist intact
    expect(useWorkoutStore.getState().active).not.toBeNull();
    expect(useWorkoutStore.getState().active?.name).toBe('Espalda y Bíceps');
    expect(del).not.toHaveBeenCalledWith('ascension-workout-v1');
  });

  it('allows user to backspace base rest time to empty string and type new value like 120 in Settings', () => {
    let savedVal = 90;
    const handleChange = vi.fn((v: number) => {
      savedVal = v;
    });

    render(
      <SettingsWorkoutSection
        isOpen={true}
        onToggle={vi.fn()}
        restPreset={savedVal}
        onRestPresetChange={handleChange}
        onWorkoutSettingsChange={vi.fn()}
        hiddenEquipments={[]}
        onToggleHiddenEquipment={vi.fn()}
        onOpenHevyModal={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/Descanso base en segundos/i) as HTMLInputElement;
    expect(input.value).toBe('90');

    // Backspace '0' -> input becomes '9'
    fireEvent.change(input, { target: { value: '9' } });
    expect(input.value).toBe('9');

    // Backspace '9' -> input becomes '' (must NOT snap back to 90 while typing!)
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    // Type '120'
    fireEvent.change(input, { target: { value: '120' } });
    expect(input.value).toBe('120');
    expect(handleChange).toHaveBeenCalledWith(120);

    // On blur, value is preserved
    fireEvent.blur(input);
    expect(input.value).toBe('120');
  });

  it('manages single active stepper state and prevents multiple steppers open simultaneously', () => {
    const exerciseRow = {
      id: 'row-bench',
      exerciseId: 'bench-press',
      notes: '',
      variant: {},
      sets: [
        { id: 'set-1', type: 'normal' as const, weight: '80', reps: '10', completed: false },
        { id: 'set-2', type: 'normal' as const, weight: '85', reps: '8', completed: false },
      ],
    };

    useWorkoutStore.setState({
      active: {
        name: 'Test Workout',
        startedAt: Date.now(),
        exercises: [exerciseRow],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ExerciseCard rowId="row-bench" row={exerciseRow} index={0} total={1} />
      </QueryClientProvider>,
    );

    const weightInputs = screen.getAllByPlaceholderText('0');
    expect(weightInputs.length).toBeGreaterThanOrEqual(2);

    // 1. Focus Set 1 weight input -> weight stepper appears
    fireEvent.focus(weightInputs[0]);
    expect(screen.getByText('+1.25')).toBeDefined();

    // Verify delete button is strictly inside row container (not spanning outside)
    const deleteBtns = screen.getAllByLabelText(/Eliminar serie/i);
    expect(deleteBtns.length).toBe(2);

    // 2. Click stepper increment button (+1.25) -> pointerDown + click does not fire twice
    const plusBtn = screen.getByText('+1.25');
    fireEvent.pointerDown(plusBtn);
    fireEvent.click(plusBtn);

    // Set 1 weight should increase by 1.25 (80 -> 81.25), not double (82.5)
    const updatedWeight = useWorkoutStore.getState().active?.exercises[0].sets[0].weight;
    expect(updatedWeight).toBe('81.25');

    // 3. Mark set 1 as completed -> stepper immediately disappears
    const checkBtns = screen.getAllByLabelText(/Completar serie/i);
    fireEvent.click(checkBtns[0]);
    expect(screen.queryByText('+1.25')).toBeNull();
  });

  it('preserves exercise variants (grip and machine) when starting workout from history', () => {
    const historicalWorkout: import('../lib/workout/types').CompletedWorkout = {
      id: 'w-history-1',
      name: 'Espalda Dorsal',
      startedAt: Date.now() - 86400000,
      finishedAt: Date.now() - 82800000,
      exercises: [
        {
          id: 'ex-lat',
          exerciseId: 'lat-pulldown',
          notes: 'Agarre neutro cerrado',
          variant: { grip: 'neutro', machine: 'technogym' },
          sets: [{ id: 's-1', type: 'normal', weight: '70', reps: '10', completed: true }],
        },
      ],
    };

    useWorkoutStore.getState().startFromHistory(historicalWorkout);

    const active = useWorkoutStore.getState().active;
    expect(active).not.toBeNull();
    expect(active?.exercises[0].exerciseId).toBe('lat-pulldown');
    expect(active?.exercises[0].variant).toEqual({ grip: 'neutro', machine: 'technogym' });
  });
});
