import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ logout: vi.fn() }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import CoachClientsPage from '../pages/CoachClientsPage';
import InvitationPage from '../pages/InvitationPage';
import OnboardingScreen from '../components/OnboardingScreen';
import { rememberPendingInvitation } from '../lib/coach/api';
import { emptySetup } from '../lib/coach/setup';

const TOKEN = 'b'.repeat(43);
const mockedApi = vi.mocked(api);
const coach = { name: 'Laura Coach', email: 'laura@example.com', picture: null };
const trainingOnly = {
  training: true,
  nutrition: false,
  body: false,
  editTraining: true,
  editNutrition: false,
};
const profile = {
  sex: 'F',
  age: 31,
  heightCm: 165,
  startWeight: 62.5,
  goalWeight: 58,
  activityFactor: 1.55,
  appModules: 'TRAINING_BODY',
};

function wrap(ui: ReactNode, path = '/') {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Invitación con datos del entrenador', () => {
  it('lets the coach name the client, say what to ask for and fill in their details', async () => {
    const responses: Record<string, unknown> = {
      '/coach/profile': { coach: true },
      '/coach/checkin-template': { questions: [], custom: false },
      '/coach/invitations': [
        {
          id: 'i1',
          clientName: 'Marta',
          permissions: trainingOnly,
          prefilled: true,
          createdAt: '2026-11-10T10:00:00Z',
          expiresAt: '2026-11-17T10:00:00Z',
        },
      ],
    };
    mockedApi.get.mockImplementation(async (url: string) => ({ data: responses[url] ?? [] }));
    mockedApi.post.mockResolvedValue({ data: { token: TOKEN } });
    wrap(<CoachClientsPage />);

    expect(await screen.findByText('Marta')).toBeDefined();
    expect(screen.getByText(/datos rellenados/)).toBeDefined();
    fireEvent.click(screen.getAllByRole('button', { name: /Invitar alumno/ })[0]);

    fireEvent.change(screen.getByLabelText(/Nombre del alumno/), {
      target: { value: '  Ana López ' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /Yo ahora/ }));
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'F' } });
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '31' } });
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '62.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear enlace de invitación' }));

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/invitations', {
        clientName: 'Ana López',
        permissions: trainingOnly,
        setup: emptySetup(),
        profile: {
          sex: 'F',
          age: 31,
          heightCm: null,
          startWeight: 62.5,
          goalWeight: null,
          activityFactor: null,
          appModules: 'FULL',
        },
      }),
    );
    expect(
      (await screen.findByLabelText<HTMLInputElement>('Enlace de invitación')).value,
    ).toContain(TOKEN);
  });

  it('starts the client from what the coach asked for', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        coach,
        expiresAt: '2026-11-17T00:00:00Z',
        alreadyLinked: false,
        clientName: null,
        requested: trainingOnly,
        profile: null,
      },
    });
    mockedApi.post.mockResolvedValue({ data: {} });
    wrap(
      <Routes>
        <Route path="/invitacion/:token" element={<InvitationPage />} />
        <Route path="/settings" element={<p>ajustes</p>} />
      </Routes>,
      `/invitacion/${TOKEN}`,
    );

    const accept = await screen.findByRole('button', { name: 'Aceptar' });
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: /^Entrenamiento/ }).checked).toBe(
      true,
    );
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: /^Cuerpo/ }).checked).toBe(false);
    fireEvent.click(accept);
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith(
        `/coaching/invitations/${TOKEN}/accept`,
        trainingOnly,
      ),
    );
  });

  it('lets an invited client whose coach filled in the details start with one tap', async () => {
    rememberPendingInvitation(TOKEN);
    mockedApi.get.mockResolvedValue({
      data: {
        coach,
        expiresAt: '2026-11-17T00:00:00Z',
        alreadyLinked: false,
        clientName: 'Ana',
        requested: trainingOnly,
        profile,
      },
    });
    mockedApi.put.mockResolvedValue({ data: {} });
    mockedApi.post.mockResolvedValue({ data: {} });
    const onComplete = vi.fn();
    wrap(<OnboardingScreen onComplete={onComplete} />);

    expect(await screen.findByText(/Laura Coach ya ha rellenado tus datos/)).toBeDefined();
    expect(screen.getByText('165 cm')).toBeDefined();
    expect(screen.getByText('Moderado')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(`/invitacion/${TOKEN}`));
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/settings',
      expect.objectContaining({
        sex: 'F',
        age: 31,
        heightCm: 165,
        startWeight: 62.5,
        goalWeight: 58,
        activityFactor: 1.55,
        appModules: 'TRAINING_BODY',
      }),
    );
    expect(mockedApi.post).toHaveBeenCalledWith('/nutrition/meals/reset');
  });

  it('keeps the usual onboarding, already filled in, when the client wants to change something', async () => {
    rememberPendingInvitation(TOKEN);
    mockedApi.get.mockResolvedValue({
      data: {
        coach,
        expiresAt: '2026-11-17T00:00:00Z',
        alreadyLinked: false,
        clientName: null,
        requested: trainingOnly,
        profile,
      },
    });
    wrap(<OnboardingScreen onComplete={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar datos' }));
    expect(screen.queryByRole('button', { name: 'Empezar' })).toBeNull();
    expect(mockedApi.put).not.toHaveBeenCalled();
  });
});
