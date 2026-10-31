import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

for (const scenario of [
  { page: '/dashboard', endpoint: '**/api/weights/dashboard', heading: 'Inicio' },
  { page: '/tracking', endpoint: '**/api/steps/weekly', heading: 'Seguimiento' },
]) {
  test(`${scenario.page} preserves an explicit failure state and allows retry`, async ({
    page,
  }) => {
    await setupAuthMocks(page);
    let failing = true;
    await page.route(scenario.endpoint, async (route) => {
      if (failing) await route.fulfill({ status: 503, json: { message: 'unavailable' } });
      else await route.fallback();
    });
    await page.goto(scenario.page);
    await expect(
      page.getByRole('alert').filter({ hasText: 'No se han podido actualizar' }),
    ).toBeVisible({ timeout: 20000 });
    failing = false;
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'No se han podido actualizar' }),
    ).toHaveCount(0);
    await expect(page.locator('h1')).toBeAttached();
  });
}
