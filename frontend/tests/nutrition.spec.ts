import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Nutrition Page', () => {
  test('shows nutrition diary for today', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/nutrition');

    await expect(page).toHaveURL(/.*nutrition.*/, { timeout: 15000 });
    await expect(page.getByText('Desayuno')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Comida')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Cena')).toBeVisible({ timeout: 15000 });
  });

  test('tabs diary and foods are navigable', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/nutrition');

    const diaryTab = page.getByRole('button', { name: /^Diario$/i });
    const foodsTab = page.getByRole('button', { name: /^Mis Alimentos$/i });

    await expect(diaryTab).toBeVisible({ timeout: 15000 });
    await expect(foodsTab).toBeVisible({ timeout: 15000 });

    // Navigate to Foods tab
    await foodsTab.click();
    await expect(page.getByText('Desayuno')).not.toBeVisible({ timeout: 15000 });

    // Navigate back to Diary tab
    await diaryTab.click();
    await expect(page.getByText('Desayuno')).toBeVisible({ timeout: 15000 });
  });
});
