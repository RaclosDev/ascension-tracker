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
import PlannedMealsCard, { targetMeal } from '../components/coach/PlannedMealsCard';
import type { CoachRecipe } from '../lib/coach/coachRecipes';
import type { NutritionPlan, PlannedMeal } from '../lib/coach/nutritionPlan';
import type { Meal } from '../types/api';
import { clearSessionDrafts } from '../lib/sessionDrafts';

const mockedApi = vi.mocked(api);

const bowl: CoachRecipe = {
  id: 'r1',
  name: 'Bowl de pollo',
  description: null,
  kcal: 533,
  protein: 45,
  carbs: 60,
  fat: 12.5,
  updatedAt: '2026-11-05T10:00:00Z',
};

const meal = (over: Partial<PlannedMeal>): PlannedMeal => ({
  dayType: 'TRAINING',
  slotName: 'Comida',
  recipeId: 'r1',
  name: 'Bowl de pollo',
  description: 'Arroz y pollo',
  servings: 1.5,
  kcal: 799,
  protein: 67.5,
  carbs: 90,
  fat: 18.8,
  ...over,
});

const plan = (meals: PlannedMeal[]): NutritionPlan => ({
  id: 'p1',
  coach: { name: 'Laura', email: 'laura@x.test', picture: null },
  training: { kcal: 2550, protein: 180, carbs: 300, fat: 70 },
  rest: { kcal: 2040, protein: 180, carbs: 150, fat: 80 },
  notes: null,
  createdAt: '2026-11-05T10:00:00Z',
  meals,
});

const diary: Meal[] = [
  { name: 'Desayuno', mealKey: 'breakfast' },
  { name: 'Comida', mealKey: 'lunch' },
  { name: 'Cena', mealKey: 'dinner' },
];

function wrap(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

const routes = (byUrl: Record<string, unknown>) =>
  mockedApi.get.mockImplementation(async (url: string) => ({ data: byUrl[url] }));

describe('Comidas pautadas', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    clearSessionDrafts();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('maps a slot to the diary meal by name, else by position', () => {
    expect(targetMeal(' cena ', 0, diary).index).toBe(2);
    expect(targetMeal('Merienda', 1, diary).meal?.mealKey).toBe('lunch');
    expect(targetMeal('Recena', 7, diary).index).toBe(2);
  });

  it('lets the coach prescribe meals from the recipe library', async () => {
    routes({
      '/coach/clients/l1/nutrition-plan': plan([meal({ dayType: 'REST', recipeId: null })]),
      '/coach/recipes': [bowl],
    });
    mockedApi.post.mockResolvedValue({ data: { ...plan([]), id: 'p2' } });
    wrap(<NutritionPlanSection linkId="l1" canEdit />);

    // The deleted recipe blocks saving until the coach replaces or removes it.
    expect(
      await screen.findByText('Receta no disponible: elige otra o quita la comida.'),
    ).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Publicar pauta' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar la comida 1 día de descanso' }));
    expect(save.disabled).toBe(false);

    fireEvent.click(screen.getAllByRole('button', { name: /Añadir comida/ })[0]);
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Nombre de la comida 1 día de entreno'), {
      target: { value: ' Comida ' },
    });
    fireEvent.change(screen.getByLabelText('Receta de la comida 1 día de entreno'), {
      target: { value: 'r1' },
    });
    fireEvent.change(screen.getByLabelText('Raciones de la comida 1 día de entreno'), {
      target: { value: '1.5' },
    });
    expect(screen.getByText('799 kcal')).toBeTruthy();
    fireEvent.click(save);

    await vi.waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/clients/l1/nutrition-plan/publish', {
        expectedPlanId: 'p1',
        plan: {
          training: { protein: 180, carbs: 300, fat: 70 },
          rest: { protein: 180, carbs: 150, fat: 80 },
          notes: null,
          meals: [{ dayType: 'TRAINING', slotName: 'Comida', recipeId: 'r1', servings: 1.5 }],
        },
      }),
    );
  });

  it('logs a prescribed meal into the matching diary meal with one tap', async () => {
    routes({
      '/coaching/nutrition-plan': plan([
        meal({}),
        meal({ dayType: 'REST', slotName: 'Cena', name: 'Tortilla' }),
      ]),
    });
    mockedApi.post.mockResolvedValue({ data: {} });
    wrap(<PlannedMealsCard date="2026-11-05" dayType="TRAINING" meals={diary} />);

    expect(await screen.findByText('Bowl de pollo')).toBeTruthy();
    expect(screen.queryByText('Tortilla')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar Bowl de pollo' }));

    await vi.waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/nutrition/logs', {
        date: '2026-11-05',
        mealIndex: 1,
        mealKey: 'lunch',
        product: 'Bowl de pollo · 1,5 raciones',
        quantity: 150,
        kcal: 799,
        protein: 67.5,
        carbs: 90,
        fat: 18.8,
      }),
    );
    const done = (await screen.findByRole('button', {
      name: 'Bowl de pollo registrado',
    })) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
  });
});
