import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Dashboard Page & KPI Metrics Suite', () => {
  test('1. renders the weight card, goal progress and figures', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    // Weight card: today's entry, the goal bar with its start and goal markers, and the projection
    const weightCard = page.getByRole('region', { name: 'Peso' });
    await expect(weightCard).toBeVisible({ timeout: 10000 });
    await expect(weightCard.getByText('54%')).toBeVisible();
    await expect(
      weightCard.getByRole('progressbar', { name: /progreso hacia la meta/i }),
    ).toBeVisible();
    // SETTINGS_FIXTURE has startWeight: 85.0 and goalWeight: 78.0
    await expect(weightCard.getByText(/85(\.0)? kg/)).toBeVisible();
    await expect(weightCard.getByText(/78(\.0)? kg/)).toBeVisible();
    await expect(weightCard.getByRole('definition').filter({ hasText: '3.2 kg' })).toBeVisible();

    // Figures strip: weekly average and total change since the start
    const main = page.getByRole('main');
    await expect(main.getByRole('term').filter({ hasText: 'Media 7 días' })).toBeVisible();
    await expect(main.getByRole('definition').filter({ hasText: '81.2' }).first()).toBeVisible();
    await expect(main.getByRole('term').filter({ hasText: 'Desde el inicio' })).toBeVisible();
    await expect(main.getByRole('definition').filter({ hasText: '3.8' })).toBeVisible();
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

    await expect(page.getByRole('region', { name: 'Peso' })).toBeVisible();

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

  test('5. renders the evolution and weekly change charts', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    // Weight evolution and weekly change charts
    const evolutionCard = page.getByRole('region', { name: 'Evolución' });
    await expect(evolutionCard).toBeVisible();
    await expect(evolutionCard.locator('.recharts-surface').first()).toBeVisible();

    const deltaCard = page.getByRole('region', { name: 'Cambio semanal' });
    await expect(deltaCard).toBeVisible();
    await expect(deltaCard.locator('.recharts-surface').first()).toBeVisible();
  });
});
