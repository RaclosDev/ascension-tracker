import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ClientWeek from '../components/coach/ClientWeek';
import api from '../api/client';
import { newExercise, type Program } from '../lib/coach/coachPrograms';
import { adjustProgram } from '../lib/coach/bulkPrescription';
import { type SavedWeek, weekFrom } from '../lib/coach/weeks';
import { recordedPowerSets } from '../lib/powerlifting';
import { clearSessionDrafts } from '../lib/sessionDrafts';

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'coach@weekly.test' } }),
}));
vi.mock('../lib/confirmation', () => ({ confirmAction: vi.fn().mockResolvedValue(true) }));
vi.mock('../lib/workout/api', () => ({ useCustomExercises: () => ({ data: [] }) }));
vi.mock('../lib/workout/catalog-query', () => ({ useExerciseCatalog: () => ({ data: [] }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
const mocked = vi.mocked(api);
const link = {
  linkId: 'l1',
  client: { name: 'Atleta', email: 'athlete@test', picture: null },
  since: '2026-10-01',
  permissions: {
    training: true,
    nutrition: false,
    body: false,
    editTraining: true,
    editNutrition: false,
  },
};
const previous: Program = {
  id: 'p1',
  name: 'Base',
  notes: 'Semana estable',
  weeks: 1,
  status: 'READY',
  days: [
    {
      week: 1,
      dayIndex: 1,
      name: 'Torso',
      notes: null,
      exercises: [
        {
          ...newExercise('bench', 'Banca'),
          sets: 1,
          targetRpe: 8,
          prescription: {
            load: { mode: 'KG', amount: 50, unit: 'TOTAL' },
            sets: [{ kind: 'TOP', reps: 5, rpe: 8, rir: null, load: null }],
          },
        },
      ],
    },
  ],
};
const assignment = {
  id: 'a1',
  programId: 'p1',
  sourceProgramId: null,
  programName: 'Base',
  weeks: 1,
  startDate: '2026-11-09',
  status: 'ACTIVE' as const,
  createdAt: '2026-11-09',
  endedAt: null,
};
let saved: SavedWeek;
function show() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <ClientWeek link={link} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
  sessionStorage.clear();
  clearSessionDrafts();
  saved = {
    linkId: 'l1',
    weekStart: '2026-11-16',
    version: 0,
    assignmentId: null,
    publishedVersion: null,
    updatedAt: null,
    content: {
      program: {
        ...previous,
        id: null,
        name: 'Semana del 2026-11-16',
        days: [],
        notes: null,
        status: 'DRAFT',
      },
      privateNotes: '',
      decision: '',
      intent: 'BUILD',
    },
  };
  mocked.get.mockImplementation(async (url) => ({
    data: url.includes('/weeks/')
      ? saved
      : url.endsWith('/programs/a1/plan')
        ? previous
        : url.endsWith('/clients/l1/programs')
          ? [assignment]
          : [],
  }));
  mocked.put.mockImplementation(async (_url, request) => {
    const value = request as { content: SavedWeek['content'] };
    saved = { ...saved, content: value.content, version: saved.version + 1 };
    return { data: saved };
  });
  mocked.post.mockImplementation(async () => {
    saved = { ...saved, publishedVersion: saved.version, assignmentId: 'new-assignment' };
    return { data: saved };
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe('preparación semanal', () => {
  it('copies the previous week, saves private decisions and publishes only its saved version', async () => {
    show();
    await screen.findByRole('heading', { name: /Preparación/ });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copiar semana anterior' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copiar semana anterior' }));
    expect(await screen.findByLabelText('Nombre del día (Lunes 16/11)')).toHaveValue('Torso');
    fireEvent.change(screen.getByLabelText('Notas privadas del entrenador'), {
      target: { value: 'Solo para mí' },
    });
    fireEvent.change(screen.getByLabelText('Decisión que aplicar al publicar'), {
      target: { value: 'Reducir fatiga' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(screen.getByText('Borrador guardado')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Publicar semana' }));
    await waitFor(() =>
      expect(mocked.post).toHaveBeenCalledWith('/coach/clients/l1/weeks/2026-11-16/publish', {
        expectedVersion: 1,
      }),
    );
    expect(saved.content.privateNotes).toBe('Solo para mí');
    expect(saved.content.program.days[0].exercises[0].prescription?.load?.amount).toBe(50);
    await screen.findByText('Semana publicada');
  });
  it('keeps the local text when another session saves first', async () => {
    show();
    await screen.findByLabelText('Comentario para el atleta');
    fireEvent.change(screen.getByLabelText('Comentario para el atleta'), {
      target: { value: 'Mi descarga' },
    });
    mocked.put.mockImplementation(async () => {
      saved = { ...saved, version: 2, content: { ...saved.content, privateNotes: 'Otra sesión' } };
      throw { response: { status: 409 } };
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await screen.findByText(/Esta semana cambió en otra sesión/);
    expect(screen.getByLabelText('Comentario para el atleta')).toHaveValue('Mi descarga');
    expect(screen.getByRole('button', { name: 'Publicar semana' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Descargar ambas versiones completas (JSON)' }),
    ).toBeInTheDocument();
  });
  it('adjusts typed doses without parsing free text or altering the copied week', () => {
    const next = adjustProgram(previous, {
      day: null,
      exerciseId: null,
      kg: 2.5,
      percent: 0,
      reps: 1,
      rpe: -1,
      rir: 0,
    });
    expect(next.days[0].exercises[0].prescription?.load?.amount).toBe(52.5);
    expect(next.days[0].exercises[0].prescription?.sets?.[0]).toMatchObject({ reps: 6, rpe: 7 });
    expect(previous.days[0].exercises[0].prescription?.load?.amount).toBe(50);
    expect(
      weekFrom(previous, { ...assignment, startDate: '2026-11-10' }, '2026-11-09').days,
    ).toHaveLength(0);
    expect(
      weekFrom(previous, { ...assignment, endedAt: '2026-11-09T12:00:00Z' }, '2026-11-09').days,
    ).toHaveLength(0);
  });
  it('keeps custom SBD variants out of competition metrics unless explicitly included', () => {
    const history = [
      {
        id: 'w',
        name: 'Torso',
        startedAt: 1,
        finishedAt: 2,
        exercises: [
          {
            id: 'e',
            exerciseId: 'custom',
            notes: '',
            variant: { grip: 'Pausa' },
            sets: [
              {
                id: 's',
                type: 'normal' as const,
                weight: '60',
                reps: '3',
                completed: true,
                rir: '2',
              },
            ],
          },
        ],
      },
    ];
    const mapping = {
      exerciseId: 'custom',
      grip: 'Pausa',
      machine: null,
      lift: 'BENCH' as const,
      kind: 'VARIATION' as const,
    };
    expect(recordedPowerSets(history, [mapping])).toHaveLength(0);
    expect(recordedPowerSets(history, [mapping], true)[0]).toMatchObject({
      lift: 'bench',
      weight: 60,
      rpe: null,
    });
  });
});
