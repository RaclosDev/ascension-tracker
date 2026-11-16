import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { clearSessionDrafts } from '../lib/sessionDrafts';
import { useSessionDraft } from '../hooks/useSessionDraft';

const auth = vi.hoisted(() => ({ user: { email: 'owner@test' } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import api from '../api/client';
import CoachCheckinPage from '../pages/CoachCheckinPage';
import { CheckinsSection } from '../components/coach/CheckinsSection';
import { CheckinTemplateEditor } from '../components/coach/CheckinTemplateEditor';
import type { Checkin, ClientCheckin } from '../lib/coach/checkins';

const mockedApi = vi.mocked(api);
const coach = { name: 'Laura', email: 'laura@test', picture: null };

const checkin = (over: Partial<Checkin> = {}): Checkin => ({
  id: 'c1',
  linkId: 'l1',
  weekStart: '2026-11-02',
  weightAvg: 80.4,
  energy: 4,
  sleep: 3,
  trainingAdherence: 5,
  dietAdherence: 2,
  answers: [{ question: '¿Molestias?', answer: 'Rodilla' }],
  notes: 'Semana dura',
  coachReply: null,
  repliedAt: null,
  createdAt: '2026-11-03T10:00:00Z',
  updatedAt: '2026-11-03T10:00:00Z',
  ...over,
});

function wrap(
  ui: ReactNode,
  path = '/',
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 5 * 60 * 1000 } },
  }),
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/checkin/:linkId" element={ui} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  sessionStorage.clear();
  clearSessionDrafts();
  auth.user = { email: 'owner@test' };
});

describe('private session drafts', () => {
  const isText = (value: unknown): value is string => typeof value === 'string';

  it('switches accounts without exposing the previous draft in a mounted form', () => {
    const { result, rerender } = renderHook(() => useSessionDraft('one', '', isText));
    act(() => result.current.setValue('Privado'));
    auth.user = { email: 'other@test' };
    rerender();
    expect(result.current.value).toBe('');
    auth.user = { email: 'owner@test' };
    rerender();
    expect(result.current.value).toBe('Privado');
  });

  it('keeps an honest memory-only fallback and warns before leaving with unsent work', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    const first = renderHook(() => useSessionDraft('offline', '', isText));
    act(() => first.result.current.setValue('Sin enviar'));
    const leave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(leave);
    expect(leave.defaultPrevented).toBe(true);
    first.unmount();
    const restored = renderHook(() => useSessionDraft('offline', '', isText));
    expect(restored.result.current.value).toBe('Sin enviar');
    expect(restored.result.current.notice).toContain('No cierres ni recargues');
    act(() => restored.result.current.clear());
    const afterClear = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterClear);
    expect(afterClear.defaultPrevented).toBe(false);
  });
});

describe('Check-ins del atleta', () => {
  it('needs every score before sending and sends the answers', async () => {
    const current: ClientCheckin = {
      linkId: 'l1',
      coach,
      weekStart: '2026-11-02',
      questions: ['¿Qué tal los entrenos?'],
      current: null,
    };
    mockedApi.get.mockImplementation(async (url: string) => ({
      data: url.endsWith('/checkin') ? current : [],
    }));
    mockedApi.put.mockResolvedValue({ data: checkin() });
    wrap(<CoachCheckinPage />, '/checkin/l1');

    const send = await screen.findByRole('button', { name: 'Enviar seguimiento' });
    expect(send).toBeDisabled();
    for (const group of ['energy', 'sleep', 'trainingAdherence', 'dietAdherence']) {
      const radio = document.querySelector<HTMLInputElement>(`input[name="${group}"][value="4"]`);
      fireEvent.click(radio!);
    }
    fireEvent.change(screen.getByLabelText('¿Qué tal los entrenos?'), {
      target: { value: 'Bien' },
    });
    expect(send).toBeEnabled();
    fireEvent.click(send);

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coaching/coaches/l1/checkin', {
        energy: 4,
        sleep: 4,
        trainingAdherence: 4,
        dietAdherence: 4,
        answers: ['Bien'],
        notes: '',
        submissionStatus: 'FINAL',
      }),
    );
  });

  it('preserves the answered review and allows an appended update', async () => {
    const replied = checkin({ coachReply: 'Buen trabajo' });
    mockedApi.get.mockImplementation(async (url: string) => ({
      data: url.endsWith('/checkin')
        ? {
            linkId: 'l1',
            coach,
            weekStart: '2026-11-02',
            questions: ['¿Molestias?'],
            current: replied,
          }
        : [replied],
    }));
    wrap(<CoachCheckinPage />, '/checkin/l1');

    expect(await screen.findByText('Buen trabajo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar actualización' })).toBeDisabled();
    expect(screen.queryByText('Semanas anteriores')).toBeNull();
  });
});

describe('Check-ins en la ficha del entrenador', () => {
  it('shows a newly submitted check-in when reopening a client with a cached empty list', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
    });
    queryClient.setQueryData(['coach', 'client', 'l1', 'checkins'], []);
    mockedApi.get.mockResolvedValue({ data: [checkin()] });

    wrap(<CheckinsSection linkId="l1" />, '/', queryClient);

    expect(await screen.findByText('Rodilla')).toBeInTheDocument();
  });

  it('shows scores, weight and answers and lets the coach reply', async () => {
    mockedApi.get.mockResolvedValue({ data: [checkin()] });
    mockedApi.put.mockResolvedValue({ data: checkin({ coachReply: 'Ánimo' }) });
    wrap(<CheckinsSection linkId="l1" />);

    expect(await screen.findByText('Rodilla')).toBeInTheDocument();
    expect(screen.getByText(/80,4 kg/)).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: 'Ánimo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coach/clients/l1/checkins/c1/reply', {
        reply: 'Ánimo',
        expectedUpdatedAt: checkin().updatedAt,
      }),
    );
  });

  it('restores a reply draft, isolates accounts, and keeps it after a failed send', async () => {
    mockedApi.get.mockResolvedValue({ data: [checkin()] });
    mockedApi.put.mockRejectedValue(new Error('Sin conexión'));
    wrap(<CheckinsSection linkId="l1" />);
    fireEvent.change(await screen.findByLabelText('Tu respuesta'), {
      target: { value: 'Conserva esta respuesta' },
    });
    expect(screen.getByText(/Borrador guardado/)).toBeInTheDocument();
    cleanup();
    auth.user = { email: 'other@test' };
    wrap(<CheckinsSection linkId="l1" />);
    expect(await screen.findByLabelText('Tu respuesta')).toHaveValue('');
    cleanup();
    auth.user = { email: 'owner@test' };
    wrap(<CheckinsSection linkId="l1" />);
    expect(await screen.findByLabelText('Tu respuesta')).toHaveValue('Conserva esta respuesta');
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El borrador se conserva');
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('Conserva esta respuesta');
    fireEvent.click(screen.getByRole('button', { name: 'Descartar borrador' }));
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('');
  });

  it('requires reviewing a changed check-in before sending a restored draft', async () => {
    mockedApi.get.mockResolvedValue({ data: [checkin()] });
    wrap(<CheckinsSection linkId="l1" />);
    fireEvent.change(await screen.findByLabelText('Tu respuesta'), {
      target: { value: 'Sigue así' },
    });
    cleanup();
    mockedApi.get.mockResolvedValue({ data: [checkin({ updatedAt: '2026-11-04T10:00:00Z' })] });
    wrap(<CheckinsSection linkId="l1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('El atleta ha cambiado');
    expect(screen.getByRole('button', { name: 'Responder' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'He revisado los cambios' }));
    expect(screen.getByRole('button', { name: 'Responder' })).toBeEnabled();
  });

  it('keeps only the scores agreed for nutrition and restores the client draft', async () => {
    const current: ClientCheckin = {
      linkId: 'l1',
      coach,
      weekStart: '2026-11-02',
      questions: ['¿Hambre?'],
      current: null,
      scoreKeys: ['energy', 'sleep', 'dietAdherence'],
    };
    mockedApi.get.mockImplementation(async (url: string) => ({
      data: url.endsWith('/checkin') ? current : [],
    }));
    mockedApi.put.mockResolvedValue({ data: checkin({ trainingAdherence: null }) });
    wrap(<CoachCheckinPage />, '/checkin/l1');
    fireEvent.change(await screen.findByLabelText('¿Hambre?'), { target: { value: 'Mejor' } });
    expect(document.querySelector('input[name="trainingAdherence"]')).toBeNull();
    for (const group of current.scoreKeys ?? [])
      fireEvent.click(
        document.querySelector<HTMLInputElement>(`input[name="${group}"][value="4"]`)!,
      );
    cleanup();
    wrap(<CoachCheckinPage />, '/checkin/l1');
    expect(await screen.findByLabelText('¿Hambre?')).toHaveValue('Mejor');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar seguimiento' }));
    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coaching/coaches/l1/checkin', {
        energy: 4,
        sleep: 4,
        trainingAdherence: null,
        dietAdherence: 4,
        answers: ['Mejor'],
        notes: '',
        submissionStatus: 'FINAL',
      }),
    );
  });

  it('offers retry for a connection failure instead of claiming the relationship ended', async () => {
    mockedApi.get.mockRejectedValue(new Error('Sin red'));
    wrap(<CoachCheckinPage />, '/checkin/l1');
    expect((await screen.findAllByRole('button', { name: /Reintentar/ })).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(/Ya no estás vinculado/)).toBeNull();
  });

  it('hides the reply form once answered and explains an empty list', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [checkin({ coachReply: 'Hecho' })] });
    wrap(<CheckinsSection linkId="l1" />);
    expect(await screen.findByText('Hecho')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Responder' })).toBeNull();
    cleanup();

    mockedApi.get.mockResolvedValueOnce({ data: [] });
    wrap(<CheckinsSection linkId="l1" />);
    expect(await screen.findByText(/aún no ha enviado/)).toBeInTheDocument();
  });

  it('edits the template questions and blocks blank ones', async () => {
    mockedApi.get.mockResolvedValue({ data: { questions: ['Una'], custom: false } });
    mockedApi.put.mockResolvedValue({ data: { questions: ['Una', 'Dos'], custom: true } });
    wrap(<CheckinTemplateEditor />);

    await screen.findByLabelText('Pregunta 1');
    fireEvent.click(screen.getByRole('button', { name: /Añadir pregunta/ }));
    const save = screen.getByRole('button', { name: 'Guardar preguntas' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Pregunta 2'), { target: { value: 'Dos' } });
    fireEvent.click(save);

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coach/checkin-template', {
        questions: ['Una', 'Dos'],
      }),
    );
  });
});
