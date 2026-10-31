import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test('tracking dialog traps focus and restores the day button on Escape', async ({ page }) => {
  await setupAuthMocks(page);
  await page.goto('/tracking');
  const trigger = page.locator('.calendar-day[role="button"]').first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  const close = dialog.getByRole('button', { name: /Cerrar modal/ });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Guardar', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('food actions support keyboard focus and closing with Escape', async ({ page }) => {
  await setupAuthMocks(page);
  await page.goto('/nutrition');
  await page.getByRole('button', { name: 'Mis Alimentos' }).click();
  const trigger = page.getByRole('button', { name: 'Crear alimento', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Crear Alimento' });
  await expect(dialog.getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('public headline keeps readable brand colour after a dark personal theme', async ({
  page,
}) => {
  await page.route('**/api/auth/config**', (route) =>
    route.fulfill({ json: { googleClientId: 'fake-test-client-id' } }),
  );
  await page.route('**/api/auth/refresh**', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/');
  await page.evaluate(() =>
    document.documentElement.style.setProperty('--accent-primary', '#033d74'),
  );
  await expect(page.locator('.landing-tag')).toHaveCSS('color', 'rgb(0, 133, 255)');
});
