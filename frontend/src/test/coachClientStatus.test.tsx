import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
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
        status('a', {}),
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

    await screen.findByText('Necesita atención');
    const items = within(screen.getByText('Bruno').closest('ul')!).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('.font-bold')?.textContent)).toEqual([
      'Bruno',
      'Carla',
      'Ana',
    ]);
    expect(items[0]).toHaveTextContent('9 días sin registrar nada');
    expect(items[0]).toHaveTextContent('2 check-ins por responder');
    expect(items[1]).toHaveTextContent('Vigilar');
    expect(items[2]).toHaveTextContent('Al día');
  });

  it('describes every reason in plain words', () => {
    expect(signalText({ reason: 'CHECKIN_MISSING', level: 'RED', value: 2 })).toBe(
      '2 semanas sin check-in',
    );
    expect(signalText({ reason: 'FEW_FOOD_LOGS', level: 'AMBER', value: 3 })).toBe(
      'Comida registrada 3 de 7 días',
    );
  });
});
