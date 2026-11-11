import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProgramEditor } from '../pages/CoachProgramEditorPage';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import {
  addDay,
  emptyProgram,
  newExercise,
  updateDay,
  type Program,
} from '../lib/coach/coachPrograms';
import { clearSessionDrafts } from '../lib/sessionDrafts';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'coach@confirm.test' } }),
}));
vi.mock('../lib/workout/api', () => ({ useCustomExercises: () => ({ data: [] }) }));
vi.mock('../lib/workout/catalog-query', () => ({ useExerciseCatalog: () => ({ data: [] }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  clearSessionDrafts();
  sessionStorage.clear();
});
afterEach(cleanup);

function editor() {
  let program: Program = {
    ...emptyProgram(),
    id: 'confirmation-test',
    name: 'Dos semanas',
    weeks: 2,
  };
  program = addDay(addDay(program, 1, 1), 2, 1);
  program = updateDay(program, 1, 1, (day) => ({
    ...day,
    name: 'Origen',
    exercises: [newExercise('squat', 'Sentadilla')],
  }));
  program = updateDay(program, 2, 1, (day) => ({ ...day, name: 'Destino' }));
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/editar']}>
        <Routes>
          <Route path="/editar" element={<ProgramEditor initial={program} />} />
          <Route path="/entrenador/programas" element={<p>Biblioteca de programas</p>} />
        </Routes>
        <ConfirmationDialog />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it('copies over an occupied week only after confirming inside the app', async () => {
  editor();
  fireEvent.change(screen.getByLabelText('Copiar la semana 1 a'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Copiar semana 1' }));
  const dialog = screen.getByRole('dialog', { name: 'Sustituir la semana 2' });
  expect(dialog).toHaveTextContent('Todo el contenido de la semana de destino se sustituirá');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  fireEvent.click(screen.getByRole('tab', { name: 'S2' }));
  expect(screen.getByLabelText('Nombre del día (Lunes)')).toHaveValue('Destino');
  fireEvent.click(screen.getByRole('tab', { name: 'S1' }));
  fireEvent.change(screen.getByLabelText('Copiar la semana 1 a'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Copiar semana 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sustituir semana' }));
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'S2' })).toHaveAttribute('aria-selected', 'true'),
  );
  expect(screen.getByLabelText('Nombre del día (Lunes)')).toHaveValue('Origen');
});

it('waits before navigating away from an unsaved program', async () => {
  editor();
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Cambio local' } });
  fireEvent.click(screen.getByRole('link', { name: 'Volver a programas' }));
  expect(screen.queryByText('Biblioteca de programas')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByLabelText('Nombre')).toHaveValue('Cambio local');
  fireEvent.click(screen.getByRole('link', { name: 'Volver a programas' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salir del editor' }));
  expect(await screen.findByText('Biblioteca de programas')).toBeInTheDocument();
});
