import { expect, test } from '@playwright/test';

test('Google is prepared before opening, the first click opens a window, and Escape restores focus', async ({
  page,
}) => {
  await page.route('**/api/auth/config**', (route) =>
    route.fulfill({ json: { googleClientId: 'ci-mock-id' } }),
  );
  await page.route('**/api/auth/refresh**', (route) => route.fulfill({ status: 401, body: '' }));
  await page.route('https://accounts.google.com/gsi/client**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.google = { accounts: { id: {
        initialize() {},
        renderButton(container) {
          const button = document.createElement('button');
          button.textContent = 'Abrir cuenta de prueba';
          button.onclick = () => window.open('about:blank', '_blank');
          container.replaceChildren(button);
        }
      } } };`,
    }),
  );
  await page.goto('/login');
  const entry = page.getByRole('button', { name: 'Continuar con Google', exact: true });
  const googleButton = page.getByText('Abrir cuenta de prueba', { exact: true });
  await expect(googleButton).toHaveCount(1);
  await expect(googleButton).toBeHidden();
  await entry.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const popupPromise = page.waitForEvent('popup');
  await googleButton.click();
  await (await popupPromise).close();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(entry).toBeFocused();
  await expect(googleButton).toHaveCount(1);
  await expect(googleButton).toBeHidden();
});
