import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import deployment from '../vercel.json' with { type: 'json' };

test('coach tour opens real screens under the deployed framing policy', async ({ page }) => {
  await setupAuthMocks(page, { showCoachTour: true });
  await page.route('**/api/coach/**', (route) =>
    route.fulfill({ json: route.request().url().endsWith('/profile') ? { coach: true } : [] }),
  );
  await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
  const headers = Object.fromEntries(
    deployment.headers[0].headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'self'");
  await page.route('**/entrenador**', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  });
  await page.goto('/entrenador');
  await page.getByRole('button', { name: 'Empezar guía interactiva' }).click();
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeEnabled({
    timeout: 20000,
  });
  await page.getByLabel('Ir a un paso').selectOption('8');
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeEnabled({
    timeout: 20000,
  });
  await expect(
    page.frameLocator('iframe').locator('[data-tour="exercise-prescription"]'),
  ).toContainText('Sentadilla');
});

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
