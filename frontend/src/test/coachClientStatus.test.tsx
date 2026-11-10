import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import api from '../api/client';
import CoachPage from '../pages/CoachPage';
import { signalText, type ClientStatus } from '../lib/coach/clientStatus';

const mockedApi = vi.mocked(api);
const permissions = {
  training: true,
  nutrition: true,
  body: true,
  editTraining: false,
  editNutrition: false,
};
const client = (linkId: string, name: string) => ({
  linkId,
  client: { name, email: `${linkId}@test`, picture: null },
  permissions,
  since: '2026-09-01T10:00:00Z',
});
const status = (linkId: string, over: Partial<ClientStatus>): ClientStatus => ({
  linkId,
  level: 'GREEN',
  lastActivity: '2026-11-04',
  pendingReplies: 0,
  weightChange: null,
  signals: [],
  ...over,
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Semáforo de alumnos', () => {
  it('puts the clients who need attention first and says why', async () => {
    const responses: Record<string, unknown> = {
      '/coach/profile': { coach: true },
      '/coach/checkin-template': { questions: ['¿Qué tal la semana?'], custom: false },
      '/coach/clients': [client('a', 'Ana'), client('b', 'Bruno'), client('c', 'Carla')],
      '/coach/clients/status': [
        status('a', { weightChange: -0.7 }),
        status('b', {
          level: 'RED',
          signals: [{ reason: 'INACTIVE', level: 'RED', value: 9 }],
          pendingReplies: 2,
        }),
        status('c', {
          level: 'AMBER',
          signals: [{ reason: 'CHECKIN_MISSING', level: 'AMBER', value: 1 }],
        }),
      ],
    };
    mockedApi.get.mockImplementation(async (url: string) => ({ data: responses[url] ?? [] }));
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <CoachPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findAllByText('Necesita atención');
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.map((tr) => within(tr).getByRole('link').textContent)).toEqual([
      'Bruno',
      'Carla',
      'Ana',
    ]);
    expect(rows[0]).toHaveTextContent('9 días sin registrar nada');
    expect(rows[0]).toHaveTextContent('2 por responder');
    expect(rows[1]).toHaveTextContent('Vigilar');
    expect(rows[2]).toHaveTextContent('Al día');
    expect(rows[2]).toHaveTextContent('-0,7 kg');

    const counters = screen.getByText('Necesitan atención').closest('dl')!;
    expect(counters).toHaveTextContent('Necesitan atención2');
    expect(counters).toHaveTextContent('Check-ins por responder2');
    expect(counters).toHaveTextContent('Al día1 de 3');

    fireEvent.click(screen.getByRole('button', { name: /Check-in pendiente/ }));
    const filtered = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(filtered.map((tr) => within(tr).getByRole('link').textContent)).toEqual(['Bruno']);
  });

  it('describes every reason in plain words', () => {
    expect(signalText({ reason: 'CHECKIN_MISSING', level: 'RED', value: 2 })).toBe(
      '2 semanas sin check-in',
    );
    expect(signalText({ reason: 'FEW_FOOD_LOGS', level: 'AMBER', value: 3 })).toBe(
      'Comida registrada 3 de 7 días',
    );
    expect(signalText({ reason: 'WEIGHT_STALLED', level: 'AMBER', value: 3 })).toBe(
      'Peso estancado en las últimas 3 semanas',
    );
  });
});
