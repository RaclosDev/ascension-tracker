import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Dashboard Page', () => {
  test('renders weight charts and quick-add form', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
    await expect(page.getByText(/Peso hoy/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Peso Actual/i)).toBeVisible({ timeout: 15000 });
  });

  test('quick-add weight form is accessible', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/dashboard');

    const weightInput = page.getByRole('textbox', {
      name: /Peso corporal de hoy/i,
    });
    await expect(weightInput).toBeVisible({ timeout: 15000 });

    const submitButton = page.getByRole('button', {
      name: /(Actualizar|Registrar)/i,
    });
    await expect(submitButton).toBeVisible({ timeout: 15000 });
  });
});
