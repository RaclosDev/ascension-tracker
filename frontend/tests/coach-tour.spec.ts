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
  test(`real screens, navigation and spotlight for every step at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: width === 1920 ? 900 : 844 });
    await setupNewCoach(page);
    const writes: string[] = [];
    const escapedCoachReads: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => {
      if (
        /\/api\//.test(request.url()) &&
        !['GET', 'HEAD'].includes(request.method()) &&
        !request.url().includes('/auth/')
      )
        writes.push(request.url());
      if (/\/api\/coach\//.test(request.url()) && request.frame().parentFrame())
        escapedCoachReads.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/entrenador');
    await page.getByRole('button', { name: 'Empezar guía interactiva' }).click();
    await expect(page).toHaveURL(/\/guia\/recorrido$/);
    for (const [index, step] of COACH_TOUR_STEPS.entries()) {
      await test.step(step.title, async () => {
        await expect(page.getByRole('heading', { name: step.title, exact: true })).toBeVisible();
        const next = page.getByRole('button', {
          name: index === COACH_TOUR_STEPS.length - 1 ? 'Terminar tour' : 'Siguiente',
          exact: true,
        });
        await expect(next).toBeEnabled({ timeout: 20000 });
        const frame = page.frames().find((item) => item.parentFrame());
        expect(frame).toBeTruthy();
        expect(new URL(frame!.url()).pathname + new URL(frame!.url()).search).toBe(step.path);
        await expect(frame!.locator('[role="alert"]')).toHaveCount(0);
        const popup = await page.locator('.coach-tour-popover').boundingBox();
        expect(popup!.x).toBeGreaterThanOrEqual(0);
        expect(popup!.x + popup!.width).toBeLessThanOrEqual(width);
        if (['prescription', 'preview', 'subscription'].includes(step.id))
          await page.screenshot({ path: testInfo.outputPath(`tour-${step.id}-${width}.png`) });
        if (step.id === 'prescription')
          await expect(frame!.locator('[data-tour="exercise-prescription"]')).toContainText(
            'Sentadilla',
          );
        await next.click();
      });
    }
    await expect(
      page.getByRole('heading', { name: 'Tour del entrenador', exact: true }),
    ).toBeVisible();
    await page.goto('/entrenador');
    await expect(page.getByRole('heading', { name: 'Empieza por una invitación' })).toBeVisible();
    expect(writes).toEqual([]);
    expect(escapedCoachReads).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('exit, resume after refresh, jump backwards from preview and repeat from Tour tab', async ({
  page,
}) => {
  await setupNewCoach(page);
  await page.goto('/entrenador');
  await page.getByRole('button', { name: 'Ahora no', exact: true }).click();
  await page.getByRole('button', { name: 'Tour', exact: true }).click();
  await page.getByRole('button', { name: 'Repetir tour desde el principio' }).click();
  const preview = COACH_TOUR_STEPS.findIndex((step) => step.id === 'preview');
  await page.getByLabel('Ir a un paso').selectOption(String(preview));
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeEnabled({
    timeout: 20000,
  });
  await page.reload();
  await expect(page.getByLabel('Ir a un paso')).toHaveValue(String(preview));
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeEnabled({
    timeout: 20000,
  });
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeEnabled({
    timeout: 20000,
  });
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('heading', { name: 'Tour del entrenador', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Continuar tour/ }).click();
  await expect(page.getByLabel('Ir a un paso')).toHaveValue(String(preview - 1));
  await page.getByRole('button', { name: 'Cerrar tour' }).click();
  await page.getByRole('button', { name: 'Repetir tour desde el principio' }).click();
  await expect(page.getByLabel('Ir a un paso')).toHaveValue('0');
  await page.keyboard.press('Tab');
  await expect(page.locator('.coach-tour-popover :focus')).toHaveCount(1);
});
