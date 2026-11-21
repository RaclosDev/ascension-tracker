import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NutritionDiary } from '../components/coach/NutritionDiary';
import api from '../api/client';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));
const mockedApi = vi.mocked(api, true);

const target = { kcal: 2600, protein: 180, carbs: 300, fat: 75 };
const day = (date: string, kcal: number | null, onTarget: boolean) => ({
  date,
  dayType: 'TRAINING',
  target,
  intake: kcal === null ? null : { kcal, protein: 170, carbs: 280, fat: 70 },
  onTarget,
});
const week = {
  weekStart: '2026-11-09',
  plannedDays: 7,
  loggedDays: 2,
  onTargetDays: 1,
  kcalPct: 97,
  proteinPct: 95,
  days: [
    day('2026-11-09', 2580, true),
    day('2026-11-10', null, false),
    day('2026-11-11', 1200, false),
  ],
};
const log = (mealIndex: number, mealName: string, product: string, kcal: number) => ({
  id: mealIndex * 10 + kcal,
  mealIndex,
  mealKey: `m${mealIndex}`,
  mealName,
  product,
  quantity: 100,
  kcal,
  protein: 10,
  carbs: 20,
  fat: 5,
});

function mount() {
  mockedApi.get.mockImplementation(async (url: string) => {
    if (url.endsWith('nutrition-plan/adherence')) return { data: [week] };
    if (url.includes('calories/weekly')) return { data: [] };
    if (url.includes('logs?date=2026-11-11'))
      return { data: [log(0, 'Desayuno', 'Avena', 300), log(1, 'Comida', 'Arroz', 400)] };
    return { data: [] };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <NutritionDiary linkId="l1" />
    </QueryClientProvider>,
  );
}

describe('Diario de comidas del atleta', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-11T12:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows each day against its target and today as still in progress', async () => {
    mount();
    expect(await screen.findByText(/1 de 2 días registrados en objetivo/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Lunes 9 de noviembre/ })).toHaveAttribute(
      'data-state',
      'on',
    );
    expect(screen.getByRole('button', { name: /Martes 10 de noviembre/ })).toHaveAttribute(
      'data-state',
      'empty',
    );
    const today = screen.getByRole('button', { name: /Miércoles 11 de noviembre/ });
    expect(today).toHaveAttribute('data-state', 'today');
    expect(today).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Jueves 12 de noviembre/ })).toHaveAttribute(
      'data-state',
      'future',
    );
    expect(screen.getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();
  });

  it('opens a day by meals and says when nothing was logged', async () => {
    mount();
    const open = screen.getByRole('region', { name: 'Día abierto' });
    expect(await within(open).findByRole('heading', { name: 'Desayuno' })).toBeTruthy();
    expect(within(open).getByText('Arroz')).toBeTruthy();
    expect(within(open).getByText('700')).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: /Martes 10 de noviembre/ }));
    expect(await screen.findByText(/Nada registrado ese día/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Jueves 12 de noviembre/ }));
    expect(screen.getByText('Aún no ha llegado ese día.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(screen.getByText('Sin pauta ni registros esta semana')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(screen.getByText(/1 de 2 días registrados en objetivo/)).toBeTruthy();
  });
});
