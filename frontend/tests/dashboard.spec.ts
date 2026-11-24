import { test, expect, type Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

const todayIso = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const weightCard = (page: Page) => page.getByRole('region', { name: 'Peso de hoy', exact: true });
const weightInput = (page: Page) =>
  page.getByRole('textbox', { name: /peso de hoy en kilogramos/i });

test.describe('Dashboard Page & KPI Metrics Suite', () => {
  test('1. renders the weight card, goal progress and figures', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    // Weight card: today's figure and what is left to the goal
    const card = weightCard(page);
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.getByRole('term').filter({ hasText: 'Faltan' })).toBeVisible();
    await expect(card.getByRole('definition').filter({ hasText: '3.2 kg' })).toBeVisible();
    await expect(card.getByRole('term').filter({ hasText: 'Llegada' })).toBeVisible();
    await expect(card.getByRole('term').filter({ hasText: 'Kg por semana' })).toBeVisible();

    // Goal panel: the bar with its start and goal markers
    // SETTINGS_FIXTURE has startWeight: 85.0 and goalWeight: 78.0
    const goal = page.getByRole('region', { name: 'Meta', exact: true });
    await expect(goal.getByRole('progressbar', { name: /progreso hacia la meta/i })).toBeVisible();
    await expect(goal.getByText('54 % hecho')).toBeVisible();
    await expect(goal.getByText('85.0 kg')).toBeVisible();
    await expect(goal.getByText('78.0 kg')).toBeVisible();
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

    const card = weightCard(page);
    await expect(card).toBeVisible();
    await expect(card.getByText('Hoy todavía no te has pesado')).toBeVisible();

    // With no entry today the action reads «Registrar» and opens the figure as a field
    await card.getByRole('button', { name: 'Registrar', exact: true }).click();
    await weightInput(page).fill('80.8');
    await card.getByRole('button', { name: 'Guardar', exact: true }).click();

    // Verify POST /api/weights payload
    await expect.poll(() => postedPayload).not.toBeNull();
    expect(postedPayload?.date).toBe(todayIso());
    expect(postedPayload?.weight).toBe(80.8);

    // Verify success toast
    await expect(page.getByText(/peso guardado: 80\.8 kg/i)).toBeVisible({ timeout: 5000 });
  });

  test('3. quick-edit existing weight submits update and shows success toast when hasTodayWeight is true', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const todayDateStr = todayIso();
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

    // With an entry today the action reads «Actualizar» and the field starts from it
    const card = weightCard(page);
    await card.getByRole('button', { name: 'Actualizar', exact: true }).click();
    await expect(weightInput(page)).toHaveValue('81.2');

    // Change weight to 80.9 and submit
    await weightInput(page).fill('80.9');
    await card.getByRole('button', { name: 'Guardar', exact: true }).click();

    // Verify mutation payload
    await expect.poll(() => updatedPayload).not.toBeNull();
    expect(updatedPayload?.date).toBe(todayDateStr);
    expect(updatedPayload?.weight).toBe(80.9);

    // Verify success toast for update
    await expect(page.getByText(/peso guardado: 80\.9 kg/i)).toBeVisible({ timeout: 5000 });
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

    const card = weightCard(page);
    await card.getByRole('button', { name: /^(registrar|actualizar)$/i }).click();
    const submitButton = card.getByRole('button', { name: 'Guardar', exact: true });

    // Test negative weight input
    await weightInput(page).fill('-5');
    await submitButton.click();

    await expect(page.getByText(/introduce un peso v[áa]lido en kg/i).first()).toBeVisible({
      timeout: 5000,
    });
    expect(mutationTriggered).toBe(false);

    // Test non-numeric weight input
    await weightInput(page).fill('abc');
    await submitButton.click();

    await expect(page.getByText(/introduce un peso v[áa]lido en kg/i).first()).toBeVisible({
      timeout: 5000,
    });
    expect(mutationTriggered).toBe(false);
  });

  test('5. renders the weight evolution chart and the plan for today', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    const evolutionCard = page.getByRole('region', { name: 'Evolución del peso' });
    await expect(evolutionCard).toBeVisible();
    await expect(evolutionCard.locator('.recharts-surface').first()).toBeVisible();

    const today = page.getByRole('complementary', { name: 'Hoy', exact: true });
    await expect(today.getByText('Entreno', { exact: true })).toBeVisible();
    await expect(today.getByRole('link', { name: /entrenar|empezar|ver/i })).toBeVisible();
  });
});
