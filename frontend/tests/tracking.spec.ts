import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Tracking Page', () => {
  test('shows weekly tracking grid', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/tracking');

    await expect(page).toHaveURL(/.*tracking.*/, { timeout: 15000 });
    await expect(page.locator('.calendar-container')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.calendar-week').first()).toBeVisible({ timeout: 15000 });
  });

  test('metric toggles are present', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/tracking');

    const toolbar = page.getByRole('toolbar', {
      name: /Filtro de métricas/i,
    });
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    const weightToggle = toolbar.getByRole('button', { name: 'Peso', exact: true });
    const stepsToggle = toolbar.getByRole('button', { name: 'Pasos', exact: true });
    const kcalToggle = toolbar.getByRole('button', { name: 'Kcal', exact: true });

    await expect(weightToggle).toBeVisible({ timeout: 15000 });
    await expect(stepsToggle).toBeVisible({ timeout: 15000 });
    await expect(kcalToggle).toBeVisible({ timeout: 15000 });

    // Verify toggle interactivity
    await expect(weightToggle).toHaveAttribute('aria-pressed', 'true');
    await weightToggle.click();
    await expect(weightToggle).toHaveAttribute('aria-pressed', 'false');
  });
});
