import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import api from '../api/client';
import CoachRecipesPage from '../pages/CoachRecipesPage';
import type { CoachRecipe } from '../lib/coach/coachRecipes';

const mockedApi = vi.mocked(api);

const bowl: CoachRecipe = {
  id: 'r1',
  name: 'Bowl de pollo',
  description: 'Arroz y pollo',
  kcal: 533,
  protein: 45,
  carbs: 60,
  fat: 12.5,
  updatedAt: '2026-11-05T10:00:00Z',
};

function renderPage(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/entrenador/recetas" element={<CoachRecipesPage />} />
          <Route path="/entrenador/planificacion" element={<p>Biblioteca</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Editor de recetas del entrenador', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
  });
  afterEach(cleanup);

  it('sends the coach back to the library when no recipe is named', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    renderPage('/entrenador/recetas');
    expect(await screen.findByText('Biblioteca')).toBeTruthy();
  });

  it('creates a recipe with live kcal per serving', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    mockedApi.post.mockResolvedValue({ data: bowl });
    renderPage('/entrenador/recetas?nueva=1');

    const save = screen.getByRole('button', { name: 'Guardar receta' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fill('Nombre', '  Bowl de pollo ');
    fill('Ingredientes y preparación', ' ');
    fill('Proteína por ración', '45');
    fill('Carbohidratos por ración', '60');
    fill('Grasa por ración', '12.5');
    expect(screen.getByText('533 kcal por ración')).toBeTruthy();
    fireEvent.click(save);

    await vi.waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/recipes', {
        name: 'Bowl de pollo',
        description: null,
        protein: 45,
        carbs: 60,
        fat: 12.5,
      }),
    );
    expect(await screen.findByText('Biblioteca')).toBeTruthy();
  });

  it('edits an existing recipe', async () => {
    mockedApi.get.mockResolvedValue({ data: [bowl] });
    mockedApi.put.mockResolvedValue({ data: bowl });
    renderPage('/entrenador/recetas?editar=r1');

    expect(((await screen.findByLabelText('Grasa por ración')) as HTMLInputElement).value).toBe(
      '12.5',
    );
    fill('Grasa por ración', '10');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }));
    await vi.waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith('/coach/recipes/r1', {
        name: 'Bowl de pollo',
        description: 'Arroz y pollo',
        protein: 45,
        carbs: 60,
        fat: 10,
      }),
    );
  });
});
