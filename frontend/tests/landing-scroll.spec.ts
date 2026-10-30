import { test, expect } from '@playwright/test';

// body keeps overflow: hidden for the app shell, so the landing must scroll inside its own container.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.beforeEach(async ({ page }) => {
  // CI builds without VITE_GOOGLE_CLIENT_ID, so the app asks the backend for it.
  await page.route('**/api/auth/config**', (r) =>
    r.fulfill({ status: 200, json: { googleClientId: 'ci-mock-id' } }),
  );
  await page.route('**/api/auth/refresh', (r) => r.fulfill({ status: 401, body: '' }));
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
});

test('landing scrolls on a phone', async ({ page }) => {
  const landing = page.locator('.landing');
  await page.mouse.move(195, 500);
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => landing.evaluate((el) => el.scrollTop)).toBeGreaterThan(500);
});

test('the features link scrolls to the features section', async ({ page }) => {
  await page.getByRole('link', { name: /Ver qué incluye/i }).click();
  await expect(page.getByRole('heading', { name: /Todo lo que registras/i })).toBeInViewport();
});
