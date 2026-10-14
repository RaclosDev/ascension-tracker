import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import path from 'path';

const SCREENSHOT_DIR =
  'C:/Users/raclo/.gemini/antigravity/brain/38f6353b-c749-4508-bcf3-d33dcd0ce257/mobile_screenshots';

test.describe('Mobile Viewport Capture', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  test('Capture /utilities mobile screenshots', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await page.waitForLoadState('networkidle');

    // 1. Initial overview of utilities (all collapsed)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_utilities_overview.png'),
      fullPage: true,
    });

    // 2. Open AI Nutrition Chef
    const chefButton = page.getByRole('button', { name: /Estratega Nutricional IA/i });
    if (await chefButton.isVisible()) {
      await chefButton.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02_utilities_ai_chef_open.png'),
        fullPage: true,
      });
      // Close it again
      await chefButton.click();
      await page.waitForTimeout(300);
    }

    // 3. Open Marina body fat
    const marinaButton = page.getByRole('button', { name: /grasa corporal/i });
    await marinaButton.scrollIntoViewIfNeeded();
    await marinaButton.click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_utilities_marina_open.png'),
      fullPage: true,
    });
  });

  test('Capture /workout mobile screenshots', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [
          {
            id: 'bench-press',
            name: 'Press de Banca',
            muscle: 'pecho',
            equipment: 'barra',
          },
        ],
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [
          {
            id: 'base-pecho-press-de-pecho-plano-barra',
            name: 'Press de Pecho Plano con Barra',
            muscle: 'pecho',
            equipment: 'barra',
          },
        ],
      });
    });

    await page.route(/\/api\/workouts(\?.*)?$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { content: [], number: 0, totalPages: 0 },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 'mock-workout-id' },
        });
      }
    });

    await page.goto('/workout');
    await page.waitForLoadState('networkidle');

    const startBtn = page.getByRole('button', { name: /empezar entrenamiento/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    const emptyOption = page
      .locator('.start-workout-option')
      .filter({ hasText: /entrenamiento vac[ií]o/i });
    await expect(emptyOption).toBeVisible({ timeout: 10000 });
    await emptyOption.click();

    const exerciseItem = page.locator('.picker-exercise-item').first();
    await expect(exerciseItem).toBeVisible({ timeout: 10000 });
    await exerciseItem.click();

    const addBtn = page.getByRole('button', { name: /a[ñn]adir al entreno/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(600);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_workout_active_mobile.png'),
      fullPage: true,
    });
  });

  test('Capture /settings mobile screenshots', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_settings_mobile.png'),
      fullPage: true,
    });
  });
});
