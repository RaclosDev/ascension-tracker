import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

for (const width of [390, 1440]) {
  test(`coach reads SBD progress and retries failed requests at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    let failHistory = true;
    const now = Date.now();
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'clients/l1')
        return route.fulfill({
          json: {
            linkId: 'l1',
            client: { name: 'Ana García', email: 'ana@example.test' },
            since: '2026-11-01T10:00:00Z',
            permissions: {
              training: true,
              editTraining: false,
              nutrition: false,
              body: false,
              editNutrition: false,
            },
          },
        });
      if (path === 'clients/l1/powerlifting')
        return route.fulfill({
          json: {
            linkId: 'l1',
            version: 1,
            updatedAt: null,
            profile: {
              enabled: true,
              equipment: 'CLASSIC',
              federation: '',
              trainingMax: { squat: 100, bench: null, deadlift: null },
              marks: [],
              notes: '',
            },
          },
        });
      if (path === 'clients/l1/workouts/recent') {
        if (failHistory)
          return route.fulfill({ status: 503, json: { message: 'Temporalmente no disponible' } });
        return route.fulfill({
          json: [
            {
              id: 'recent',
              name: 'Sentadilla',
              startedAt: now - 86400000,
              finishedAt: now - 86000000,
              exercises: [
                {
                  id: 'e1',
                  exerciseId: 'ex-0043',
                  notes: '',
                  sets: [
                    {
                      id: 's1',
                      weight: '100',
                      reps: '5',
                      rpe: '8',
                      completed: true,
                      type: 'normal',
                    },
                    { id: 's2', weight: '110', reps: '1', completed: true, type: 'normal' },
                  ],
                },
              ],
            },
            {
              id: 'old',
              name: 'Sentadilla',
              startedAt: now - 50 * 86400000,
              finishedAt: now - 50 * 86400000 + 1000,
              exercises: [
                {
                  id: 'e2',
                  exerciseId: 'ex-0043',
                  notes: '',
                  sets: [{ id: 's3', weight: '50', reps: '10', completed: true, type: 'normal' }],
                },
              ],
            },
          ],
        });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/alumnos/l1?seccion=powerlifting&vista=seguimiento');
    await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toBeVisible();
    await expect(page.getByText('Sin series válidas en este periodo.')).toHaveCount(0);
    failHistory = false;
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    const squat = page.getByRole('region', { name: 'Sentadilla', exact: true });
    await expect(squat.getByText('1110 kg', { exact: true })).toBeVisible();
    await expect(squat.getByText(/110 % del máximo de trabajo actual/)).toBeVisible();
    await page.getByRole('combobox', { name: 'Periodo de seguimiento' }).selectOption('4');
    await expect(squat.getByText('610 kg', { exact: true })).toBeVisible();
    await expect(squat.getByText('8 / 10 · 1 de 2 series', { exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Levantamiento', exact: true }).selectOption('bench');
    await expect(page.getByText('No hay carga registrada para este levantamiento.')).toBeVisible();
    await page.getByRole('combobox', { name: 'Levantamiento', exact: true }).selectOption('squat');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page
      .getByRole('heading', { name: 'Seguimiento de los tres básicos' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('powerlifting-progress.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
}
