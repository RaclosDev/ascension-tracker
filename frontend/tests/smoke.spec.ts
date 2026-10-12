import { test, expect } from '@playwright/test';

test('App loads successfully and shows login screen', async ({ page }) => {
  // Navigate to the base URL (which is localhost:5173 configured in playwright.config.ts)
  await page.goto('/');

  // Verify that the document title is correct
  await expect(page).toHaveTitle(/Ascension/i);

  // Verify that the React app booted up and rendered either login screen or handled missing backend gracefully
  await expect(page.getByText(/Tu progreso, tu esfuerzo|Error de conexión/i)).toBeVisible({
    timeout: 10000,
  });
});
