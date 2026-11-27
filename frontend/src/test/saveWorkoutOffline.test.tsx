import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import api from '@/api/client';
import { FooterActions } from '@/components/workout/workout-footer-actions';
import { useWorkoutStore } from '@/lib/workout/store';
import type { ActiveWorkout } from '@/lib/workout/types';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
}));
vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock('@/lib/workout/catalog-query', () => ({
  useExerciseCatalog: () => ({
    data: [{ id: 'bench', name: 'Press de banca', muscle: 'pecho', equipment: 'barra' }],
  }),
}));

function session(startedAt: number): ActiveWorkout {
  return {
    name: 'Torso',
    startedAt,
    exercises: [
      {
        id: 'bench-row',
        exerciseId: 'bench',
        notes: '',
        sets: [{ id: 'done', type: 'normal', weight: '80', reps: '5', completed: true }],
      },
    ],
  };
}

function screenWith(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <FooterActions />
    </QueryClientProvider>,
  );
}

describe('saving a workout without a connection', () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.mocked(api.post).mockReset().mockResolvedValue({ data: { id: 'saved-1' } });
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    useWorkoutStore.setState({ active: session(1_000), restUntil: null, pickerOpen: false });
    onlineManager.setOnline(false);
  });
  afterEach(() => {
    onlineManager.setOnline(true);
    client.clear();
  });

  it('is sent once when the network returns, even if the screen was left, and closes the session', async () => {
    const first = screenWith(client);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar Entrenamiento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText(/Sin conexión: se enviará al volver/)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();

    // The user leaves the screen and comes back: the pending save is still there and cannot be repeated.
    first.unmount();
    screenWith(client);
    expect(await screen.findByText(/Sin conexión: se enviará al volver/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terminar Entrenamiento' })).toBeInTheDocument();

    await act(async () => {
      onlineManager.setOnline(true);
    });

    await waitFor(() => expect(useWorkoutStore.getState().active).toBeNull());
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.post).mock.calls[0][0]).toBe('/workouts');
  });

  it('does not close a different session that was started while the save was waiting', async () => {
    screenWith(client);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar Entrenamiento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText(/Sin conexión: se enviará al volver/);

    act(() => {
      useWorkoutStore.setState({ active: session(2_000) });
    });
    await act(async () => {
      onlineManager.setOnline(true);
    });

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(useWorkoutStore.getState().active?.startedAt).toBe(2_000);
  });
});
