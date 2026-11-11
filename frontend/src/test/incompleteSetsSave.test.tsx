import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { FooterActions } from '@/components/workout/workout-footer-actions';
import { useWorkoutStore } from '@/lib/workout/store';
import type { ActiveWorkout, CompletedWorkout } from '@/lib/workout/types';

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
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
vi.mock('@/lib/workout/api', () => ({
  useSaveWorkout: () => ({ mutate: save, isPending: false }),
  useSaveTemplate: () => ({ mutate: vi.fn() }),
  useCustomExercises: () => ({ data: [] }),
  useRecentWorkouts: () => ({ data: [] }),
}));
vi.mock('@/lib/workout/catalog-query', () => ({
  useExerciseCatalog: () => ({
    data: [
      { id: 'bench', name: 'Press de banca', muscle: 'pecho', equipment: 'barra' },
      { id: 'row', name: 'Remo', muscle: 'espalda_alta', equipment: 'barra' },
    ],
  }),
}));

function session(): ActiveWorkout {
  return {
    name: 'Torso',
    startedAt: Date.now() - 3600000,
    exercises: [
      {
        id: 'bench-row',
        exerciseId: 'bench',
        notes: '',
        sets: [
          { id: 'done', type: 'normal', weight: '80', reps: '5', completed: true },
          { id: 'pending', type: 'normal', weight: '80', reps: '5', completed: false },
        ],
      },
      {
        id: 'row-row',
        exerciseId: 'row',
        notes: '',
        sets: [
          {
            id: 'pending-row',
            type: 'normal',
            weight: '60',
            reps: '8',
            completed: false,
            skipReason: 'Falta de tiempo',
          },
        ],
      },
    ],
  };
}

function finish() {
  fireEvent.click(screen.getByRole('button', { name: 'Terminar Entrenamiento' }));
}
function requestSave() {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
}
function review() {
  return screen.getByRole('dialog', { name: 'Quedan series sin completar' });
}

describe('Review incomplete sets only when saving', () => {
  beforeEach(() => {
    save.mockReset();
    useWorkoutStore.setState({ active: session(), restUntil: null, pickerOpen: false });
  });

  it('waits for Guardar, groups pending sets and saves reasons without completing them', () => {
    render(<FooterActions />);
    expect(screen.queryByText('Quedan series sin completar')).not.toBeInTheDocument();
    finish();
    expect(screen.queryByText('Quedan series sin completar')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre del entrenamiento'), {
      target: { value: 'Torso del lunes' },
    });
    fireEvent.change(screen.getByLabelText('Duración (min)'), { target: { value: '72' } });
    fireEvent.change(screen.getByLabelText(/Notas de la sesión/), {
      target: { value: 'Semana de descarga' },
    });
    requestSave();
    expect(save).not.toHaveBeenCalled();
    const dialog = within(review());
    expect(dialog.getByRole('group', { name: 'Press de banca' })).toBeInTheDocument();
    expect(dialog.getByRole('group', { name: 'Remo' })).toBeInTheDocument();
    expect(dialog.getAllByRole('textbox')).toHaveLength(2);
    fireEvent.change(dialog.getByLabelText('Serie 2 · motivo (opcional)'), {
      target: { value: '  Ajuste de volumen  ' },
    });
    fireEvent.click(dialog.getByRole('button', { name: 'Guardar sin completar' }));
    expect(save).toHaveBeenCalledTimes(1);
    const record: CompletedWorkout = save.mock.calls[0][0];
    expect(record.name).toBe('Torso del lunes');
    expect(record.finishedAt - record.startedAt).toBe(72 * 60000);
    expect(record.notes).toBe('Semana de descarga');
    expect(record.exercises[0].sets).toEqual([
      expect.objectContaining({ id: 'done', completed: true, weight: '80', reps: '5' }),
      expect.objectContaining({ id: 'pending', completed: false, skipReason: 'Ajuste de volumen' }),
    ]);
    expect(record.exercises[1].sets[0].skipReason).toBe('Falta de tiempo');
  });

  it('can return to training, finish remaining sets and save directly', () => {
    render(<FooterActions />);
    finish();
    requestSave();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al entrenamiento' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(useWorkoutStore.getState().active).not.toBeNull();
    act(() => {
      useWorkoutStore.getState().updateSet('bench-row', 'pending', { completed: true });
      useWorkoutStore.getState().updateSet('row-row', 'pending-row', { completed: true });
    });
    finish();
    requestSave();
    expect(screen.queryByText('Quedan series sin completar')).not.toBeInTheDocument();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('closing the review returns to the summary without saving or losing its fields', () => {
    render(<FooterActions />);
    finish();
    fireEvent.change(screen.getByLabelText('Nombre del entrenamiento'), {
      target: { value: 'Personalizado' },
    });
    requestSave();
    fireEvent.click(within(review()).getByRole('button', { name: 'Cerrar' }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nombre del entrenamiento')).toHaveValue('Personalizado');
  });

  it('preserves metadata and reasons when a failed save is retried', () => {
    save.mockImplementationOnce((_record: CompletedWorkout, callbacks: { onError: () => void }) =>
      callbacks.onError(),
    );
    render(<FooterActions />);
    finish();
    fireEvent.change(screen.getByLabelText('Nombre del entrenamiento'), {
      target: { value: 'Reintento' },
    });
    fireEvent.change(screen.getByLabelText(/Notas de la sesión/), {
      target: { value: 'Conservar esta nota' },
    });
    requestSave();
    fireEvent.change(within(review()).getByLabelText('Serie 2 · motivo (opcional)'), {
      target: { value: 'Descarga' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar sin completar' }));
    expect(screen.getByText(/No se pudo sincronizar/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del entrenamiento')).toHaveValue('Reintento');
    requestSave();
    expect(within(review()).getByLabelText('Serie 2 · motivo (opcional)')).toHaveValue('Descarga');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar sin completar' }));
    expect(save.mock.calls[1][0]).toMatchObject({
      name: 'Reintento',
      notes: 'Conservar esta nota',
    });
  });

  it('also reviews incomplete sets when saving an edited session, with reasons optional', () => {
    useWorkoutStore.setState({
      active: { ...session(), editingId: 'saved-session', editingFinishedAt: Date.now() },
    });
    render(<FooterActions />);
    expect(screen.queryByText('Quedan series sin completar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(within(review()).getByRole('button', { name: 'Guardar sin completar' }));
    expect(save.mock.calls[0][0]).toMatchObject({ id: 'saved-session' });
    expect(save.mock.calls[0][0].exercises[0].sets[1]).toMatchObject({ completed: false });
  });

  it('still blocks saving an entirely uncompleted workout', () => {
    useWorkoutStore.getState().updateSet('bench-row', 'done', { completed: false });
    render(<FooterActions />);
    finish();
    expect(
      screen.getByRole('alertdialog', { name: 'No hay series completadas' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Quedan series sin completar')).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
});
