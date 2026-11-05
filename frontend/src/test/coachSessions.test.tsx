import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import { ProgramSessions } from '../components/coach/ProgramSessions';
import { WorkoutHistoryDetail } from '../components/workout/history-detail';
import { sessionStatus, type ProgramSession } from '../lib/coach/sessions';
import type { CompletedWorkout } from '../lib/workout/types';

const mockedApi = vi.mocked(api);

const session = (overrides: Partial<ProgramSession> = {}): ProgramSession => ({
  dayId: 'd1',
  week: 1,
  dayIndex: 1,
  date: '2026-11-02',
  name: 'Torso',
  notes: null,
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Press banca',
      sets: 3,
      repsMin: 6,
      repsMax: 8,
      targetRpe: null,
      targetRir: null,
      restSeconds: null,
      loadHint: null,
      supersetGroup: null,
      notes: null,
    },
  ],
  workoutId: null,
  workoutName: null,
  finishedAt: null,
  origin: null,
  comment: null,
  ...overrides,
});

const workout: CompletedWorkout = {
  id: 'w1',
  name: 'Torso',
  startedAt: 1000,
  finishedAt: 2000,
  exercises: [
    {
      id: 'e1',
      exerciseId: 'bench-press',
      notes: '',
      sets: [
        { id: 's1', type: 'normal', weight: '60', reps: '8', completed: true },
        { id: 's2', type: 'normal', weight: '60', reps: '7', completed: false },
      ],
    },
  ],
  programDayId: 'd1',
  programOrigin: 'PRESCRIBED_MODIFIED',
};

function wrap(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('Pautado frente a hecho', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.put.mockReset();
    mockedApi.delete.mockReset();
  });
  afterEach(cleanup);

  it('classifies each prescribed day', () => {
    const today = '2026-11-05';
    expect(sessionStatus(session({ workoutId: 'w', origin: 'PRESCRIBED' }), today)).toBe('DONE');
    expect(sessionStatus(session({ workoutId: 'w', origin: 'PRESCRIBED_MODIFIED' }), today)).toBe(
      'MODIFIED',
    );
    expect(sessionStatus(session(), today)).toBe('MISSED');
    expect(sessionStatus(session({ date: today }), today)).toBe('PENDING');
  });

  it('shows the prescription next to the logged sets and saves a comment', async () => {
    mockedApi.get.mockImplementation(async (url: string) => ({
      data: url.endsWith('/sessions')
        ? [session({ workoutId: 'w1', workoutName: 'Torso', origin: 'PRESCRIBED_MODIFIED' })]
        : workout,
    }));
    mockedApi.put.mockResolvedValue({ data: undefined });
    wrap(<ProgramSessions linkId="l1" assignmentId="a1" exerciseName={() => 'Press banca'} />);

    fireEvent.click(await screen.findByRole('button', { name: /Torso/ }));
    expect(screen.getByText('Hecho con cambios')).toBeTruthy();
    expect(screen.getByText('3 × 6–8 reps')).toBeTruthy();
    expect(await screen.findByText('60 kg × 8')).toBeTruthy();
    expect(mockedApi.get).toHaveBeenCalledWith('/coach/clients/l1/workouts/w1');

    fireEvent.change(screen.getByLabelText('Comentario para tu alumno'), {
      target: { value: '  Sube peso  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar comentario' }));
    await vi.waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coach/clients/l1/workouts/w1/comment', {
        text: 'Sube peso',
      }),
    );
  });

  it('offers no comment box for a day without a workout', async () => {
    mockedApi.get.mockResolvedValue({ data: [session()] });
    wrap(<ProgramSessions linkId="l1" assignmentId="a1" exerciseName={() => 'Press banca'} />);

    fireEvent.click(await screen.findByRole('button', { name: /Torso/ }));
    expect(screen.getByText('Sin entreno registrado para este día.')).toBeTruthy();
    expect(screen.queryByLabelText('Comentario para tu alumno')).toBeNull();
  });

  it('shows the client the coach comment on a prescribed workout', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        {
          coach: { name: 'Laura', email: 'laura@x.test', picture: null },
          text: 'Buen trabajo',
          updatedAt: '2026-11-05T10:00:00Z',
        },
      ],
    });
    wrap(
      <WorkoutHistoryDetail
        detail={workout}
        history={[workout]}
        catalog={new Map()}
        showRpe={false}
        setDetailId={() => {}}
        setDeletingId={() => {}}
        startFromHistory={() => {}}
      />,
    );

    expect(await screen.findByText('Buen trabajo')).toBeTruthy();
    expect(screen.getByText('Comentario de Laura')).toBeTruthy();
    expect(mockedApi.get).toHaveBeenCalledWith('/coaching/workouts/w1/comments');
  });
});
