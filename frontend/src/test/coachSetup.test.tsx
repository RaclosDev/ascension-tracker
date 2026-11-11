import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ClientSetupForm, ClientSetupSummary } from '../components/coach/ClientSetup';
import { emptySetup } from '../lib/coach/setup';
import type { CoachClient } from '../lib/coach/api';
import api from '../api/client';
import toast from 'react-hot-toast';

vi.mock('../api/client', () => ({ default: { put: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
const link: CoachClient = {
  linkId: 'link1',
  client: { name: 'Ana', email: 'ana@example.com', picture: null },
  since: '2026-11-01',
  permissions: {
    training: false,
    nutrition: false,
    body: false,
    editTraining: false,
    editNutrition: false,
  },
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Servicio e incorporación', () => {
  it('distinguishes unconfigured services and missing consent without accessing private areas', () => {
    const view = render(
      <MemoryRouter>
        <ClientSetupSummary link={link} href="/gestion" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Configurar servicio' })).toBeDefined();
    view.rerender(
      <MemoryRouter>
        <ClientSetupSummary link={{ ...link, setup: emptySetup() }} href="/gestion" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Falta autorización para entrenamiento/)).toBeDefined();
    expect(screen.getByText(/Incorporación pendiente/)).toBeDefined();
  });

  it('saves agreed services separately from permissions and retains failed edits for retry', async () => {
    vi.mocked(api.put)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: emptySetup() });
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={cache}>
        <ClientSetupForm link={link} />
      </QueryClientProvider>,
    );
    const goal = screen.getByLabelText('Objetivo del servicio (opcional)');
    fireEvent.change(goal, { target: { value: 'Ganar fuerza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect((goal as HTMLTextAreaElement).value).toBe('Ganar fuerza');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(api.put).toHaveBeenLastCalledWith('/coach/clients/link1/setup', {
      ...emptySetup(),
      goal: 'Ganar fuerza',
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Entrenamiento' }));
    expect(
      (screen.getByRole('button', { name: 'Guardar servicio' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
