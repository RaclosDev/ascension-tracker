import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import api from '../api/client';
import InvitationPage from '../pages/InvitationPage';
import { HomeRedirect, RememberInvitation } from '../components/coach/InvitationRedirects';
import { SettingsCoachSection } from '../components/settings/SettingsCoachSection';
import { peekPendingInvitation } from '../lib/coach/api';
import CoachClientPage from '../pages/CoachClientPage';
import type { CompletedWorkout, Exercise } from '../lib/workout/types';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../lib/workout/catalog-query', () => ({
  useExerciseCatalog: () => ({ data: [] }),
}));
vi.mock('../components/DashboardCharts', () => ({
  default: (props: { weightChartData: unknown[]; deltaData: unknown[]; goalWeight?: number }) => (
    <div
      data-testid="weight-charts"
      data-points={props.weightChartData.length}
      data-deltas={props.deltaData.length}
      data-goal={props.goalWeight ?? 'none'}
    />
  ),
}));
vi.mock('../components/nutrition/NutritionPieChart', () => ({
  default: ({ pieData }: { pieData: unknown[] }) => (
    <div data-testid="macro-pie" data-slices={pieData.length} />
  ),
}));
vi.mock('../components/workout/heatmap', () => ({
  ActivityHeatmap: ({ history }: { history: CompletedWorkout[] }) => (
    <div data-testid="activity-heatmap" data-workouts={history.length} />
  ),
}));
vi.mock('../components/workout/body-heatmap', () => ({
  BodyHeatmap: ({ customExercises = [] }: { customExercises?: Exercise[] }) => (
    <div data-testid="body-heatmap" data-custom={customExercises.length} />
  ),
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const TOKEN = 'a'.repeat(43);
const coach = { name: 'Laura Coach', email: 'laura@example.com', picture: null };
const mockedApi = vi.mocked(api);

function renderAt(path: string, routes: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes}</Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});
afterEach(cleanup);

describe('InvitationPage', () => {
  const routes = (
    <>
      <Route path="/invitacion/:token" element={<InvitationPage />} />
      <Route path="/settings" element={<p>ajustes</p>} />
    </>
  );

  it('shares nothing by default and sends only the chosen scopes', async () => {
    mockedApi.get.mockResolvedValue({
      data: { coach, expiresAt: '2026-11-12T00:00:00Z', alreadyLinked: false },
    });
    mockedApi.post.mockResolvedValue({ data: {} });
    renderAt(`/invitacion/${TOKEN}`, routes);

    expect(await screen.findByText('Laura Coach')).toBeDefined();
    const accept = screen.getByRole('button', { name: 'Aceptar' }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    expect(screen.getAllByRole('checkbox').every((box) => !(box as HTMLInputElement).checked)).toBe(
      true,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /Cuerpo/ }));
    expect(accept.disabled).toBe(false);
    fireEvent.click(accept);

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(`/coaching/invitations/${TOKEN}/accept`, {
        training: false,
        nutrition: false,
        body: true,
      }),
    );
    expect(await screen.findByText('ajustes')).toBeDefined();
  });

  it('shows the server message for an invalid invitation', async () => {
    mockedApi.get.mockRejectedValue({
      response: { data: { error: 'Invitación no válida o caducada' } },
    });
    renderAt(`/invitacion/${TOKEN}`, routes);
    expect(await screen.findByText('Invitación no válida o caducada')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).toBeNull();
  });

  it('does not offer to accept again when already linked', async () => {
    mockedApi.get.mockResolvedValue({
      data: { coach, expiresAt: '2026-11-12T00:00:00Z', alreadyLinked: true },
    });
    renderAt(`/invitacion/${TOKEN}`, routes);
    expect(await screen.findByText(/Ya estás vinculado con Laura Coach/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).toBeNull();
  });
});

describe('pending invitation across sign-in', () => {
  it('remembers a valid invitation while signed out and opens it after sign-in', async () => {
    renderAt(
      `/invitacion/${TOKEN}`,
      <>
        <Route path="/invitacion/:token" element={<RememberInvitation />} />
        <Route path="/login" element={<p>landing</p>} />
      </>,
    );
    expect(await screen.findByText('landing')).toBeDefined();
    expect(peekPendingInvitation()).toBe(TOKEN);
    cleanup();

    renderAt(
      '/login',
      <>
        <Route path="/login" element={<HomeRedirect />} />
        <Route path="/invitacion/:token" element={<p>invitación abierta</p>} />
        <Route path="/dashboard" element={<p>dashboard</p>} />
      </>,
    );
    expect(await screen.findByText('invitación abierta')).toBeDefined();
  });

  it('ignores malformed tokens and goes to the dashboard', async () => {
    renderAt(
      '/invitacion/not-a-token',
      <>
        <Route path="/invitacion/:token" element={<RememberInvitation />} />
        <Route path="/login" element={<HomeRedirect />} />
        <Route path="/dashboard" element={<p>dashboard</p>} />
      </>,
    );
    expect(await screen.findByText('dashboard')).toBeDefined();
    expect(peekPendingInvitation()).toBeNull();
  });

  it('clears the pending invitation once it is on screen', async () => {
    sessionStorage.setItem('ascension:pending-invitation', TOKEN);
    mockedApi.get.mockResolvedValue({
      data: { coach, expiresAt: '2026-11-12T00:00:00Z', alreadyLinked: false },
    });
    renderAt(
      `/invitacion/${TOKEN}`,
      <Route path="/invitacion/:token" element={<InvitationPage />} />,
    );
    await screen.findByText('Laura Coach');
    expect(peekPendingInvitation()).toBeNull();
  });
});

describe('SettingsCoachSection', () => {
  const link = {
    linkId: 'link-1',
    coach,
    permissions: { training: true, nutrition: false, body: true },
    since: '2026-11-01T10:00:00Z',
  };

  function mockSection() {
    mockedApi.get.mockImplementation((url: string) =>
      Promise.resolve({
        data:
          url === '/coaching/coaches'
            ? [link]
            : [
                {
                  coach,
                  action: 'VIEW_WEIGHT',
                  date: '2026-11-04',
                  lastAt: '2026-11-04T09:00:00Z',
                  hits: 3,
                },
              ],
      }),
    );
  }

  it('updates what is shared with a coach', async () => {
    mockSection();
    mockedApi.patch.mockResolvedValue({ data: undefined });
    renderAt('/', <Route path="/" element={<SettingsCoachSection />} />);

    fireEvent.click(await screen.findByRole('checkbox', { name: /Nutrición/ }));
    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith('/coaching/coaches/link-1', {
        training: true,
        nutrition: true,
        body: true,
      }),
    );
    expect(screen.getByText(/Laura Coach · Peso/)).toBeDefined();
  });

  it('does not allow unsharing everything', async () => {
    mockSection();
    link.permissions = { training: false, nutrition: false, body: true };
    renderAt('/', <Route path="/" element={<SettingsCoachSection />} />);

    fireEvent.click(await screen.findByRole('checkbox', { name: /Cuerpo/ }));
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });
});

describe('CoachClientPage', () => {
  const clientLink = {
    linkId: 'link-9',
    client: { name: 'Ana Alumna', email: 'ana@example.com', picture: null },
    permissions: { training: true, nutrition: true, body: true },
    since: '2026-11-01T10:00:00Z',
  };
  const workout = {
    id: 'w-1',
    name: 'Pecho',
    startedAt: Date.parse('2026-11-03T10:00:00Z'),
    finishedAt: Date.parse('2026-11-03T11:00:00Z'),
    exercises: [{ id: 'we-1', exerciseId: 'custom-1', sets: [] }],
  };

  function mockClient(permissions = clientLink.permissions) {
    const base = '/coach/clients/link-9/';
    const responses: Record<string, unknown> = {
      'weights/dashboard': { currentWeight: 80, currentWeeklyAverage: 80.2 },
      weights: [
        { id: 1, date: '2026-11-02', weight: 80.4 },
        { id: 2, date: '2026-11-04', weight: 80 },
      ],
      'weights/weekly': [{ weekStart: '2026-11-02', average: 80.2, delta: -0.3 }],
      'steps/weekly': [],
      'workouts?page=0&size=10': { content: [workout] },
      'workouts/stats': {
        totalWorkouts: 1,
        totalDurationSeconds: 3600,
        totalVolume: 0,
        totalSets: 0,
      },
      'workouts/custom-exercises': [{ id: 'custom-1', name: 'Press inclinado en polea' }],
      targets: { kcal: 2200 },
      'nutrition/calories/weekly': [],
    };
    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/coach/clients')
        return Promise.resolve({ data: [{ ...clientLink, permissions }] });
      const path = url.startsWith(base) ? url.slice(base.length) : url;
      if (path.startsWith('workouts/recent?since=')) return Promise.resolve({ data: [workout] });
      if (path.startsWith('nutrition/logs?date=')) {
        return Promise.resolve({
          data: [
            { id: 1, product: 'Arroz', quantity: 100, kcal: 350, protein: 7, carbs: 77, fat: 1 },
          ],
        });
      }
      if (path in responses) return Promise.resolve({ data: responses[path] });
      return Promise.reject(new Error(`unexpected ${url}`));
    });
  }

  const routes = <Route path="/entrenador/alumnos/:linkId" element={<CoachClientPage />} />;

  it('shows the real charts and the client custom exercise names', async () => {
    mockClient();
    renderAt('/entrenador/alumnos/link-9', routes);

    expect(await screen.findByText('Press inclinado en polea')).toBeDefined();
    const weightChart = await screen.findByTestId('weight-charts');
    expect(weightChart.dataset.points).toBe('2');
    expect(weightChart.dataset.deltas).toBe('1');
    expect(weightChart.dataset.goal).toBe('none');
    expect((await screen.findByTestId('activity-heatmap')).dataset.workouts).toBe('1');
    expect((await screen.findByTestId('body-heatmap')).dataset.custom).toBe('1');
    expect((await screen.findByTestId('macro-pie')).dataset.slices).toBe('4');
  });

  it('only asks for the areas the client shares', async () => {
    mockClient({ training: false, nutrition: false, body: true });
    renderAt('/entrenador/alumnos/link-9', routes);

    expect(await screen.findByTestId('weight-charts')).toBeDefined();
    const urls = mockedApi.get.mock.calls.map(([url]) => url as string);
    expect(urls.some((url) => url.includes('/workouts'))).toBe(false);
    expect(urls.some((url) => url.includes('/nutrition') || url.endsWith('/targets'))).toBe(false);
  });
});
