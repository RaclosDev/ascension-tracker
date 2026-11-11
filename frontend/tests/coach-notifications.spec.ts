import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import { coachSettings } from './helpers/coachSettings';

for (const width of [390, 1440]) {
  test(`notification controls confirm registration and retain device opt-out at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        value: { permission: 'granted' },
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          getRegistration: async () => ({
            active: {},
            pushManager: {
              getSubscription: async () => ({
                endpoint: 'https://fcm.googleapis.com/test-device',
                toJSON: () => ({
                  endpoint: 'https://fcm.googleapis.com/test-device',
                  keys: { p256dh: 'key', auth: 'auth' },
                }),
              }),
            },
          }),
        },
      });
    });
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'settings') return route.fulfill({ json: coachSettings });
      if (path === 'checkin-template')
        return route.fulfill({ json: { questions: [], custom: false } });
      return route.fulfill({ json: [] });
    });
    let fail = true;
    let registrations = 0;
    let removals = 0;
    await page.route('**/api/push/subscribe', (route) => {
      registrations++;
      return route.fulfill({
        status: fail ? 503 : 200,
        json: fail ? { message: 'Temporalmente no disponible' } : {},
      });
    });
    await page.route('**/api/push/unsubscribe', (route) => {
      expect(route.request().postDataJSON()).toEqual({
        endpoint: 'https://fcm.googleapis.com/test-device',
      });
      removals++;
      return route.fulfill({ status: 200, json: {} });
    });
    await page.goto('/entrenador/ajustes');
    await expect(page.getByRole('button', { name: 'Reintentar activación' })).toBeVisible();
    await expect(page.getByText('Avisos activados en este dispositivo.')).toHaveCount(0);
    fail = false;
    await page.getByRole('button', { name: 'Reintentar activación' }).click();
    await expect(page.getByText('Avisos activados en este dispositivo.')).toBeVisible();
    await page.getByRole('button', { name: 'Desactivar en este dispositivo' }).click();
    await expect(page.getByRole('button', { name: 'Activar avisos' })).toBeVisible();
    expect(removals).toBe(1);
    const beforeReload = registrations;
    await page.reload();
    await expect(page.getByRole('button', { name: 'Activar avisos' })).toBeVisible();
    expect(registrations).toBe(beforeReload);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
