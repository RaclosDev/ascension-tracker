import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import AdminPlansPage from '../pages/AdminPlansPage';
import type { CoachPlans } from '../lib/admin/plans';

const mockedApi = vi.mocked(api);

const overview: CoachPlans = {
  plans: [
    { id: 'FREE', maxClients: 1, aiDailyLimit: 50 },
    { id: 'STARTER', maxClients: 10, aiDailyLimit: 100 },
    { id: 'PRO', maxClients: 25, aiDailyLimit: 150 },
  ],
  coaches: [
    {
      coachId: 'c1',
      name: 'Ana Coach',
      email: 'ana@coach.test',
      plan: 'PRO',
      status: 'TRIALING',
      effectivePlan: 'PRO',
      maxClients: 25,
      activeClients: 3,
      trialEndsAt: '2026-11-19T10:00:00Z',
      currentPeriodEnd: null,
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminPlansPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Planes de entrenadores (administración)', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.put.mockReset();
  });
  afterEach(cleanup);

  it('sets a paid plan until a date, and the free plan without one', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/admin/me') return { data: { admin: true } };
      if (url === '/admin/contact-requests') return { data: [] };
      return { data: overview };
    });
    mockedApi.put.mockResolvedValue({ data: overview.coaches[0] });
    renderPage();

    expect(await screen.findByText('Ana Coach')).toBeTruthy();
    expect(screen.getByText(/3\/25 atletas/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Plan de ana@coach.test'), { target: { value: 'PRO' } });
    fireEvent.change(screen.getByLabelText('Pagado hasta para ana@coach.test'), {
      target: { value: '2026-12-04' },
    });
    const saveButton = screen.getByRole('button', { name: 'Guardar plan' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Importe cobrado a ana@coach.test'), {
      target: { value: '36,30' },
    });
    fireEvent.change(screen.getByLabelText('Número de factura de ana@coach.test'), {
      target: { value: ' F-2026-007 ' },
    });
    fireEvent.click(saveButton);
    await vi.waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/admin/coaches/c1/plan', {
        plan: 'PRO',
        paidUntil: '2026-12-04',
        amountCents: 3630,
        vatRatePct: 21,
        method: 'TRANSFER',
        reference: 'F-2026-007',
      }),
    );

    fireEvent.change(screen.getByLabelText('Plan de ana@coach.test'), {
      target: { value: 'FREE' },
    });
    expect(screen.queryByLabelText('Pagado hasta para ana@coach.test')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar plan' }));
    await vi.waitFor(() =>
      expect(mockedApi.put).toHaveBeenLastCalledWith('/admin/coaches/c1/plan', { plan: 'FREE' }),
    );
  });

  it('lists contact requests and marks one as handled', async () => {
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/admin/me') return { data: { admin: true } };
      if (url === '/admin/contact-requests')
        return {
          data: [
            {
              id: 'r1',
              name: 'Luis',
              email: 'luis@gym.test',
              topic: 'CUSTOM',
              message: 'Tengo 80 atletas',
              desiredClients: 80,
              createdAt: '2026-11-05T10:00:00Z',
              handledAt: null,
            },
          ],
        };
      return { data: { plans: overview.plans, coaches: [] } };
    });
    mockedApi.put.mockResolvedValue({ data: undefined });
    renderPage();

    expect(await screen.findByText('Tengo 80 atletas')).toBeTruthy();
    expect(screen.getByText(/Plan a medida · .* · 80 atletas/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como atendida' }));
    await vi.waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/admin/contact-requests/r1/handled', {
        handled: true,
      }),
    );
  });

  it('does not load coaches for non-admins', async () => {
    mockedApi.get.mockResolvedValue({ data: { admin: false } });
    renderPage();
    expect(await screen.findByText('Esta página es solo para administradores.')).toBeTruthy();
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
