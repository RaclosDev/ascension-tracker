import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../api/client';
import CoachPage from '../pages/CoachPage';
import CoachClientsPage from '../pages/CoachClientsPage';
import CoachClientPage from '../pages/CoachClientPage';
import CoachReviewsPage from '../pages/CoachReviewsPage';
import { emptySetup } from '../lib/coach/setup';
import type { ClientStatus } from '../lib/coach/clientStatus';

vi.mock('../components/coach/tour/CoachTourWelcome', () => ({ default: () => null }));

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockedApi = vi.mocked(api);
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'coach@test' } }) }));
const permissions = {
  training: true,
  nutrition: true,
  body: true,
  editTraining: true,
  editNutrition: true,
};
const clients = ['Ángela', 'Bruno'].map((name, i) => ({
  linkId: `l${i}`,
  client: { name, email: `${i}@test`, picture: null },
  permissions,
  since: '2026-11-01T10:00:00Z',
  setup: i === 0 ? null : { ...emptySetup(), reviewed: true },
}));
const statuses: ClientStatus[] = [
  {
    linkId: 'l0',
    level: 'AMBER',
    lastActivity: null,
    pendingReplies: 0,
    weightChange: null,
    signals: [],
  },
  {
    linkId: 'l1',
    level: 'RED',
    lastActivity: '2026-11-01',
    pendingReplies: 2,
    weightChange: null,
    signals: [{ reason: 'CHECKIN_MISSING', level: 'RED', value: 2 }],
  },
];

function mockData(statusData: ClientStatus[] | Error = statuses) {
  mockedApi.get.mockImplementation(async (url) => {
    if (url === '/coach/profile') return { data: { coach: true } };
    if (url.endsWith('/powerlifting')) return { data: { profile: { enabled: false } } };
    if (url.includes('/weeks/'))
      return {
        data: {
          linkId: 'l0',
          weekStart: url.split('/').at(-1),
          version: 0,
          assignmentId: null,
          publishedVersion: null,
          updatedAt: null,
          content: {
            program: { id: null, name: 'Semana', notes: null, weeks: 1, days: [], status: 'DRAFT' },
            privateNotes: '',
            intent: 'BUILD',
            decision: '',
          },
        },
      };
    if (url === '/coach/clients') return { data: clients };
    if (url === '/coach/clients/l0') return { data: clients[0] };
    if (url === '/coach/clients/l1') return { data: clients[1] };
    if (url === '/coach/clients/l0/status') return { data: statuses[0] };
    if (url === '/coach/clients/status') {
      if (statusData instanceof Error) throw statusData;
      return { data: statusData };
    }
    return { data: [] };
  });
}

function renderAt(path = '/entrenador') {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/entrenador" element={<CoachPage />} />
          <Route path="/entrenador/alumnos" element={<CoachClientsPage />} />
          <Route path="/entrenador/alumnos/:linkId" element={<CoachClientPage />} />
          <Route path="/entrenador/revisiones" element={<CoachReviewsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Espacio del entrenador', () => {
  it('counts replies separately from students and does not infer a service from permissions', async () => {
    mockData();
    renderAt();
    await screen.findByRole('heading', { name: 'Pendiente de ti' });
    expect(screen.getByRole('link', { name: /Check-ins por responder/ })).toHaveTextContent(
      '2De 1 alumno',
    );
    expect(screen.getByRole('link', { name: /Alumnos por revisar/ })).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Alumnos activos/ })).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: /Ángela.*Configurar servicio/ })).toHaveAttribute(
      'href',
      '/entrenador/alumnos/l0?seccion=gestion',
    );
    fireEvent.click(screen.getByRole('link', { name: /Check-ins por responder/ }));
    expect(await screen.findByText('2 check-ins por responder de 1 alumno.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Pendiente del alumno/ }));
    expect(await screen.findByText('2 semanas sin check-in')).toBeInTheDocument();
  });

  it('shows unknown counts on failure and recovers with retry', async () => {
    mockData(new Error('offline'));
    renderAt();
    await screen.findByRole('alert');
    expect(screen.getByRole('link', { name: /Check-ins por responder/ })).toHaveTextContent('—');
    expect(screen.queryByText('No tienes respuestas pendientes')).not.toBeInTheDocument();
    mockData();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Pendiente de ti' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not display partial totals as complete', async () => {
    mockData(statuses.slice(0, 1));
    renderAt();
    expect(
      await screen.findByText('Falta información de seguimiento de algún alumno.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alumnos por revisar/ })).toHaveTextContent('—');
    expect(screen.queryByText('Sin señales pendientes')).not.toBeInTheDocument();
  });

  it('opens weekly planning and preserves the roster filters on return', async () => {
    mockData();
    renderAt('/entrenador/alumnos?orden=name&peso=si');
    const search = await screen.findByRole('searchbox', { name: 'Buscar alumno' });
    fireEvent.click(screen.getByText('Más filtros y vista'));
    act(() => {
      fireEvent.change(search, { target: { value: 'angela' } });
      fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar' }), {
        target: { value: 'name' },
      });
    });
    const table = await screen.findByRole('table');
    fireEvent.click(within(table).getByRole('link', { name: 'Ángela' }));
    await screen.findByLabelText('Semana que preparas', {}, { timeout: 10000 });
    const urls = mockedApi.get.mock.calls.map(([url]) => url);
    expect(urls.some((url) => /\/weights|\/nutrition/.test(url))).toBe(false);
    expect(screen.queryByRole('button', { name: 'Terminar relación' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Volver a alumnos' }));
    expect(await screen.findByRole('searchbox', { name: 'Buscar alumno' })).toHaveValue('angela');
    fireEvent.click(screen.getByText('Más filtros y vista'));
    expect(screen.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('name');
    expect(screen.getByRole('checkbox', { name: 'Mostrar peso' })).toBeChecked();
    expect(within(screen.getByRole('table')).queryByText('Bruno')).not.toBeInTheDocument();
  });

  it('keeps a review search when changing its view before navigation commits', async () => {
    mockData();
    renderAt('/entrenador/revisiones');
    const search = await screen.findByRole('searchbox');
    act(() => {
      fireEvent.change(search, { target: { value: 'Bruno' } });
      fireEvent.click(screen.getByRole('button', { name: /Pendiente del alumno/ }));
    });
    expect(await screen.findByRole('searchbox')).toHaveValue('Bruno');
    expect(screen.getByRole('button', { name: /Pendiente del alumno/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
