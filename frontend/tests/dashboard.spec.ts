import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Dashboard Page & KPI Metrics Suite', () => {
  test('1. renders KPI cards and goal progress bar with configured markers', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    // Verify Quick-add container
    const quickAddCard = page.locator('.quick-add-card');
    await expect(quickAddCard).toBeVisible({ timeout: 10000 });

    // Verify all 4 KPI cards and expected metric labels/values
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(4);

    // Card 1: Peso Actual & Media semanal
    const weightCard = kpiCards.filter({ hasText: /peso actual/i });
    await expect(weightCard).toBeVisible();
    await expect(weightCard.locator('.kpi-value')).toContainText('81.20 kg');
    await expect(weightCard.locator('.kpi-detail')).toContainText(/media semanal: 81\.20 kg/i);

    // Card 2: Total Perdido
    const lostCard = kpiCards.filter({ hasText: /total perdido/i });
    await expect(lostCard).toBeVisible();
    await expect(lostCard.locator('.kpi-value')).toContainText('3.80 kg');
    await expect(lostCard.locator('.kpi-detail')).toContainText(/3\.8 kg perdidos/i);

    // Card 3: Te Falta
    const remainingCard = kpiCards.filter({ hasText: /te falta/i });
    await expect(remainingCard).toBeVisible();
    await expect(remainingCard.locator('.kpi-value')).toContainText('3.2 kg');
    await expect(remainingCard.locator('.kpi-detail')).toContainText(/por perder/i);

    // Card 4: Fecha Estimada
    const estimatedCard = kpiCards.filter({ hasText: /fecha estimada/i });
    await expect(estimatedCard).toBeVisible();
    await expect(estimatedCard.locator('.kpi-value')).toContainText('2026-12-01');
    await expect(estimatedCard.locator('.kpi-detail')).toContainText(/a ritmo de/i);

    // Progress Bar with progress percentage and markers (startWeight & goalWeight)
    const progressCard = page.locator('.progress-card');
    await expect(progressCard).toBeVisible();
    await expect(progressCard.locator('.progress-label')).toHaveText('Progreso hacia tu meta');
    await expect(progressCard.locator('.progress-pct')).toContainText('54.3%');

    const progressMarkers = progressCard.locator('.progress-markers');
    await expect(progressMarkers).toBeVisible();
    // SETTINGS_FIXTURE has startWeight: 85.0 and goalWeight: 78.0
    await expect(progressMarkers.getByText(/85(\.0)? kg/)).toBeVisible();
    await expect(progressMarkers.getByText(/78(\.0)? kg/)).toBeVisible();
  });

  test('2. quick-add new weight submits POST /api/weights and shows success toast when today has no entry', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let postedPayload: { date?: string; weight?: number } | null = null;
    await page.route(/\/api\/weights(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ id: 1, date: '2020-01-01', weight: 85.0 }],
        });
      } else if (route.request().method() === 'POST') {
        postedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 101, ...postedPayload },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    const form = page.locator('.quick-add-card');
    await expect(form).toBeVisible();

    const weightInput = page.getByRole('textbox', { name: /peso corporal de hoy/i });
    await expect(weightInput).toBeVisible();
    await expect(weightInput).toHaveAttribute('placeholder', '00.00');

    // Register button for new weight
    const registerButton = page.getByRole('button', {
      name: /(actualizar|registrar) peso corporal de hoy/i,
    });
    await expect(registerButton).toHaveText(/registrar/i);

    // Fill new weight and submit
    await weightInput.fill('80.8');
    await registerButton.click();

    // Verify POST /api/weights payload
    await expect.poll(() => postedPayload).not.toBeNull();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const expectedDateStr = `${yyyy}-${mm}-${dd}`;

    expect(postedPayload?.date).toBe(expectedDateStr);
    expect(postedPayload?.weight).toBe(80.8);

    // Verify success toast
    await expect(page.getByText(/peso registrado: 80\.8 kg/i)).toBeVisible({ timeout: 5000 });
  });

  test('3. quick-edit existing weight submits update and shows success toast when hasTodayWeight is true', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayDateStr = `${yyyy}-${mm}-${dd}`;

    let updatedPayload: { date?: string; weight?: number } | null = null;

    // Return today's entry on GET and capture POST update
    await page.route(/\/api\/weights(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ id: 42, date: todayDateStr, weight: 81.2 }],
        });
      } else if (route.request().method() === 'POST') {
        updatedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 42, ...updatedPayload },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    const weightInput = page.getByRole('textbox', { name: /peso corporal de hoy/i });
    await expect(weightInput).toBeVisible();
    await expect(weightInput).toHaveValue('81.2');

    const updateButton = page.getByRole('button', {
      name: /(actualizar|registrar) peso corporal de hoy/i,
    });
    await expect(updateButton).toHaveText(/actualizar/i);

    // Change weight to 80.9 and submit
    await weightInput.fill('80.9');
    await updateButton.click();

    // Verify mutation payload
    await expect.poll(() => updatedPayload).not.toBeNull();
    expect(updatedPayload?.date).toBe(todayDateStr);
    expect(updatedPayload?.weight).toBe(80.9);

    // Verify success toast for update
    await expect(page.getByText(/peso actualizado: 80\.9 kg/i)).toBeVisible({ timeout: 5000 });
  });

  test('4. validates invalid or negative weight inputs without triggering mutation', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let mutationTriggered = false;
    await page.route(/\/api\/weights(\?.*)?$/, async (route) => {
      if (route.request().method() === 'POST') {
        mutationTriggered = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 99 },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    const weightInput = page.getByRole('textbox', { name: /peso corporal de hoy/i });
    const submitButton = page.getByRole('button', {
      name: /(actualizar|registrar) peso corporal de hoy/i,
    });

    // Test negative weight input
    await weightInput.fill('-5');
    await submitButton.click();

    await expect(page.getByText(/introduce un peso v[áa]lido en kg/i).first()).toBeVisible({
      timeout: 5000,
    });
    expect(mutationTriggered).toBe(false);

    // Test non-numeric weight input
    await weightInput.fill('abc');
    await submitButton.click();

    await expect(page.getByText(/introduce un peso v[áa]lido en kg/i).first()).toBeVisible({
      timeout: 5000,
    });
    expect(mutationTriggered).toBe(false);
  });

  test('5. renders interactive AreaChart and BarChart recharts containers', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    // Verify chart cards and containers
    const chartCards = page.locator('.chart-card');
    await expect(chartCards).toHaveCount(2);

    const responsiveContainers = page.locator('.recharts-responsive-container');
    await expect(responsiveContainers).toHaveCount(2);

    // Verify Weight Evolution AreaChart
    const evolutionCard = chartCards.filter({ hasText: /evoluci.*n de peso/i });
    await expect(evolutionCard).toBeVisible();
    await expect(evolutionCard.locator('.recharts-responsive-container')).toBeVisible();
    await expect(evolutionCard.locator('.recharts-surface')).toBeVisible();

    // Verify Weekly Delta BarChart
    const deltaCard = chartCards.filter({ hasText: /variaci.*n semanal/i });
    await expect(deltaCard).toBeVisible();
    await expect(deltaCard.locator('.recharts-responsive-container')).toBeVisible();
    await expect(deltaCard.locator('.recharts-surface')).toBeVisible();
  });
});
