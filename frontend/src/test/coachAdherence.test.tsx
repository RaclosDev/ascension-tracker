import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import api from '../api/client';
import { NutritionAdherenceSection } from '../components/coach/NutritionAdherenceSection';
import type { AdherenceWeek } from '../lib/coach/nutritionAdherence';

const mockedApi = vi.mocked(api);
const rest = { kcal: 2040, protein: 180, carbs: 150, fat: 80 };

const week = (over: Partial<AdherenceWeek>): AdherenceWeek => ({
  weekStart: '2026-10-26',
  plannedDays: 0,
  loggedDays: 0,
  onTargetDays: 0,
  kcalPct: null,
  proteinPct: null,
  days: [],
  ...over,
});

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NutritionAdherenceSection linkId="l1" />
    </QueryClientProvider>,
  );
}

describe('Adherencia a la pauta', () => {
  afterEach(() => {
    cleanup();
    mockedApi.get.mockReset();
  });

  it('shows each week, newest first, with its days on and off target', async () => {
    mockedApi.get.mockResolvedValue({
      data: [
        week({}),
        week({
          weekStart: '2026-11-02',
          plannedDays: 3,
          loggedDays: 2,
          onTargetDays: 1,
          kcalPct: 92,
          proteinPct: 88,
          days: [
            { date: '2026-11-02', dayType: null, target: null, intake: null, onTarget: false },
            {
              date: '2026-11-03',
              dayType: 'REST',
              target: rest,
              intake: { kcal: 2000, protein: 170, carbs: 150, fat: 80 },
              onTarget: true,
            },
            {
              date: '2026-11-04',
              dayType: 'REST',
              target: rest,
              intake: { kcal: 1500, protein: 120, carbs: 100, fat: 60 },
              onTarget: false,
            },
            { date: '2026-11-05', dayType: 'REST', target: rest, intake: null, onTarget: false },
          ],
        }),
      ],
    });
    renderSection();

    expect(await screen.findByText('1 de 3 días en objetivo · 2 registrados')).toBeTruthy();
    expect(screen.getByText('kcal 92 % · proteína 88 %')).toBeTruthy();
    expect(screen.getByText('Sin pauta')).toBeTruthy();
    expect(mockedApi.get).toHaveBeenCalledWith('/coach/clients/l1/nutrition-plan/adherence', {
      params: { weeks: 4 },
    });
    expect(screen.getByLabelText('lunes 2: sin pauta')).toBeTruthy();
    expect(
      screen.getByLabelText('martes 3: en objetivo (2000 de 2040 kcal, 170 de 180 g de proteína)'),
    ).toBeTruthy();
    expect(screen.getByLabelText(/^miércoles 4: fuera de objetivo/)).toBeTruthy();
    expect(screen.getByLabelText('jueves 5: sin registro')).toBeTruthy();
    const rows = screen.getAllByRole('listitem').filter((li) => li.className.includes('border-b'));
    expect(rows[0].textContent).toContain('2 nov');
  });

  it('says there is nothing to measure without a plan', async () => {
    mockedApi.get.mockResolvedValue({ data: [week({})] });
    renderSection();
    expect(
      await screen.findByText('Sin pauta en las últimas semanas: no hay adherencia que medir.'),
    ).toBeTruthy();
  });
});
