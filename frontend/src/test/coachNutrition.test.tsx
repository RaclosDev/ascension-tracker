import { confirmAction } from '../lib/confirmation';
vi.mock('../lib/confirmation', () => ({ confirmAction: vi.fn().mockResolvedValue(true) }));
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'coach@test.example' } }),
}));

import api from '../api/client';
import { NutritionPlanSection } from '../components/coach/NutritionPlanSection';
import { CoachNutritionGate } from '../components/coach/CoachNutritionGate';
import MacroSummaryHeader from '../components/nutrition/MacroSummaryHeader';
import { scopeDisabled, withScope, type CoachPermissions } from '../lib/coach/api';
import type { NutritionPlan } from '../lib/coach/nutritionPlan';
import { clearSessionDrafts } from '../lib/sessionDrafts';

const mockedApi = vi.mocked(api);

const plan: NutritionPlan = {
  id: 'p1',
  coach: { name: 'Laura', email: 'laura@x.test', picture: null },
  training: { kcal: 2550, protein: 180, carbs: 300, fat: 70 },
  rest: { kcal: 2040, protein: 180, carbs: 150, fat: 80 },
  notes: 'Bebe agua',
  createdAt: '2026-11-05T10:00:00Z',
  meals: [],
};

function wrap(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Pauta de nutrición', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.put.mockReset();
    mockedApi.delete.mockReset();
    mockedApi.post.mockReset();
    clearSessionDrafts();
    vi.mocked(confirmAction).mockResolvedValue(true);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('ties the edit permission to seeing nutrition', () => {
    const all: CoachPermissions = {
      training: true,
      nutrition: true,
      body: true,
      editTraining: true,
      editNutrition: true,
    };
    expect(withScope(all, 'nutrition', false).editNutrition).toBe(false);
    expect(scopeDisabled({ ...all, nutrition: false }, 'editNutrition')).toBe(true);
    expect(scopeDisabled(all, 'editNutrition')).toBe(false);
  });

  it('lets the coach set targets per day type with live kcal', async () => {
    mockedApi.get.mockImplementation(async (url) => ({ data: url === '/coach/recipes' ? [] : '' }));
    mockedApi.post.mockResolvedValue({ data: plan });
    wrap(<NutritionPlanSection linkId="l1" canEdit />);

    expect(await screen.findByText('Sin pauta: tu atleta usa sus propios objetivos.')).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Publicar pauta' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fill('Proteína día de entreno', '180');
    fill('Carbohidratos día de entreno', '300');
    fill('Grasa día de entreno', '70');
    expect(screen.getByText('2550 kcal')).toBeTruthy();
    fill('Proteína día de descanso', '180');
    fill('Carbohidratos día de descanso', '150');
    fill('Grasa día de descanso', '80');
    fill('Notas para tu atleta', '  Bebe agua ');
    fireEvent.click(save);

    await vi.waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/clients/l1/nutrition-plan/publish', {
        expectedPlanId: null,
        plan: {
          training: { protein: 180, carbs: 300, fat: 70 },
          rest: { protein: 180, carbs: 150, fat: 80 },
          notes: 'Bebe agua',
          meals: [],
        },
      }),
    );
    expect(await screen.findByRole('button', { name: 'Quitar pauta' })).toBeTruthy();
  });

  it('shows the plan read-only without the edit permission', async () => {
    mockedApi.get.mockResolvedValue({ data: plan });
    wrap(<NutritionPlanSection linkId="l1" canEdit={false} />);

    expect(await screen.findByText('2550 kcal')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Publicar pauta' })).toBeNull();
    expect(screen.queryByLabelText('Proteína día de entreno')).toBeNull();
  });

  it('recovers an unpublished draft after failure and blocks it when the server version changes', async () => {
    let current = plan;
    mockedApi.get.mockImplementation(async (url) => ({
      data: url === '/coach/recipes' ? [] : current,
    }));
    mockedApi.post.mockRejectedValue({
      response: { data: { message: 'La pauta activa ha cambiado.' } },
    });
    const first = wrap(<NutritionPlanSection linkId="l1" canEdit />);
    await screen.findByLabelText('Proteína día de entreno');
    fill('Proteína día de entreno', '190');
    fireEvent.click(screen.getByRole('button', { name: 'Publicar pauta' }));
    expect(await screen.findByText('La pauta activa ha cambiado.')).toBeTruthy();
    first.unmount();
    current = { ...plan, id: 'p2', training: { ...plan.training, protein: 200 } };
    wrap(<NutritionPlanSection linkId="l1" canEdit />);
    const protein = await screen.findByLabelText('Proteína día de entreno');
    expect(protein).toHaveValue(190);
    expect(screen.getByRole('button', { name: 'Publicar pauta' })).toBeDisabled();
    expect(screen.getByText(/ha cambiado desde que empezaste este borrador/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios locales' }));
    await vi.waitFor(() => expect(protein).toHaveValue(200));
  });

  it('keeps cancelled edits and withdraws only the version the coach reviewed', async () => {
    mockedApi.get.mockImplementation(async (url) => ({
      data: url === '/coach/recipes' ? [] : plan,
    }));
    mockedApi.post.mockResolvedValue({ data: '' });
    wrap(<NutritionPlanSection linkId="l1" canEdit />);
    await screen.findByLabelText('Proteína día de entreno');
    fill('Proteína día de entreno', '190');
    vi.mocked(confirmAction).mockResolvedValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar pauta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar pauta' }));
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Proteína día de entreno')).toHaveValue(190);
    vi.mocked(confirmAction).mockResolvedValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar pauta' }));
    await vi.waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/clients/l1/nutrition-plan/p1/end'),
    );
    expect(await screen.findByText('Sin pauta: tu atleta usa sus propios objetivos.')).toBeTruthy();
  });

  it('opens archived snapshots without replacing the current editor or reading the recipe library', async () => {
    mockedApi.get.mockImplementation(async (url) => ({
      data: url.endsWith('/history')
        ? [
            {
              ...plan,
              status: 'ENDED',
              endedAt: '2026-11-06T10:00:00Z',
            },
          ]
        : url.endsWith('/history/p1')
          ? {
              ...plan,
              notes: 'Notas conservadas',
              meals: [
                {
                  dayType: 'TRAINING',
                  slotName: 'Comida',
                  recipeId: null,
                  name: 'Receta original',
                  description: 'Contenido conservado',
                  servings: 2,
                  kcal: 820,
                  protein: 60,
                  carbs: 100,
                  fat: 20,
                },
              ],
            }
          : plan,
    }));
    wrap(<NutritionPlanSection linkId="l1" canEdit={false} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historial de pautas' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ver versión' }));
    expect(await screen.findByText('Notas conservadas')).toBeTruthy();
    expect(screen.getByText('Comida: Receta original')).toBeTruthy();
    expect(mockedApi.get).not.toHaveBeenCalledWith('/coach/recipes');
    expect(screen.queryByRole('button', { name: 'Publicar pauta' })).toBeNull();
  });

  it('retries a failed initial read without presenting an empty plan', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ data: plan });
    wrap(<NutritionPlanSection linkId="l1" canEdit={false} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar pauta' }));
    expect(await screen.findByText('2550 kcal')).toBeTruthy();
    expect(screen.queryByText('Sin pauta: tu atleta usa sus propios objetivos.')).toBeNull();
  });

  it('locks the client macro editor while a plan is in force', async () => {
    mockedApi.get.mockResolvedValue({ data: plan });
    wrap(
      <CoachNutritionGate>
        <p>Editor de macros</p>
      </CoachNutritionGate>,
    );

    expect(await screen.findByText(/Pautado por Laura/)).toBeTruthy();
    expect(screen.queryByText('Editor de macros')).toBeNull();
    expect(screen.getByText('2040 kcal')).toBeTruthy();
    expect(mockedApi.get).toHaveBeenCalledWith('/coaching/nutrition-plan');
  });

  it('keeps the editor without a plan and labels coach targets in the diary', async () => {
    mockedApi.get.mockResolvedValue({ data: '' });
    wrap(
      <CoachNutritionGate>
        <p>Editor de macros</p>
      </CoachNutritionGate>,
    );
    expect(await screen.findByText('Editor de macros')).toBeTruthy();

    cleanup();
    render(
      <MacroSummaryHeader
        consumed={{ kcal: 0, protein: 0, carbs: 0, fat: 0 }}
        macros={{
          kcal: 2550,
          protein: 180,
          carbs: 300,
          fat: 70,
          coachName: 'Laura',
          dayType: 'TRAINING',
        }}
      />,
    );
    expect(screen.getByText(/Pautado por Laura · Día de\s+entreno/)).toBeTruthy();
  });

  it('does not unlock personal targets during a failed plan read and allows retry', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ data: plan });
    wrap(
      <CoachNutritionGate>
        <p>Editor de macros</p>
      </CoachNutritionGate>,
    );
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('Editor de macros')).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar objetivos' }));
    expect(await screen.findByText(/Pautado por Laura/)).toBeTruthy();
    expect(screen.queryByText('Editor de macros')).toBeNull();
  });
});
