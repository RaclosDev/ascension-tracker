import { test, expect, type Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import { COACH_TOUR_STEPS } from '../src/components/coach/tour/steps';

async function setupNewCoach(page: Page) {
  await setupAuthMocks(page, { showCoachTour: true });
  await page.route('**/api/coach/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path.endsWith('/profile') ? { coach: true } : [] });
  });
  await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
}

for (const width of [1920, 390]) {
  test(`new coach can try the complete tour without any students or mutations at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1920 ? 900 : 844 });
    await setupNewCoach(page);
    const writes: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (
        /\/api\/(coach|coaching|workouts|settings)/.test(request.url()) &&
        !['GET', 'HEAD'].includes(request.method())
      )
        writes.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/entrenador');
    const welcome = page.getByRole('dialog', { name: 'Conoce tu espacio de entrenador' });
    await expect(welcome).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(welcome.locator(':focus')).toHaveCount(1);
    await welcome.getByRole('button', { name: 'Empezar guía interactiva' }).click();
    for (const [index, step] of COACH_TOUR_STEPS.entries()) {
      await expect(page.getByRole('heading', { name: step.title, exact: true })).toBeVisible();
      const scene = page.getByRole('region', {
        name: `Demostración: ${step.section}`,
        exact: true,
      });
      if (step.id === 'notes') {
        await page.getByLabel('Comentario para Lucía').fill('Descarga de prueba.');
        await page.getByLabel('Nota privada del entrenador').fill('Privado: revisar recuperación.');
      }
      await scene.getByRole('button', { name: step.action, exact: true }).click();
      if (step.id === 'edit') {
        await page.getByLabel('Carga (kg)').fill('72.5');
        await expect(scene).toContainText('72.5');
      }
      if (step.id === 'publish') {
        const preview = page.getByRole('region', { name: 'Vista de Lucía' });
        await expect(preview).toContainText('Descarga de prueba.');
        await expect(preview).toContainText('72.5');
        await expect(preview).not.toContainText('Privado:');
        await page.screenshot({
          path: testInfo.outputPath(`tour-publicacion-${width}.png`),
          fullPage: true,
        });
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      if (index < COACH_TOUR_STEPS.length - 1)
        await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
    }
    await expect(page).toHaveURL(/\/entrenador$/);
    await expect(welcome).not.toBeVisible();
    await page.getByRole('link', { name: 'Guía interactiva', exact: true }).click();
    await expect(page.getByRole('heading', { name: COACH_TOUR_STEPS[0].title })).toBeVisible();
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('dismiss, resume after refresh, replay, pause and exit with the keyboard', async ({
  page,
}) => {
  await setupNewCoach(page);
  await page.goto('/entrenador');
  await page.getByRole('button', { name: 'Ahora no', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Guía interactiva', exact: true }).click();
  await page.getByLabel('Ir a un paso').selectOption('5');
  await page.reload();
  await expect(page.getByLabel('Ir a un paso')).toHaveValue('5');
  await page.getByRole('button', { name: 'Reiniciar demo' }).click();
  await page.getByRole('button', { name: 'Reproducir recorrido' }).click();
  await expect(page.getByRole('status')).toContainText('Lucía tiene un check-in pendiente');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Reproducir recorrido' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/entrenador$/);
});
