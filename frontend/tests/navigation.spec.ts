import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Navigation', () => {
  test('bottom nav navigates between main pages', async ({ page }) => {
    // Set mobile viewport to ensure bottom navigation bar is rendered and visible
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAuthMocks(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    const bottomNav = page.getByRole('navigation', {
      name: /Navegación inferior/i,
    });
    await expect(bottomNav).toBeVisible({ timeout: 15000 });

    // 1. Navigate to Nutrition
    const nutritionButton = bottomNav.getByRole('button', { name: /Nutrición/i });
    await nutritionButton.click();
    await expect(page).toHaveURL(/.*nutrition.*/, { timeout: 15000 });

    // 2. Navigate to Workout
    const workoutButton = bottomNav.getByRole('button', { name: /Entreno/i });
    await workoutButton.click();
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    // 3. Navigate to Tracking
    const trackingButton = bottomNav.getByRole('button', { name: /Tracking/i });
    await trackingButton.click();
    await expect(page).toHaveURL(/.*tracking.*/, { timeout: 15000 });
  });
});
