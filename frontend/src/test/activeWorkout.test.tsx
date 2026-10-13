import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
  initAudioAndNotifications: vi.fn(),
  playRestSound: vi.fn(),
  notifyRestFinished: vi.fn(),
}));

import { ActiveWorkout } from '../components/workout/active-workout';
import { useWorkoutStore } from '../lib/workout/store';

describe('ActiveWorkout Component - Anti-Regression Suite (React #185 Protection)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders placeholder when there is no active workout session', () => {
    useWorkoutStore.setState({
      active: null,
      restUntil: null,
      pickerOpen: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ActiveWorkout />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Sin sesión activa')).toBeDefined();
    expect(screen.getByText('Entrenamiento vacío')).toBeDefined();
  });

  it('renders ActiveWorkout with an active session containing multiple exercises without infinite re-render loop', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Torso Fuerza Hipertrofia',
        startedAt: Date.now() - 120000,
        exercises: [
          {
            id: 'row-1',
            exerciseId: 'bench-press',
            notes: 'Serie de calentamiento',
            variant: { grip: 'ancho' },
            sets: [
              { id: 'set-1', type: 'normal', weight: '80', reps: '8', rpe: '8', completed: false },
              { id: 'set-2', type: 'normal', weight: '85', reps: '6', rpe: '9', completed: false },
            ],
          },
          {
            id: 'row-2',
            exerciseId: 'incline-db-press',
            notes: 'Mancuernas 30kg',
            variant: {},
            sets: [
              { id: 'set-3', type: 'normal', weight: '30', reps: '10', rpe: '8', completed: false },
            ],
          },
        ],
      },
      restUntil: null,
      pickerOpen: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ActiveWorkout />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    // Verify workout header renders stably
    expect(screen.getByText('Torso Fuerza Hipertrofia')).toBeDefined();
    expect(screen.getByText('En curso')).toBeDefined();
    expect(screen.getByRole('button', { name: /Minimizar/i })).toBeDefined();
  });

  it('toggles set completion without crashing or triggering depth loop', () => {
    useWorkoutStore.setState({
      active: {
        name: 'Pierna Pro',
        startedAt: Date.now() - 30000,
        exercises: [
          {
            id: 'row-squat',
            exerciseId: 'squat',
            notes: '',
            variant: {},
            sets: [
              {
                id: 'set-sq-1',
                type: 'normal',
                weight: '120',
                reps: '5',
                rpe: '8',
                completed: false,
              },
            ],
          },
        ],
      },
      restUntil: null,
      pickerOpen: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ActiveWorkout />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    const checkBtn = screen.getByRole('button', { name: /Completar serie/i });
    expect(checkBtn).toBeDefined();

    // Toggle set to completed
    fireEvent.click(checkBtn);

    const activeState = useWorkoutStore.getState().active;
    expect(activeState?.exercises[0].sets[0].completed).toBe(true);
  });
});
