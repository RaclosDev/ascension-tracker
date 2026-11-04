import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test('descartar el entrenamiento en móvil cierra el diálogo y deja la app usable', async ({
  page,
}) => {
  await setupAuthMocks(page);
  await page.route(/\/api\/workouts(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { content: [], number: 0, totalPages: 0 },
    }),
  );
  await page.goto('/workout');

  await page.getByRole('button', { name: /empezar entrenamiento/i }).tap();
  await page
    .locator('.start-workout-option')
    .filter({ hasText: /entrenamiento vac[ií]o/i })
    .tap();
  // El selector de ejercicios se abre al empezar vacío; ciérralo.
  await page.locator('.workout-sheet-close').tap();
  await expect(page.locator('.workout-sheet')).toHaveCount(0);

  const discard = page.getByRole('button', { name: /^descartar$/i });
  await discard.scrollIntoViewIfNeeded();
  await discard.tap();

  const dialog = page.getByRole('alertdialog', { name: /descartar la sesión/i });
  await expect(dialog).toBeVisible();
  // El diálogo debe quedar fijo y entero dentro de la pantalla: antes la hoja de papel
  // (.card) le quitaba el position: fixed y caía bajo el pliegue, tapada por el overlay.
  await expect(dialog).toHaveCSS('position', 'fixed');
  const confirm = dialog.getByRole('button', { name: /^descartar$/i });
  await expect(confirm).toBeInViewport({ ratio: 1 });
  await confirm.tap();

  await expect(dialog).toBeHidden();
  await expect(page.locator('.workout-footer-actions')).toHaveCount(0);
  await expect(page.locator('[data-state="open"]')).toHaveCount(0);

  // Radix bloquea el body mientras el diálogo está abierto; debe liberarse al descartar.
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).pointerEvents))
    .not.toBe('none');
  await expect
    .poll(() => page.evaluate(() => document.body.hasAttribute('data-scroll-locked')))
    .toBe(false);

  // La app sigue respondiendo a toques: se puede empezar otro entrenamiento.
  await page.getByRole('button', { name: /empezar entrenamiento/i }).tap();
  await expect(page.locator('.start-workout-option').first()).toBeVisible();
});
