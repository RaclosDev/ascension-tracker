import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../api/client';
import CoachProgramEditorPage from '../pages/CoachProgramEditorPage';
import CoachProgramsPage from '../pages/CoachProgramsPage';
import { clearSessionDrafts } from '../lib/sessionDrafts';
import {
  addDay,
  copyDay,
  copyWeek,
  emptyProgram,
  moveItem,
  newExercise,
  programProblems,
  setWeeks,
  updateDay,
  type Program,
} from '../lib/coach/coachPrograms';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'coach@example.test' } }),
}));
vi.mock('../lib/workout/catalog-query', () => ({
  useExerciseCatalog: () => ({
    data: [
      { id: 'bench-press', name: 'Press banca', muscle: 'pecho', equipment: 'barra' },
      { id: 'squat', name: 'Sentadilla', muscle: 'cuadriceps', equipment: 'barra' },
    ],
  }),
}));
vi.mock('../lib/workout/api', () => ({
  useCustomExercises: () => ({
    data: [
      {
        id: 'c-1',
        name: 'Press en polea propio',
        muscle: 'pecho',
        equipment: 'polea',
        custom: true,
      },
    ],
  }),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const mockedApi = vi.mocked(api);

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/entrenador/programas" element={<CoachProgramsPage />} />
          <Route path="/entrenador/programas/:programId" element={<CoachProgramEditorPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  clearSessionDrafts();
});
afterEach(cleanup);

describe('program editor helpers', () => {
  const withDay = (): Program => {
    const p = addDay({ ...emptyProgram(), name: 'P', weeks: 3 }, 1, 2);
    return updateDay(p, 1, 2, (d) => ({ ...d, exercises: [newExercise('squat', 'Sentadilla')] }));
  };

  it('adds days sorted and ignores an occupied slot', () => {
    let p = addDay(withDay(), 1, 1);
    p = addDay(p, 1, 2);
    expect(p.days.map((d) => d.dayIndex)).toEqual([1, 2]);
    expect(p.days[1].exercises).toHaveLength(1);
  });

  it('copies a day and a week as independent copies', () => {
    const original = withDay();
    const p = copyDay(original, { week: 1, dayIndex: 2 }, { week: 2, dayIndex: 4 });
    expect(p.days.map((d) => [d.week, d.dayIndex])).toEqual([
      [1, 2],
      [2, 4],
    ]);
    p.days[1].exercises[0].sets = 9;
    expect(original.days[0].exercises[0].sets).toBe(3);

    const weekly = copyWeek(addDay(original, 3, 6), 1, 3);
    expect(weekly.days.filter((d) => d.week === 3).map((d) => d.dayIndex)).toEqual([2]);
    expect(copyWeek(original, 1, 4)).toBe(original);
  });

  it('drops days beyond a shorter program and clamps the weeks', () => {
    const p = copyWeek(withDay(), 1, 3);
    expect(setWeeks(p, 2).days.every((d) => d.week <= 2)).toBe(true);
    expect(setWeeks(p, 99).weeks).toBe(52);
    expect(setWeeks(p, 0).weeks).toBe(1);
  });

  it('moves items and reports what the backend would reject', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a'], 0, 3)).toEqual(['a']);

    const bad = updateDay(withDay(), 1, 2, (d) => ({
      ...d,
      name: ' ',
      exercises: [{ ...d.exercises[0], repsMin: 10, repsMax: 5, sets: 0, targetRpe: 11 }],
    }));
    expect(programProblems({ ...bad, name: '' })).toHaveLength(5);
    expect(programProblems(withDay())).toEqual([]);
  });
});

describe('CoachProgramsPage', () => {
  it('lists the library and duplicates a program', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        { id: 'p-1', name: 'Fuerza', weeks: 4, dayCount: 3, updatedAt: '2026-11-04T10:00:00Z' },
      ],
    });
    mockedApi.post.mockResolvedValue({ data: { id: 'p-2' } });
    renderAt('/entrenador/programas');

    expect(await screen.findByText('Fuerza')).toBeDefined();
    expect(screen.getByText(/4 semanas · 3 días/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Duplicar Fuerza' }));
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/programs/p-1/duplicate'),
    );
  });
});

describe('CoachProgramEditorPage', () => {
  it('builds a new program and saves it whole', async () => {
    mockedApi.post.mockImplementation((_url: string, body: unknown) =>
      Promise.resolve({ data: { ...(body as Program), id: 'p-9' } }),
    );
    mockedApi.get.mockImplementation(() => new Promise(() => {}));
    renderAt('/entrenador/programas/nuevo');

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Hipertrofia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir entrenamiento el lunes' }));
    fireEvent.change(screen.getByLabelText('Buscar ejercicio para añadir'), {
      target: { value: 'press' },
    });
    expect(screen.getByText('Press en polea propio')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Press banca/ }));
    fireEvent.change(screen.getByLabelText('RPE'), { target: { value: '8' } });
    expect(screen.getByLabelText('Arrastrar Press banca')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(1));
    const [url, body] = mockedApi.post.mock.calls[0] as [string, Program];
    expect(url).toBe('/coach/programs');
    expect(body.id).toBeUndefined();
    expect(body.name).toBe('Hipertrofia');
    expect(body.days).toHaveLength(1);
    expect(body.days[0]).toMatchObject({ week: 1, dayIndex: 1 });
    expect(body.days[0].exercises[0]).toMatchObject({
      exerciseId: 'bench-press',
      exerciseName: 'Press banca',
      targetRpe: 8,
    });
  });

  it('recovers an unsaved program after navigation and keeps it after a failed save', async () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {}));
    mockedApi.post.mockRejectedValue(new Error('offline'));
    const first = renderAt('/entrenador/programas/nuevo');
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Borrador recuperable' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir entrenamiento el lunes' }));
    first.unmount();
    renderAt('/entrenador/programas/nuevo');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Borrador recuperable');
    expect(screen.getByLabelText('Buscar ejercicio para añadir')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Conservamos tus cambios');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Borrador recuperable');
  });

  it('blocks publishing empty days and previews the program before publication', async () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {}));
    mockedApi.post.mockImplementation((_url: string, body: unknown) =>
      Promise.resolve({
        data: { ...(body as Program), id: 'p-ready', updatedAt: '2026-11-11T12:00:00Z' },
      }),
    );
    renderAt('/entrenador/programas/nuevo');
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Listo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir entrenamiento el lunes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar listo para asignar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('añade ejercicios');
    expect(mockedApi.post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Buscar ejercicio para añadir'), {
      target: { value: 'press' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Press banca/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
    expect(screen.getByRole('region', { name: 'Vista previa del programa' })).toHaveTextContent(
      'Press banca',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar listo para asignar' }));
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/coach/programs',
        expect.objectContaining({ status: 'READY' }),
      ),
    );
  });

  it('preserves a conflicting local draft as a separate program', async () => {
    const original: Program = {
      ...emptyProgram(),
      id: 'p-1',
      name: 'Original',
      updatedAt: '2026-11-11T10:00:00Z',
    };
    mockedApi.get.mockResolvedValue({ data: original });
    const first = renderAt('/entrenador/programas/p-1');
    await screen.findByDisplayValue('Original');
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Mis cambios' } });
    first.unmount();
    mockedApi.get.mockResolvedValue({
      data: { ...original, name: 'Otra edición', updatedAt: '2026-11-11T11:00:00Z' },
    });
    mockedApi.post.mockImplementation((_url: string, body: unknown) =>
      Promise.resolve({ data: { ...(body as Program), id: 'p-2' } }),
    );
    renderAt('/entrenador/programas/p-1');
    await screen.findByDisplayValue('Mis cambios');
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar como nuevo borrador' }));
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/coach/programs',
        expect.objectContaining({ name: 'Mis cambios', updatedAt: null, status: 'DRAFT' }),
      ),
    );
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('does not save an invalid program', async () => {
    renderAt('/entrenador/programas/nuevo');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir entrenamiento el martes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    expect(await screen.findByText('El programa necesita un nombre.')).toBeDefined();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('edits an existing program with PUT', async () => {
    const existing: Program = {
      id: 'p-1',
      name: 'Fuerza',
      notes: null,
      weeks: 2,
      days: [
        {
          week: 1,
          dayIndex: 1,
          name: 'Torso',
          notes: null,
          exercises: [newExercise('squat', 'Sentadilla')],
        },
      ],
    };
    mockedApi.get.mockResolvedValue({ data: existing });
    mockedApi.put.mockImplementation((_url: string, body: unknown) =>
      Promise.resolve({ data: { ...(body as Program), id: 'p-1' } }),
    );
    renderAt('/entrenador/programas/p-1');

    expect(await screen.findByDisplayValue('Torso')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Copiar la semana 1 a'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Copiar semana 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledTimes(1));
    const [url, body] = mockedApi.put.mock.calls[0] as [string, Program];
    expect(url).toBe('/coach/programs/p-1');
    expect(body.days.map((d) => d.week)).toEqual([1, 2]);
  });
});
