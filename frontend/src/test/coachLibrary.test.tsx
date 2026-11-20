import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import api from '../api/client';
import CoachPlanningPage from '../pages/CoachPlanningPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
const mockedApi = vi.mocked(api);
vi.mock('../components/coach/tour/CoachTourWelcome', () => ({ default: () => null }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'coach@test' } }) }));

const program = (id: string, name: string, weeks: number, dayCount: number, status = 'READY') => ({
  id,
  name,
  weeks,
  dayCount,
  status,
  updatedAt: '2026-11-10T10:00:00Z',
});
const client = (linkId: string, name: string, editTraining: boolean, editNutrition: boolean) => ({
  linkId,
  client: { name, email: `${linkId}@test`, picture: null },
  permissions: { training: true, nutrition: true, body: true, editTraining, editNutrition },
  since: '2026-11-01T10:00:00Z',
});

function mockData() {
  mockedApi.post.mockResolvedValue({ data: {} });
  mockedApi.get.mockImplementation(async (url) => {
    if (url === '/coach/profile') return { data: { coach: true } };
    if (url === '/coach/programs')
      return {
        data: [
          program('s1', 'Torso rápido', 1, 1),
          program('s2', 'Pierna en borrador', 1, 1, 'DRAFT'),
          program('w1', 'Semana de descarga', 1, 4),
          program('p1', 'Fuerza 8 semanas', 8, 32),
        ],
      };
    if (url === '/coach/library-items')
      return {
        data: [{ type: 'PROGRAM', id: 'w1', category: 'BLOCK', favorite: false, tags: [] }],
      };
    if (url === '/coach/nutrition-templates')
      return {
        data: [{ id: 'n1', name: 'Volumen', trainingKcal: 2900, restKcal: 2500, version: 1 }],
      };
    if (url === '/coach/recipes')
      return { data: [{ id: 'r1', name: 'Avena', kcal: 420, protein: 30, carbs: 50, fat: 10 }] };
    if (url === '/coach/clients')
      return { data: [client('l1', 'Bruno', true, false), client('l0', 'Ángela', false, true)] };
    return { data: [] };
  });
}

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderAt(path = '/entrenador/planificacion') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/entrenador/planificacion" element={<CoachPlanningPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Biblioteca del entrenador', () => {
  it('groups resources into tabs and only offers to apply what is ready', async () => {
    mockData();
    renderAt();
    expect(await screen.findByRole('link', { name: /Torso rápido/ })).toHaveAttribute(
      'href',
      '/entrenador/programas/s1',
    );
    expect(screen.getByRole('tab', { name: /Sesiones/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Sesiones/ })).toHaveTextContent('2');
    expect(screen.getByRole('tab', { name: /Programas/ })).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: /Nueva sesión/ })).toHaveAttribute(
      'href',
      '/entrenador/programas/nuevo?tipo=sesion',
    );
    expect(screen.getByRole('button', { name: 'Aplicar Torso rápido a un atleta' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Aplicar Pierna en borrador a un atleta' }),
    ).toBeNull();
    expect(screen.getByText(/Los borradores se pueden aplicar/)).toBeVisible();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'pierna' } });
    expect(screen.queryByRole('link', { name: /Torso rápido/ })).toBeNull();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(screen.getByText('Nada coincide con «zzz».')).toBeVisible();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Duplicar Torso rápido' }));
    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/coach/programs/s1/duplicate'),
    );

    fireEvent.keyDown(screen.getByRole('tab', { name: /Sesiones/ }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /Recetas/ })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText(/420 kcal/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Aplicar/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Gestionar recetas/ })).toBeVisible();
  });

  it('applies a program only to athletes who allow training edits', async () => {
    mockData();
    renderAt('/entrenador/planificacion?pestana=programas');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Aplicar Fuerza 8 semanas a un atleta' }),
    );
    const dialog = await screen.findByRole('dialog', { hidden: true });
    expect(await within(dialog).findByRole('button', { name: 'Bruno', hidden: true })).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'Ángela', hidden: true })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Bruno', hidden: true }));
    expect(screen.getByTestId('where')).toHaveTextContent(
      '/entrenador/atletas/l1?seccion=entrenamiento&programa=p1',
    );
  });

  it('applies a nutrition template to athletes who allow nutrition edits', async () => {
    mockData();
    renderAt('/entrenador/planificacion?pestana=nutricion');
    fireEvent.click(await screen.findByRole('button', { name: 'Aplicar Volumen a un atleta' }));
    const dialog = await screen.findByRole('dialog', { hidden: true });
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Ángela', hidden: true }));
    expect(screen.getByTestId('where')).toHaveTextContent(
      '/entrenador/atletas/l0?seccion=nutricion&pauta=n1',
    );
  });
});
