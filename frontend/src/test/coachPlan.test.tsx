import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import CoachPlanPage from '../pages/CoachPlanPage';
import type { CoachBilling, CoachSubscription } from '../lib/coach/plan';

const mockedApi = vi.mocked(api);

const subscription: CoachSubscription = {
  plan: 'PRO',
  status: 'TRIALING',
  effectivePlan: 'PRO',
  maxClients: 25,
  activeClients: 4,
  aiDailyLimit: 150,
  trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 - 60_000).toISOString(),
  currentPeriodEnd: null,
};

const billing = (holder: string | null, iban: string | null): CoachBilling => ({
  plans: [
    { id: 'FREE', maxClients: 1, aiDailyLimit: 50, monthlyPriceEur: 0, annualPriceEur: 0 },
    { id: 'STARTER', maxClients: 10, aiDailyLimit: 100, monthlyPriceEur: 19, annualPriceEur: 190 },
  ],
  annualMonths: 10,
  transferHolder: holder,
  transferIban: iban,
});

function mockApi(coach: boolean, bill: CoachBilling) {
  mockedApi.get.mockImplementation(async (url: string) => {
    if (url === '/coach/profile') return { data: { coach } };
    if (url === '/coach/subscription') return { data: subscription };
    if (url === '/coach/billing') return { data: bill };
    throw new Error(`unexpected ${url}`);
  });
}

function renderPage(path = '/entrenador/plan') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <CoachPlanPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Plan y facturación', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
  });
  afterEach(cleanup);

  it('shows the trial, the prices and the transfer details', async () => {
    mockApi(true, billing('Ascension SL', 'ES00 1234'));
    renderPage();
    expect(await screen.findByText('Tu plan: Pro')).toBeTruthy();
    expect(screen.getByText(/4 de 25 alumnos/)).toBeTruthy();
    expect(screen.getByText(/Te quedan 5 días de prueba/)).toBeTruthy();
    expect(await screen.findByText('19 €/mes')).toBeTruthy();
    expect(screen.getByText('o 190 €/año (2 meses gratis)')).toBeTruthy();
    expect(screen.getByText('ES00 1234')).toBeTruthy();
  });

  it('asks to write when there are no transfer details', async () => {
    mockApi(true, billing(null, null));
    renderPage();
    expect(await screen.findByText(/te enviamos los\s+datos/)).toBeTruthy();
  });

  it('sends a custom plan request, preselected from the link', async () => {
    mockApi(false, billing(null, null));
    mockedApi.post.mockResolvedValue({ data: undefined });
    renderPage('/entrenador/plan?tema=CUSTOM');
    expect(await screen.findByText(/Activa el modo entrenador/)).toBeTruthy();
    expect(mockedApi.get).not.toHaveBeenCalledWith('/coach/billing');

    fireEvent.change(screen.getByLabelText('¿Cuántos alumnos llevas? (opcional)'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByLabelText('Mensaje'), {
      target: { value: '  Tengo un gimnasio ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await vi.waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/contact-requests', {
        topic: 'CUSTOM',
        message: 'Tengo un gimnasio',
        desiredClients: 80,
      }),
    );
    expect(await screen.findByText(/Mensaje enviado/)).toBeTruthy();
  });
});
