import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));
vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock('@/lib/workout/catalog-query', () => ({
  useExerciseCatalog: () => ({
    data: [{ id: 'bench', name: 'Press de banca', muscle: 'pecho', equipment: 'barra' }],
  }),
}));

function session(extra: Partial<ActiveWorkout> = {}): ActiveWorkout {
  return {
    name: 'Torso',
    startedAt: 1_000,
    exercises: [
      {
        id: 'bench-row',
        exerciseId: 'bench',
        notes: '',
        sets: [{ id: 'done', type: 'normal', weight: '80', reps: '5', completed: true }],
      },
    ],
    ...extra,
  };
}

function mount(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <FooterActions />
    </QueryClientProvider>,
  );
}

describe('saving a workout', () => {
  let client: QueryClient;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.post).mockResolvedValue({ data: { id: 'saved-1' } });
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  it('sends empty notes when the user cleared them', async () => {
    useWorkoutStore.setState({ active: session({ notes: 'notas viejas' }), restUntil: null });
    mount(client);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar Entrenamiento' }));
    const notes = document.getElementById('finish-workout-notes') as HTMLTextAreaElement;
    expect(notes.value).toBe('notas viejas');
    fireEvent.change(notes, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ notes: '' });
  });

  it('refreshes the prescribed session of the home screen after saving', async () => {
    useWorkoutStore.setState({ active: session(), restUntil: null });
    const spy = vi.spyOn(client, 'invalidateQueries');
    mount(client);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar Entrenamiento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(spy).toHaveBeenCalledWith({ queryKey: ['coaching', 'today'] }));
  });

  it('reports a failed edit once, not twice', async () => {
    useWorkoutStore.setState({
      active: session({ editingId: 'w-1', editingFinishedAt: 5_000 }),
      restUntil: null,
    });
    vi.mocked(api.put).mockRejectedValue(new Error('boom'));
    mount(client);
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
