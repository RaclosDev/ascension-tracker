import { confirmAction } from '../lib/confirmation';
vi.mock('../lib/confirmation', () => ({ confirmAction: vi.fn().mockResolvedValue(true) }));
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'coach@library.test' } }),
}));
vi.mock('../components/coach/CoachWorkspace', () => ({
  CoachWorkspace: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CoachPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
import api from '../api/client';
import CoachNutritionTemplateEditorPage from '../pages/CoachNutritionTemplateEditorPage';
import { NutritionTemplatePicker } from '../components/coach/NutritionTemplatePicker';
import { clearSessionDrafts } from '../lib/sessionDrafts';
import type { NutritionTemplate } from '../lib/coach/nutritionTemplates';
const mocked = vi.mocked(api);
const original: NutritionTemplate = {
  id: 't1',
  name: 'Base',
  version: 1,
  updatedAt: '2026-11-11T10:00:00Z',
  content: {
    training: { protein: 180, carbs: 300, fat: 70, kcal: 2550 },
    rest: { protein: 180, carbs: 150, fat: 80, kcal: 2040 },
    notes: 'Adaptar',
    meals: [],
  },
};
function editor() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/entrenador/pautas/t1']}>
        <Routes>
          <Route
            path="/entrenador/pautas/:templateId"
            element={<CoachNutritionTemplateEditorPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
describe('Biblioteca de pautas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearSessionDrafts();
    sessionStorage.clear();
    vi.mocked(confirmAction).mockResolvedValue(true);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('recovers drafts after failure and offers a new copy when the saved version changes', async () => {
    let current = original;
    mocked.get.mockImplementation(async (url) => ({
      data: url === '/coach/recipes' ? [] : current,
    }));
    mocked.put.mockRejectedValue({ response: { data: { message: 'La pauta ha cambiado.' } } });
    const first = editor();
    await screen.findByLabelText('Nombre de la pauta');
    fill('Proteína día de entreno', '190');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar en biblioteca' }));
    expect(await screen.findByText('La pauta ha cambiado.')).toBeTruthy();
    expect(mocked.put).toHaveBeenCalledWith(
      '/coach/nutrition-templates/t1',
      expect.objectContaining({ expectedVersion: 1 }),
    );
    first.unmount();
    current = { ...original, version: 2 };
    editor();
    await screen.findByText(/La versión guardada ha cambiado/);
    expect((screen.getByLabelText('Proteína día de entreno') as HTMLInputElement).value).toBe(
      '190',
    );
    expect(
      (screen.getByRole('button', { name: 'Guardar en biblioteca' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    mocked.post.mockRejectedValue(new Error('Offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar como nueva' }));
    await vi.waitFor(() =>
      expect(mocked.post).toHaveBeenCalledWith(
        '/coach/nutrition-templates',
        expect.objectContaining({
          expectedVersion: null,
          plan: expect.objectContaining({ training: expect.objectContaining({ protein: 190 }) }),
        }),
      ),
    );
  });
  it('requires unavailable recipes to be replaced or removed before saving', async () => {
    const missing: NutritionTemplate = {
      ...original,
      content: {
        ...original.content,
        meals: [
          {
            dayType: 'TRAINING',
            slotName: 'Comida',
            recipeId: 'gone',
            name: 'Bowl',
            description: null,
            servings: 1,
            protein: 40,
            carbs: 50,
            fat: 10,
            kcal: 450,
          },
        ],
      },
    };
    mocked.get.mockImplementation(async (url) => ({
      data: url === '/coach/recipes' ? [] : missing,
    }));
    editor();
    await screen.findByText(/Hay comidas sin receta disponible/);
    fill('Nombre de la pauta', 'Adaptada');
    expect(
      (screen.getByRole('button', { name: 'Guardar en biblioteca' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByRole('option', { name: 'Receta no disponible' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Quitar la comida 1/ }));
    expect(
      (screen.getByRole('button', { name: 'Guardar en biblioteca' }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });
  it('loads the library on demand and copies only after confirming replacement of a draft', async () => {
    const copy = vi.fn();
    mocked.get.mockImplementation(async (url) => ({
      data: url === '/coach/nutrition-templates' ? [original] : original,
    }));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <NutritionTemplatePicker onCopy={copy} dirty disabled={false} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(mocked.get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Usar pauta de biblioteca' }));
    await screen.findByLabelText('Pauta de biblioteca');
    fill('Pauta de biblioteca', 't1');
    await screen.findByRole('button', { name: 'Copiar al borrador' });
    vi.mocked(confirmAction).mockResolvedValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar al borrador' }));
    expect(copy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar al borrador' }));
    await vi.waitFor(() =>
      expect(copy).toHaveBeenCalledWith(
        expect.objectContaining({ training: { protein: '180', carbs: '300', fat: '70' } }),
      ),
    );
    expect(mocked.post).not.toHaveBeenCalled();
    expect(mocked.put).not.toHaveBeenCalled();
  });
  it('keeps the editor available when recipes fail and there are no meals', async () => {
    mocked.get.mockImplementation(async (url) => {
      if (url === '/coach/recipes') throw new Error('Offline');
      return { data: original };
    });
    editor();
    await screen.findByText(/No se pudieron cargar tus recetas/);
    fill('Nombre de la pauta', 'Solo objetivos');
    expect(
      (screen.getByRole('button', { name: 'Guardar en biblioteca' }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });
});
