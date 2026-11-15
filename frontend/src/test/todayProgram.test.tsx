import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/workout/notifications', () => ({
  scheduleServerRestTimer: vi.fn(),
  cancelServerRestTimer: vi.fn(),
  dismissRestNotifications: vi.fn(),
}));
vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import { TodayProgramCard } from '../components/workout/TodayProgramCard';
import {
  localIsoDate,
  prescriptionText,
  toPrescribedDay,
  type TodayPlan,
} from '../lib/coach/today';
import { programOrigin, useWorkoutStore } from '../lib/workout/store';
import type { ProgramExercise } from '../lib/coach/coachPrograms';

const mockedApi = vi.mocked(api);

const bench: ProgramExercise = {
  exerciseId: 'bench-press',
  exerciseName: 'Press banca',
  sets: 2,
  repsMin: 6,
  repsMax: 8,
  targetRpe: 8,
  targetRir: null,
  restSeconds: 120,
  loadHint: null,
  supersetGroup: null,
  notes: null,
};

const plan = (overrides: Partial<TodayPlan> = {}): TodayPlan => ({
  assignmentId: 'a1',
  programId: 'p1',
  programName: 'Fuerza',
  coachName: 'Laura',
  startDate: '2026-11-02',
  weeks: 4,
  phase: 'ACTIVE',
  week: 1,
  dayIndex: 4,
  day: { id: 'd1', week: 1, dayIndex: 4, name: 'Torso', notes: null, exercises: [bench] },
  completedWorkoutId: null,
  otherDays: [],
  ...overrides,
});

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TodayProgramCard exerciseName={(id) => id} />
    </QueryClientProvider>,
  );
}

describe('Hoy: programa pautado', () => {
  beforeEach(() => {
    useWorkoutStore.setState({ active: null, restUntil: null });
    mockedApi.get.mockReset();
  });
  afterEach(cleanup);

  it('describes the targets of an exercise in one line', () => {
    expect(prescriptionText(bench)).toBe('6–8 reps · RPE 8 · descanso 2:00');
    expect(
      prescriptionText({ ...bench, repsMin: 10, repsMax: 10, targetRpe: null, restSeconds: 45 }),
    ).toBe('10 reps · descanso 45 s');
  });

  it('asks for the device date and starts the prescribed day preloaded', async () => {
    mockedApi.get.mockResolvedValue({ data: [plan()] });
    renderCard();

    expect(await screen.findByRole('heading', { name: 'Torso' })).toBeTruthy();
    expect(mockedApi.get).toHaveBeenCalledWith('/coaching/today', {
      params: { date: localIsoDate() },
    });
    expect(screen.getByText(/de Laura/)).toBeTruthy();
    expect(screen.getByText('Semana 1 de 4, jueves')).toBeTruthy();
    expect(screen.getByText('2 × 6–8 reps · RPE 8 · descanso 2:00')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Empezar entreno pautado/ }));
    const active = useWorkoutStore.getState().active!;
    expect(active.name).toBe('Torso');
    expect(active.programDayId).toBe('d1');
    expect(active.exercises).toHaveLength(1);
    expect(active.exercises[0].sets).toHaveLength(2);
    expect(active.exercises[0].sets[0].reps).toBe('6');
    expect(active.exercises[0].notes).toBe('');
    expect(active.coachExerciseNotes?.[active.exercises[0].id]).toBe('Descanso 2:00');
  });

  it('shows a done day, a rest day and an upcoming program without a start button', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        plan({ completedWorkoutId: 'w1' }),
        plan({ assignmentId: 'a2', day: null }),
        plan({ assignmentId: 'a3', phase: 'UPCOMING', week: null, dayIndex: null, day: null }),
      ],
    });
    renderCard();

    expect(await screen.findByText(/Ya has registrado el entreno de hoy/)).toBeTruthy();
    expect(screen.getByText('Hoy es día de descanso.')).toBeTruthy();
    expect(screen.getByText(/Tu programa empieza el/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Empezar entreno pautado/ })).toBeNull();
  });

  it('keeps the active prescription first and labels future plans separately', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        plan({
          assignmentId: 'future',
          programName: 'Semana próxima',
          phase: 'UPCOMING',
          day: null,
        }),
        plan({ programName: 'Semana actual' }),
      ],
    });
    renderCard();
    await screen.findByText(/Próximamente · Semana próxima/);
    const cards = screen.getAllByRole('article');
    expect(cards[0].textContent).toContain('Hoy · Semana actual');
    expect(cards[1].textContent).toContain('Próximamente · Semana próxima');
    expect(cards[1].textContent).not.toContain('Hoy ·');
  });

  it('lets the client move another day of the week to today', async () => {
    const legs = {
      id: 'd2',
      week: 1,
      dayIndex: 2,
      name: 'Pierna',
      notes: null,
      exercises: [bench],
    };
    mockedApi.get.mockResolvedValue({ data: [plan({ day: null, otherDays: [legs] })] });
    renderCard();

    expect(await screen.findByText('Hoy es día de descanso.')).toBeTruthy();
    fireEvent.click(screen.getByText('Hacer otro día de esta semana'));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar Pierna (martes)' }));
    const active = useWorkoutStore.getState().active!;
    expect(active.name).toBe('Pierna');
    expect(active.programDayId).toBe('d2');
  });

  it('renders nothing without assigned programs', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    const { container } = renderCard();
    await vi.waitFor(() => expect(mockedApi.get).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('marks the workout as modified when the client changes the prescription', () => {
    useWorkoutStore.getState().startFromProgramDay(toPrescribedDay(plan().day!));
    const store = useWorkoutStore.getState();
    const ex = store.active!.exercises[0];
    store.toggleSet(ex.id, ex.sets[0].id);
    store.toggleSet(ex.id, ex.sets[1].id);
    let record = useWorkoutStore.getState().finishWorkout()!;
    expect(record.programDayId).toBe('d1');
    expect(record.programOrigin).toBe('PRESCRIBED');

    useWorkoutStore.getState().toggleSet(ex.id, ex.sets[1].id);
    record = useWorkoutStore.getState().finishWorkout()!;
    expect(record.programOrigin).toBe('PRESCRIBED_MODIFIED');

    expect(programOrigin([{ exerciseId: 'a', sets: 1 }], [])).toBe('PRESCRIBED_MODIFIED');
  });

  it('keeps an own workout unlinked', () => {
    useWorkoutStore.getState().startEmpty('Libre');
    expect(useWorkoutStore.getState().active!.programDayId).toBeUndefined();
  });
});
