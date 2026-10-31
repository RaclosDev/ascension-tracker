import { test, expect } from '@playwright/test';
import { setupAuthMocks, FAKE_JWT } from './helpers/auth';

test('failed server logout survives reload and cannot be undone by a peer token broadcast', async ({
  page,
  context,
}) => {
  const peer = await context.newPage();
  let refreshCalls = 0;
  for (const tab of [page, peer]) {
    await setupAuthMocks(tab);
    await tab.route('**/api/auth/refresh**', async (route) => {
      refreshCalls++;
      await route.fulfill({ json: { token: FAKE_JWT } });
    });
    await tab.route('**/api/auth/logout', (route) => route.abort('internetdisconnected'));
    await tab.goto('/settings');
    await expect(tab.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
  }
  await page.evaluate(() => localStorage.setItem('other_app_preference', 'preserved'));
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(peer).toHaveURL(/\/login$/);
  const callsAfterLogout = refreshCalls;
  await page.reload();
  await peer.reload();
  await page.evaluate((token) => {
    const channel = new BroadcastChannel('ascension_auth');
    channel.postMessage({ type: 'TOKEN_REFRESHED', token });
    channel.close();
    window.dispatchEvent(new Event('online'));
  }, FAKE_JWT);
  await expect(page).toHaveURL(/\/login$/);
  await expect(peer).toHaveURL(/\/login$/);
  expect(refreshCalls).toBe(callsAfterLogout);
  expect(await page.evaluate(() => localStorage.getItem('other_app_preference'))).toBe('preserved');
  expect(await page.evaluate(() => localStorage.getItem('ascension_logout_pending'))).toBe('1');
});

test('restores an offline workout only when its owning account returns', async ({ page }) => {
  await setupAuthMocks(page);
  const payloadB = Buffer.from(
    JSON.stringify({
      sub: 'account-b',
      email: 'b@example.com',
      name: 'Account B',
      exp: 9999999999,
    }),
  ).toString('base64url');
  const tokenB = `eyJhbGciOiJIUzI1NiJ9.${payloadB}.signature`;
  let currentToken = FAKE_JWT;
  await page.route('**/api/auth/refresh**', (route) =>
    route.fulfill({ json: { token: currentToken } }),
  );
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toBeAttached();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('keyval-store');
      request.onupgradeneeded = () => {
        request.result.createObjectStore('keyval');
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('keyval', 'readwrite');
        transaction.objectStore('keyval').put(
          JSON.stringify({
            version: 1,
            state: {
              active: { name: 'Private workout account A', startedAt: Date.now(), exercises: [] },
            },
          }),
          'ascension-workout-account:test%40example.com',
        );
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();
  await expect(page.getByText('Private workout account A', { exact: true })).toBeVisible();
  currentToken = tokenB;
  await page.reload();
  await expect(page.locator('h1')).toBeAttached();
  await expect(page.getByText('Private workout account A', { exact: true })).toHaveCount(0);
  currentToken = FAKE_JWT;
  await page.reload();
  await expect(page.getByText('Private workout account A', { exact: true })).toBeVisible();
});
