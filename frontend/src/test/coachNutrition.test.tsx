import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import { NutritionPlanSection } from '../components/coach/NutritionPlanSection';
import { CoachNutritionGate } from '../components/coach/CoachNutritionGate';
import MacroSummaryHeader from '../components/nutrition/MacroSummaryHeader';
import { scopeDisabled, withScope, type CoachPermissions } from '../lib/coach/api';
import type { NutritionPlan } from '../lib/coach/nutritionPlan';

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
  });
  afterEach(cleanup);

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
    mockedApi.get.mockResolvedValue({ data: '' });
    mockedApi.put.mockResolvedValue({ data: plan });
    wrap(<NutritionPlanSection linkId="l1" canEdit />);

    expect(await screen.findByText('Sin pauta: tu alumno usa sus propios objetivos.')).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Guardar pauta' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fill('Proteína día de entreno', '180');
    fill('Carbohidratos día de entreno', '300');
    fill('Grasa día de entreno', '70');
    expect(screen.getByText('2550 kcal')).toBeTruthy();
    fill('Proteína día de descanso', '180');
    fill('Carbohidratos día de descanso', '150');
    fill('Grasa día de descanso', '80');
    fill('Notas para tu alumno', '  Bebe agua ');
    fireEvent.click(save);

    await vi.waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coach/clients/l1/nutrition-plan', {
        training: { protein: 180, carbs: 300, fat: 70 },
        rest: { protein: 180, carbs: 150, fat: 80 },
        notes: 'Bebe agua',
        meals: [],
      }),
    );
    expect(await screen.findByRole('button', { name: 'Quitar pauta' })).toBeTruthy();
  });

  it('shows the plan read-only without the edit permission', async () => {
    mockedApi.get.mockResolvedValue({ data: plan });
    wrap(<NutritionPlanSection linkId="l1" canEdit={false} />);

    expect(await screen.findByText('2550 kcal')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar pauta' })).toBeNull();
    expect(screen.getByLabelText('Proteína día de entreno').matches(':disabled')).toBe(true);
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
});
