import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Workout Page', () => {
  test('shows workout page tabs', async ({ page }) => {
    await setupAuthMocks(page);

    // Explicit static exercise mocks
    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    await page.goto('/workout');

    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    const historyTab = page.getByRole('button', { name: 'Historial', exact: true });
    const exercisesTab = page.getByRole('button', { name: 'Ejercicios', exact: true });
    const templatesTab = page.getByRole('button', { name: /Plantillas|Rutinas/i });

    await expect(historyTab).toBeVisible({ timeout: 15000 });
    await expect(exercisesTab).toBeVisible({ timeout: 15000 });
    await expect(templatesTab).toBeVisible({ timeout: 15000 });
  });
});
