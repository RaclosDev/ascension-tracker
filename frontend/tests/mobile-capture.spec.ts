import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import path from 'path';

const SCREENSHOT_DIR =
  'C:/Users/raclo/.gemini/antigravity/brain/38f6353b-c749-4508-bcf3-d33dcd0ce257/mobile_screenshots';

test.describe('Visual Screenshots Capture Suite', () => {
  test.describe('Mobile Viewport (iPhone 390x844)', () => {
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

    test('Capture /workout active and finish summary mobile screenshots', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/exercises.json**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [
            {
              id: 'bench-press',
              name: 'Press de Banca Plano',
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
            json: {
              content: [
                {
                  id: 'w-1',
                  name: 'Torso Fuerza',
                  startedAt: Date.now() - 3600000 * 24,
                  finishedAt: Date.now() - 3600000 * 23,
                  exercises: [
                    {
                      exerciseId: 'bench-press',
                      sets: [
                        { completed: true, weight: 100, reps: 8 },
                        { completed: true, weight: 100, reps: 8 },
                        { completed: true, weight: 100, reps: 8 },
                        { completed: true, weight: 100, reps: 8 },
                      ],
                    },
                  ],
                },
              ],
              number: 0,
              totalPages: 1,
            },
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
      await page.waitForTimeout(500);

      // Screenshot 03b: Workout Dashboard Overview (Muscle Recovery & Body Heatmap in 2 columns + Activity)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '03b_workout_overview_2cols_mobile.png'),
        fullPage: true,
      });

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

      // Mark a set as completed with reps and weight
      const weightInput = page.locator('.set-input').first();
      await weightInput.fill('100');
      const repsInput = page.locator('.set-input').nth(1);
      await repsInput.fill('8');
      const checkBtn = page.locator('.set-check-btn').first();
      await checkBtn.click();
      await page.waitForTimeout(500);

      // Screenshot 04: Active workout with completed set
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '04_workout_active_mobile.png'),
        fullPage: true,
      });

      // Add second set to showcase quick steppers
      const addSetBtn = page.getByRole('button', { name: /añadir serie/i });
      if (await addSetBtn.isVisible()) {
        await addSetBtn.click();
        await page.waitForTimeout(300);
        const secondWeightInput = page.locator('.set-input').nth(2);
        await secondWeightInput.focus();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '04b_workout_stepper_mobile.png'),
          fullPage: true,
        });

        // Scroll to bottom to inspect bottom actions with rest banner
        await page.evaluate(() => {
          const mc = document.querySelector('.main-content');
          if (mc) mc.scrollTo({ top: mc.scrollHeight, behavior: 'instant' });
        });
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '04c_workout_footer_mobile.png'),
        });
      }

      // Click "Terminar Entrenamiento" to open the new Post-Workout Summary
      const finishBtn = page.getByRole('button', { name: /terminar entrenamiento/i });
      await expect(finishBtn).toBeVisible({ timeout: 5000 });
      await finishBtn.click();

      // Wait for the finish summary dialog
      const finishTitle = page.getByRole('heading', { name: /finalizar sesi[oó]n/i });
      await expect(finishTitle).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(600);

      // Screenshot 06: Redesigned Post-Workout Finish & Summary screen
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '06_workout_finish_summary_mobile.png'),
        fullPage: true,
      });
    });

    test('Capture /nutrition mobile screenshots', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/nutrition/logs**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [
            {
              id: 1,
              mealIndex: 0,
              product: 'Huevos enteros cocidos',
              quantity: 120,
              kcal: 186,
              protein: 15.6,
              carbs: 1.3,
              fat: 12.8,
            },
            {
              id: 2,
              mealIndex: 0,
              product: 'Avena copos integrales',
              quantity: 80,
              kcal: 296,
              protein: 10.4,
              carbs: 48,
              fat: 5.6,
            },
          ],
        });
      });

      await page.route('**/api/nutrition/meals**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [
            { id: 1, name: 'Desayuno', icon: 'coffee' },
            { id: 2, name: 'Comida', icon: 'utensils' },
            { id: 3, name: 'Cena', icon: 'moon' },
          ],
        });
      });

      await page.goto('/nutrition');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);

      // Screenshot 07: Polished Nutrition Page
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '07_nutrition_diary_mobile.png'),
        fullPage: true,
      });
    });

    test('Capture /dashboard and /settings mobile screenshots', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Screenshot 08: Cleaned Dashboard
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '08_dashboard_mobile.png'),
        fullPage: true,
      });

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Screenshot 05: Settings
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '05_settings_mobile.png'),
        fullPage: true,
      });

      await page.goto('/tracking');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Screenshot 11: Tracking / Weight
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '11_tracking_mobile.png'),
        fullPage: true,
      });
    });
  });

  test.describe('Desktop Viewport (1280x800)', () => {
    test.use({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });

    test('Capture desktop screenshots', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/exercises.json**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [
            {
              id: 'bench-press',
              name: 'Press de Banca Plano',
              muscle: 'pecho',
              equipment: 'barra',
            },
          ],
        });
      });

      await page.route(/\/api\/workouts(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { content: [], number: 0, totalPages: 0 },
        });
      });

      await page.goto('/workout');
      await page.waitForLoadState('networkidle');

      const startBtn = page.getByRole('button', { name: /empezar entrenamiento/i });
      await expect(startBtn).toBeVisible({ timeout: 10000 });
      await startBtn.click();

      const emptyOption = page
        .locator('.start-workout-option')
        .filter({ hasText: /entrenamiento vac[ií]o/i });
      await expect(emptyOption).toBeVisible({ timeout: 5000 });
      await emptyOption.click();

      const exerciseItem = page.locator('.picker-exercise-item').first();
      await expect(exerciseItem).toBeVisible({ timeout: 5000 });
      await exerciseItem.click();

      const addBtn = page.getByRole('button', { name: /a[ñn]adir al entreno/i });
      await expect(addBtn).toBeVisible({ timeout: 5000 });
      await addBtn.click();

      const weightInput = page.locator('.set-input').first();
      await weightInput.fill('90');
      const repsInput = page.locator('.set-input').nth(1);
      await repsInput.fill('10');
      const checkBtn = page.locator('.set-check-btn').first();
      await checkBtn.click();
      await page.waitForTimeout(400);

      const finishBtn = page.getByRole('button', { name: /terminar entrenamiento/i });
      await finishBtn.click();
      await page.waitForTimeout(600);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '09_workout_finish_summary_desktop.png'),
      });

      await page.goto('/nutrition');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '10_nutrition_diary_desktop.png'),
      });
    });
  });
});
