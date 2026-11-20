import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
vi.mock('../components/coach/editor/ExerciseSearch', () => ({
  ExerciseSearch: ({ onPick }: { onPick: (exercise: { id: string; name: string }) => void }) => (
    <button type="button" onClick={() => onPick({ id: 'sq', name: 'Sentadilla' })}>
      Elegir sentadilla
    </button>
  ),
}));

import api from '../api/client';
import { AthleteNote } from '../components/coach/AthleteNote';
import { AvoidedExercises } from '../components/coach/AvoidedExercises';
import type { CoachClient } from '../lib/coach/api';
import type { CoachNotes } from '../lib/coach/setup';

const put = vi.mocked(api.put);
const link = (notes: CoachNotes | null) => ({ linkId: 'l1', notes }) as unknown as CoachClient;
const wrap = (ui: ReactNode) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AthleteNote', () => {
  it('pins a private note and keeps the avoided exercises', async () => {
    put.mockResolvedValue({ data: {} });
    const avoidedExercises = [{ exerciseId: 'sq', name: 'Sentadilla', reason: null }];
    wrap(<AthleteNote link={link({ pinnedNote: null, avoidedExercises })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fijar una nota' }));
    fireEvent.change(screen.getByLabelText('Nota fijada (solo la ves tú)'), {
      target: { value: '  Hombro derecho  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/coach/clients/l1/notes', {
        pinnedNote: 'Hombro derecho',
        avoidedExercises,
      }),
    );
  });

  it('shows the note and lets the coach remove it', async () => {
    put.mockResolvedValue({ data: {} });
    wrap(<AthleteNote link={link({ pinnedNote: 'Hombro derecho', avoidedExercises: [] })} />);
    expect(screen.getByText('Hombro derecho')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar nota' }));
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/coach/clients/l1/notes', {
        pinnedNote: null,
        avoidedExercises: [],
      }),
    );
  });
});

describe('AvoidedExercises', () => {
  it('adds an exercise, saves its reason and removes it', async () => {
    put.mockResolvedValue({ data: {} });
    const view = wrap(<AvoidedExercises link={link(null)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vetar un ejercicio' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Elegir sentadilla' }));
    const added = [{ exerciseId: 'sq', name: 'Sentadilla', reason: null }];
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/coach/clients/l1/notes', {
        pinnedNote: null,
        avoidedExercises: added,
      }),
    );

    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AvoidedExercises link={link({ pinnedNote: 'Nota', avoidedExercises: added })} />
      </QueryClientProvider>,
    );
    const reason = screen.getByLabelText('Motivo para vetar Sentadilla');
    fireEvent.change(reason, { target: { value: 'Rodilla' } });
    fireEvent.blur(reason);
    await waitFor(() =>
      expect(put).toHaveBeenLastCalledWith('/coach/clients/l1/notes', {
        pinnedNote: 'Nota',
        avoidedExercises: [{ ...added[0], reason: 'Rodilla' }],
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Quitar Sentadilla de los vetados' }));
    await waitFor(() =>
      expect(put).toHaveBeenLastCalledWith('/coach/clients/l1/notes', {
        pinnedNote: 'Nota',
        avoidedExercises: [],
      }),
    );
  });
});
