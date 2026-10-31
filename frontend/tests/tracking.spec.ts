import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Tracking Page - Seguimiento Semanal & Deltas', () => {
  test.beforeEach(async ({ page }) => {
    // Fijar la fecha para sincronizar con la semana de fixtures (14 oct 2026)
    await page.clock.setFixedTime('2026-10-14T10:00:00Z');
  });

  test('1. Renderizado de cuadrícula semanal y estadísticas: cronología inversa, resumen y días Lun-Dom', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    // Mockeamos dos semanas consecutivas para certificar el orden cronológico inverso
    const customWeightsWeekly = [
      {
        weekStart: '2026-10-05',
        average: 82.0,
        delta: -0.8,
        entries: 4,
        days: [82.5, 82.3, 82.0, 81.8, null, null, null],
      },
      {
        weekStart: '2026-10-12',
        average: 81.2,
        delta: -0.5,
        entries: 3,
        days: [81.5, 81.2, 81.0, null, null, null, null],
      },
    ];

    await page.route('**/api/weights/weekly**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: customWeightsWeekly,
      });
    });

    await page.goto('/tracking');

    await expect(page).toHaveURL(/.*tracking.*/, { timeout: 15000 });
    const container = page.locator('.calendar-container');
    await expect(container).toBeVisible({ timeout: 15000 });

    const weekCards = page.locator('.calendar-week');
    await expect(weekCards).toHaveCount(2);

    // 1. Carga de cuadrícula ordenada cronológicamente inverso
    const firstWeek = weekCards.nth(0);
    const secondWeek = weekCards.nth(1);

    await expect(firstWeek.locator('.calendar-week-title')).toContainText('12 oct');
    await expect(secondWeek.locator('.calendar-week-title')).toContainText('5 oct');

    // 2. Cabecera de resumen con media y delta
    const firstWeekStats = firstWeek.locator('.calendar-week-stats');
    await expect(firstWeekStats).toBeVisible();
    await expect(firstWeekStats).toContainText('81.20');
    await expect(firstWeekStats).toContainText('-0.50');

    // 3. Días lunes a domingo en la cuadrícula semanal
    const days = firstWeek.locator('.calendar-day[role="button"]');
    await expect(days).toHaveCount(7);

    const expectedDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      await expect(days.nth(i).locator('.calendar-day-name')).toHaveText(expectedDayNames[i]);
    }
  });

  test('2. Reactividad de toggles de métricas y persistencia en localStorage', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/tracking');

    // 1. Toolbar 'Filtro de métricas'
    const toolbar = page.getByRole('toolbar', {
      name: /filtro de m[eé]tricas/i,
    });
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // 2. Botones toggle con aria-pressed
    const weightToggle = toolbar.getByRole('button', { name: 'Peso', exact: true });
    const stepsToggle = toolbar.getByRole('button', { name: 'Pasos', exact: true });
    const kcalToggle = toolbar.getByRole('button', { name: 'Kcal', exact: true });

    await expect(weightToggle).toBeVisible();
    await expect(stepsToggle).toBeVisible();
    await expect(kcalToggle).toBeVisible();

    await expect(weightToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(stepsToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(kcalToggle).toHaveAttribute('aria-pressed', 'true');

    // Celda de lunes con valores iniciales
    const firstDayCell = page.locator('.calendar-day[role="button"]').first();
    await expect(firstDayCell).toContainText('81.20');
    await expect(firstDayCell).toContainText('8500');
    await expect(firstDayCell).toContainText('2000');

    // 3. Visibilidad condicional y persistencia de Peso
    await weightToggle.click();
    await expect(weightToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(firstDayCell).not.toContainText('81.20');
    expect(await page.evaluate(() => localStorage.getItem('tracking_showWeight'))).toBe('false');

    // Visibilidad condicional y persistencia de Pasos
    await stepsToggle.click();
    await expect(stepsToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(firstDayCell).not.toContainText('8500');
    expect(await page.evaluate(() => localStorage.getItem('tracking_showSteps'))).toBe('false');

    // Visibilidad condicional y persistencia de Kcal
    await kcalToggle.click();
    await expect(kcalToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(firstDayCell).not.toContainText('2000');
    expect(await page.evaluate(() => localStorage.getItem('tracking_showCalories'))).toBe('false');

    // 4. Persistencia tras recargar la página
    await page.reload();

    const reloadedToolbar = page.getByRole('toolbar', {
      name: /filtro de m[eé]tricas/i,
    });
    const reloadedWeightToggle = reloadedToolbar.getByRole('button', {
      name: 'Peso',
      exact: true,
    });
    const reloadedStepsToggle = reloadedToolbar.getByRole('button', {
      name: 'Pasos',
      exact: true,
    });
    const reloadedKcalToggle = reloadedToolbar.getByRole('button', {
      name: 'Kcal',
      exact: true,
    });

    await expect(reloadedWeightToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(reloadedStepsToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(reloadedKcalToggle).toHaveAttribute('aria-pressed', 'false');

    const reloadedCell = page.locator('.calendar-day[role="button"]').first();
    await expect(reloadedCell).not.toContainText('81.20');
    await expect(reloadedCell).not.toContainText('8500');
    await expect(reloadedCell).not.toContainText('2000');

    // Reactivar Peso y comprobar que vuelve a mostrarse
    await reloadedWeightToggle.click();
    await expect(reloadedWeightToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(reloadedCell).toContainText('81.20');
    expect(await page.evaluate(() => localStorage.getItem('tracking_showWeight'))).toBe('true');
  });

  test('3. Modal de edición de día y ajustes delta de peso y pasos', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/tracking');

    // Click en una celda de día abre TrackingEntryModal
    const firstDayCell = page.locator('.calendar-day[role="button"]').first();
    await firstDayCell.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible();

    const weightInput = page.locator('#modal-weight-input');
    const stepsInput = page.locator('#modal-steps-input');

    await expect(weightInput).toBeVisible();
    await expect(stepsInput).toBeVisible();

    await expect(weightInput).toHaveValue('81.2');
    await expect(stepsInput).toHaveValue('8500');

    // Ajustes delta de peso (+0.1, -0.1, +0.5, -0.5)
    const plus01 = modal.getByRole('button', { name: /ajustar peso en \+0\.1/i });
    const minus01 = modal.getByRole('button', { name: /ajustar peso en -0\.1/i });
    const plus05 = modal.getByRole('button', { name: /ajustar peso en \+0\.5/i });
    const minus05 = modal.getByRole('button', { name: /ajustar peso en -0\.5/i });

    await plus01.click();
    await expect(weightInput).toHaveValue('81.30');

    await minus01.click();
    await expect(weightInput).toHaveValue('81.20');

    await plus05.click();
    await expect(weightInput).toHaveValue('81.70');

    await minus05.click();
    await expect(weightInput).toHaveValue('81.20');

    // Ajustes delta de pasos (+1000 y +100)
    const plus1000 = modal.getByRole('button', { name: /ajustar pasos en \+1000/i });
    await expect(plus1000).toBeVisible();
    await plus1000.click();
    await expect(stepsInput).toHaveValue('9500');

    const plus100 = modal.getByRole('button', { name: 'Ajustar pasos en +100', exact: true });
    await expect(plus100).toBeVisible();
    await plus100.click();
    await expect(stepsInput).toHaveValue('9600');

    // Cancelar cierra el modal sin alterar los datos
    await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('4. Guardar cambios en celda dispara POST /api/weights y POST /api/steps con toast', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let savedWeightPayload: { date: string; weight: number } | null = null;
    let savedStepsPayload: { date: string; steps: number } | null = null;

    await page.route(/\/api\/weights(\?.*)?$/, async (route) => {
      if (route.request().method() === 'POST') {
        savedWeightPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 101, ...savedWeightPayload },
        });
      } else {
        await route.fallback();
      }
    });

    await page.route('**/api/steps', async (route) => {
      if (route.request().method() === 'POST') {
        savedStepsPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 102, ...savedStepsPayload },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/tracking');

    const firstDayCell = page.locator('.calendar-day[role="button"]').first();
    await firstDayCell.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    // Modificar peso (+0.5 -> 81.70) y pasos (+1000 -> 9500)
    await modal.getByRole('button', { name: /ajustar peso en \+0\.5/i }).click();
    await modal.getByRole('button', { name: /ajustar pasos en \+1000/i }).click();

    // Guardar cambios
    const saveButton = page.getByRole('button', { name: 'Guardar', exact: true });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Verificar notificación toast
    await expect(page.getByText('Registros guardados')).toBeVisible();

    // Verificar cierre de modal
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verificar payloads enviados a las APIs
    expect(savedWeightPayload).toEqual({
      date: '2026-10-12',
      weight: 81.7,
    });
    expect(savedStepsPayload).toEqual({
      date: '2026-10-12',
      steps: 9500,
    });
  });

  test('5. Borrar métricas del día dispara DELETE, muestra toast y limpia celda', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let deletedWeightDate: string | null = null;
    let deletedStepsDate: string | null = null;
    let metricsDeleted = false;

    await page.route(/\/api\/weights\/(\d{4}-\d{2}-\d{2})/, async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedWeightDate = route.request().url().split('/').pop() || null;
        metricsDeleted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { message: 'Weight deleted' },
        });
      } else {
        await route.fallback();
      }
    });

    await page.route(/\/api\/steps\/(\d{4}-\d{2}-\d{2})/, async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedStepsDate = route.request().url().split('/').pop() || null;
        metricsDeleted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { message: 'Steps deleted' },
        });
      } else {
        await route.fallback();
      }
    });

    // Rutas para devolver la celda limpia tras el refetch
    await page.route('**/api/weights/weekly**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [
          {
            weekStart: '2026-10-12',
            average: metricsDeleted ? null : 81.2,
            delta: metricsDeleted ? null : -0.5,
            entries: metricsDeleted ? 0 : 1,
            days: [metricsDeleted ? null : 81.2, null, null, null, null, null, null],
          },
        ],
      });
    });

    await page.route('**/api/steps/weekly**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [
          {
            weekStart: '2026-10-12',
            average: metricsDeleted ? null : 8500,
            delta: metricsDeleted ? null : 500,
            days: [metricsDeleted ? null : 8500, null, null, null, null, null, null],
          },
        ],
      });
    });

    await page.goto('/tracking');
    await expect(page.locator('.calendar-container')).toBeVisible({ timeout: 15000 });

    const firstDayCell = page.locator('.calendar-day[role="button"]').first();
    await expect(firstDayCell).toContainText('81.20');
    await expect(firstDayCell).toContainText('8500');

    await firstDayCell.click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    // Click en 'Borrar Ambos'
    const deleteBtn = page.getByRole('button', { name: /borrar ambos/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    const confirmBtn = page.getByRole('button', { name: /^Eliminar$/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Verificar llamadas DELETE a endpoints
    await expect.poll(() => deletedWeightDate, { timeout: 5000 }).toBe('2026-10-12');
    await expect.poll(() => deletedStepsDate, { timeout: 5000 }).toBe('2026-10-12');

    // Toast 'Registros eliminados'
    await expect(page.getByText('Registros eliminados')).toBeVisible();

    // Modal cerrado
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Celda queda limpia sin valores numéricos
    await expect(firstDayCell).not.toContainText('81.20');
    await expect(firstDayCell).not.toContainText('8500');
  });
});
