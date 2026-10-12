import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Utilities Page', () => {
  test('shows utilities calculators', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');

    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });
    await expect(
      page.getByRole('heading', { name: /Utilidades y Calculadoras/i }),
    ).toBeVisible({ timeout: 15000 });

    const sectionsNav = page.getByRole('navigation', {
      name: /Secciones de utilidades/i,
    });
    const strengthTab = sectionsNav.getByRole('button', { name: /Fuerza/i });
    const nutritionTab = sectionsNav.getByRole('button', { name: /Nutrición/i });

    await expect(strengthTab).toBeVisible({ timeout: 15000 });
    await expect(nutritionTab).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Calculadora de 1RM/i)).toBeVisible({ timeout: 15000 });
  });
});
