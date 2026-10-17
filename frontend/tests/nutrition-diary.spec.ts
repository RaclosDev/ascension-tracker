import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function setupNutritionHelpers(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.id = 'e2e-nutrition-helper-styles';
    style.textContent = `
      .desktop-swipe-actions {
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(style);
  });
}

test.describe('Nutrition Diary E2E Suite', () => {
  test('1. renders diary, macro summary, meal groups, and distribution chart', async ({ page }) => {
    await setupAuthMocks(page);
    await setupNutritionHelpers(page);

    await page.goto('/nutrition');

    await expect(page).toHaveURL(/.*nutrition.*/, { timeout: 15000 });

    // 1. Date selector buttons and current label
    const prevDayBtn = page.getByRole('button', { name: /d[ií]a anterior/i });
    const nextDayBtn = page.getByRole('button', { name: /d[ií]a siguiente/i });
    await expect(prevDayBtn).toBeVisible({ timeout: 10000 });
    await expect(nextDayBtn).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hoy')).toBeVisible({ timeout: 10000 });

    // 2. Macro summary card with Calories, Protein, Carbs, Fat
    const macroSummary = page.locator('.nutrition-summary-card');
    await expect(macroSummary).toBeVisible({ timeout: 10000 });
    await expect(macroSummary.getByText(/Calor[ií]as/i)).toBeVisible();
    await expect(macroSummary.getByText(/Prote[ií]nas/i)).toBeVisible();
    await expect(macroSummary.getByText(/Hidratos/i)).toBeVisible();
    await expect(macroSummary.getByText(/Grasas/i)).toBeVisible();

    // 3. Meal groups (Desayuno, Comida, Cena)
    await expect(page.getByText('Desayuno')).toBeVisible();
    await expect(page.getByText('Comida', { exact: true })).toBeVisible();
    await expect(page.getByText('Cena')).toBeVisible();

    // 4. Macro distribution chart
    await expect(page.getByText(/Distribuci[óo]n de Macros/i)).toBeVisible({ timeout: 10000 });
    const pieChart = page.locator('.recharts-responsive-container').first();
    await expect(pieChart).toBeVisible({ timeout: 10000 });
  });

  test('2. date navigation buttons reload logs with GET /api/nutrition/logs?date=YYYY-MM-DD', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await setupNutritionHelpers(page);

    const today = getLocalDateString();
    const yesterday = addDays(today, -1);
    const requestedDates: string[] = [];

    await page.route(/\/api\/nutrition\/logs(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const dateParam = url.searchParams.get('date');
      if (dateParam) {
        requestedDates.push(dateParam);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    await page.goto('/nutrition');

    const prevDayBtn = page.getByRole('button', { name: /d[ií]a anterior/i });
    const nextDayBtn = page.getByRole('button', { name: /d[ií]a siguiente/i });

    // Initial load requested today's date
    await expect.poll(() => requestedDates.includes(today)).toBe(true);

    // Click previous day
    await prevDayBtn.click();
    await expect.poll(() => requestedDates.includes(yesterday)).toBe(true);
    await expect(page.getByText('Hoy')).not.toBeVisible();

    // Click next day to return to today
    await nextDayBtn.click();
    await expect(page.getByText('Hoy')).toBeVisible({ timeout: 5000 });
  });

  test('3. collapsible meal accordion collapses and expands food list upon header click', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await setupNutritionHelpers(page);

    const today = getLocalDateString();
    const mockLogs = [
      {
        id: 701,
        date: today,
        mealIndex: 0,
        product: 'Copos de Avena Integrales',
        quantity: 80,
        kcal: 295,
        protein: 10.5,
        carbs: 47,
        fat: 5.6,
      },
    ];

    await page.route(/\/api\/nutrition\/logs(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockLogs,
      });
    });

    await page.goto('/nutrition');

    const desayunoHeader = page.locator('button[aria-expanded]').filter({ hasText: /Desayuno/i });
    await expect(desayunoHeader).toBeVisible({ timeout: 10000 });

    // Initially collapsed: foods list is not visible, aria-expanded is false
    await expect(desayunoHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Copos de Avena Integrales')).not.toBeVisible();

    // Click to expand accordion
    await desayunoHeader.click();
    await expect(desayunoHeader).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Copos de Avena Integrales')).toBeVisible();

    // Click again to collapse accordion
    await desayunoHeader.click();
    await expect(desayunoHeader).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Copos de Avena Integrales')).not.toBeVisible();
  });

  test('4. copy yesterday meals loads previous logs and duplicates them with POST /api/nutrition/logs', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await setupNutritionHelpers(page);

    const today = getLocalDateString();
    const yesterday = addDays(today, -1);

    const yesterdayLogs = [
      {
        id: 801,
        date: yesterday,
        mealIndex: 0,
        product: 'Tortilla de Claras',
        quantity: 150,
        kcal: 180,
        protein: 26,
        carbs: 2,
        fat: 7,
        portionsJson: null,
      },
    ];

    const todayLogs: Array<Record<string, unknown>> = [];
    const createdPostRequests: Array<Record<string, unknown>> = [];

    await page.route(/\/api\/nutrition\/logs(\?.*)?$/, async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());

      if (method === 'GET') {
        const dateParam = url.searchParams.get('date');
        if (dateParam === yesterday) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: yesterdayLogs,
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: todayLogs,
          });
        }
      } else if (method === 'POST') {
        const payload = route.request().postDataJSON();
        createdPostRequests.push(payload);
        const newLog = { id: 999, ...payload };
        todayLogs.push(newLog);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: newLog,
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/nutrition');

    // Click 'Copiar de ayer' on Desayuno
    const copyYesterdayBtn = page.getByRole('button', { name: /copiar.*ayer/i }).first();
    await expect(copyYesterdayBtn).toBeVisible({ timeout: 10000 });
    await copyYesterdayBtn.click();

    // Verify POST was dispatched with yesterday's meal log duplicated for today
    await expect.poll(() => createdPostRequests.length).toBe(1);
    expect(createdPostRequests[0]).toMatchObject({
      date: today,
      mealIndex: 0,
      product: 'Tortilla de Claras',
      quantity: 150,
    });

    // Expand Desayuno to confirm duplicated item is displayed
    const desayunoHeader = page.locator('button[aria-expanded]').filter({ hasText: /Desayuno/i });
    await desayunoHeader.click();
    await expect(page.getByText('Tortilla de Claras')).toBeVisible();
  });

  test('5. edits food log quantity with PUT and deletes log with DELETE', async ({ page }) => {
    await setupAuthMocks(page);
    await setupNutritionHelpers(page);

    const today = getLocalDateString();
    let currentLogs = [
      {
        id: 901,
        date: today,
        mealIndex: 0,
        product: 'Yogur Griego Natural',
        quantity: 125,
        kcal: 140,
        protein: 10,
        carbs: 5,
        fat: 9,
        portionsJson: null,
      },
    ];

    let putPayload: Record<string, unknown> | null = null;
    let deleteCalledWithId: string | null = null;

    await page.route(/\/api\/nutrition\/logs(\/(\d+))?(\?.*)?$/, async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      const match = url.match(/\/api\/nutrition\/logs\/(\d+)/);
      const logId = match ? match[1] : null;

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: currentLogs,
        });
      } else if (method === 'PUT') {
        putPayload = route.request().postDataJSON();
        currentLogs = currentLogs.map((item) =>
          item.id === Number(logId) ? { ...item, ...putPayload } : item,
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { ...putPayload, id: Number(logId) },
        });
      } else if (method === 'DELETE') {
        deleteCalledWithId = logId;
        currentLogs = currentLogs.filter((item) => item.id !== Number(logId));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { success: true },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/nutrition');

    // Expand Desayuno
    const desayunoHeader = page.locator('button[aria-expanded]').filter({ hasText: /Desayuno/i });
    await desayunoHeader.click();

    const foodName = page.getByText('Yogur Griego Natural');
    await expect(foodName).toBeVisible({ timeout: 10000 });

    // --- Sub-test A: EDIT LOG (PUT /api/nutrition/logs/901) ---
    await foodName.hover();
    const editBtn = page.getByTitle('Editar').first();
    await editBtn.click({ force: true });

    // Form input for grams appears
    const qtyInput = page.getByLabel(/cantidad en gramos/i);
    await expect(qtyInput).toBeVisible();
    await qtyInput.fill('250');

    // Click Guardar
    const saveBtn = page.getByRole('button', { name: /guardar/i });
    await saveBtn.click();

    // Verify PUT request was executed with quantity 250
    await expect.poll(() => putPayload).not.toBeNull();
    expect(putPayload).toMatchObject({
      id: 901,
      quantity: 250,
      product: 'Yogur Griego Natural',
    });

    // Form closed and updated quantity shown in view mode
    await expect(qtyInput).not.toBeVisible();
    await expect(page.getByText(/250g/i)).toBeVisible();

    // --- Sub-test B: DELETE LOG (DELETE /api/nutrition/logs/901) ---
    await page.getByText('Yogur Griego Natural').hover();
    const deleteBtn = page.getByTitle('Eliminar').first();
    await deleteBtn.click({ force: true });

    // Verify DELETE request was executed for log 901
    await expect.poll(() => deleteCalledWithId).toBe('901');

    // Confirm log is removed from UI
    await expect(page.getByText('Yogur Griego Natural')).not.toBeVisible();
  });
});
