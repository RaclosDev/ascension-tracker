import { expect, test } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime('2026-10-14T10:00:00Z');
  await setupAuthMocks(page);
});

test('Pasos permite guardar cero y borrar el registro del día', async ({ page }) => {
  let steps: number | null = null;
  await page.route('**/api/steps/weekly', (route) =>
    route.fulfill({
      json: [{ weekStart: '2026-10-12', average: steps, delta: null, days: [steps] }],
    }),
  );
  await page.route('**/api/steps', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({ date: '2026-10-12', steps: 0 });
    steps = 0;
    await route.fulfill({ json: { date: '2026-10-12', steps } });
  });
  await page.route('**/api/steps/2026-10-12', async (route) => {
    expect(route.request().method()).toBe('DELETE');
    steps = null;
    await route.fulfill({ status: 204 });
  });
  await page.goto('/tracking/pasos');
  await page.getByRole('button', { name: /lunes 12 de octubre.*sin registro/i }).click();
  await page.getByLabel('Pasos', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: /lunes 12 de octubre.*0 pasos/i })).toBeVisible();
  await page.getByRole('button', { name: 'Borrar registro' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /lunes 12 de octubre.*sin registro/i }),
  ).toBeVisible();
});

test('Peso abre los datos existentes y guarda el decimal en el día seleccionado', async ({
  page,
}) => {
  await page.goto('/tracking/peso');
  await page.getByRole('button', { name: /lunes 12 de octubre.*81,2 kg/i }).click();
  const weight = page.getByLabel('Peso', { exact: true });
  await expect(weight).toHaveValue('81,2');
  await expect(page.getByRole('button', { name: /jueves 15 de octubre/i })).toBeDisabled();
  await weight.fill('80,75');
  const request = page.waitForRequest(
    (candidate) => candidate.url().endsWith('/api/weights') && candidate.method() === 'POST',
  );
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  expect((await request).postDataJSON()).toEqual({ date: '2026-10-12', weight: 80.75 });
});
