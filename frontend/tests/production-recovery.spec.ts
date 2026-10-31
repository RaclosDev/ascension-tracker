import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test('nutrition reports an API failure and recovers after retry', async ({ page }) => {
  await setupAuthMocks(page);
  let unavailable = true;
  await page.route('**/api/nutrition/logs?*', async (route) => {
    await route.fulfill({
      status: unavailable ? 503 : 200,
      json: unavailable ? { error: 'unavailable' } : [],
    });
  });
  await page.goto('/nutrition');
  await expect(
    page.getByRole('alert').filter({ hasText: 'No se han podido actualizar' }),
  ).toBeVisible({ timeout: 20000 });
  unavailable = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Diario', exact: true })).toBeVisible();
  await expect(
    page.getByText('No se han podido actualizar los datos.', { exact: false }),
  ).toHaveCount(0);
});
