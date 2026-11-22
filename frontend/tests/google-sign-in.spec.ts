import { expect, test } from '@playwright/test';
import { FAKE_JWT, setupAuthMocks } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.route('https://accounts.google.com/gsi/client**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `(function() { let config;
        window.google = { accounts: { id: {
          initialize(options) { config = options; },
          renderButton(container) {
            const button = document.createElement('button');
            button.textContent = 'Abrir cuenta de prueba';
            button.onclick = () => {
              if (config.ux_mode === 'redirect') {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = config.login_uri;
                document.body.appendChild(form);
                form.submit();
              } else {
                window.open('about:blank', '_blank');
              }
            };
            container.replaceChildren(button);
          }
        } } }; })();`,
    }),
  );
});

test('Google renders its own button inline and the first click opens a window', async ({
  page,
}) => {
  await page.route('**/api/auth/config**', (route) =>
    route.fulfill({ json: { googleClientId: 'ci-mock-id' } }),
  );
  await page.route('**/api/auth/refresh**', (route) => route.fulfill({ status: 401, body: '' }));
  await page.goto('/login');
  const googleButton = page.getByText('Abrir cuenta de prueba', { exact: true });
  await expect(googleButton).toBeVisible();
  const popupPromise = page.waitForEvent('popup');
  await googleButton.click();
  await (await popupPromise).close();
  await expect(googleButton).toHaveCount(1);
});

test('the installed PWA redirects in the same window and restores its session through the refresh cookie', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
    // A previous logout on this device must not block the redirect sign-in.
    if (!sessionStorage.getItem('seeded-logout')) {
      sessionStorage.setItem('seeded-logout', '1');
      localStorage.setItem('ascension_logout_pending', '1');
    }
  });
  await setupAuthMocks(page);
  await page.route('**/api/auth/refresh**', (route) => {
    const signedIn = route.request().headers().cookie?.includes('refreshToken=pwa-fixture-session');
    return signedIn
      ? route.fulfill({ json: { token: FAKE_JWT } })
      : route.fulfill({ status: 401, body: '' });
  });
  let returnedToApp = false;
  await page.route('**/api/auth/login/redirect', (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().isNavigationRequest()).toBe(true);
    returnedToApp = true;
    return route.fulfill({
      status: 303,
      headers: {
        location: '/?signedIn=google',
        'set-cookie': 'refreshToken=pwa-fixture-session; HttpOnly; Path=/api/auth; SameSite=Lax',
      },
    });
  });
  let popupCount = 0;
  page.on('popup', () => {
    popupCount += 1;
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Abrir cuenta de prueba' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('region', { name: 'Peso' })).toBeVisible();
  expect(returnedToApp).toBe(true);
  expect(popupCount).toBe(0);
});
