import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { Checkin } from '../src/lib/coach/checkins';

for (const width of [1440, 390]) {
  test(`nutrition check-in restores an unsent draft at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/coach/profile', (route) => route.fulfill({ json: { coach: false } }));
    let current: Checkin | null = null;
    await page.route('**/api/coaching/coaches/l1/checkin*', async (route) => {
      if (route.request().url().endsWith('/checkins'))
        return route.fulfill({ json: current ? [current] : [] });
      if (route.request().method() === 'PUT') {
        const body = route.request().postDataJSON();
        expect(body.trainingAdherence).toBeNull();
        current = {
          ...body,
          id: 'c1',
          linkId: 'l1',
          weekStart: '2026-11-09',
          weightAvg: null,
          answers: [{ question: '¿Cómo has organizado las comidas?', answer: body.answers[0] }],
          coachReply: null,
          repliedAt: null,
          createdAt: '2026-11-11T10:00:00Z',
          updatedAt: '2026-11-11T10:00:00Z',
        };
        return route.fulfill({ json: current });
      }
      return route.fulfill({
        json: {
          linkId: 'l1',
          coach: { name: 'Laura', email: 'laura@example.com' },
          weekStart: '2026-11-09',
          questions: ['¿Cómo has organizado las comidas?'],
          scoreKeys: ['energy', 'sleep', 'dietAdherence'],
          current,
        },
      });
    });
    await page.goto('/checkin/l1');
    await page
      .getByLabel('¿Cómo has organizado las comidas?')
      .fill('He preparado las comidas del trabajo.');
    await expect(page.getByRole('group', { name: /Adherencia al entreno/ })).toHaveCount(0);
    for (const key of ['energy', 'sleep', 'dietAdherence'])
      await page
        .locator('label')
        .filter({ has: page.locator(`input[name="${key}"][value="4"]`) })
        .click();
    page.on('dialog', (dialog) => dialog.accept());
    await page.reload();
    await expect(page.getByLabel('¿Cómo has organizado las comidas?')).toHaveValue(
      'He preparado las comidas del trabajo.',
    );
    await expect(page.locator('input[name="dietAdherence"][value="4"]')).toBeChecked();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const form = await page.locator('form').boundingBox();
    const lastScore = await page
      .locator('label')
      .filter({ has: page.locator('input[name="energy"][value="5"]') })
      .boundingBox();
    expect(lastScore!.x + lastScore!.width).toBeLessThan(form!.x + form!.width - 12);
    await page.screenshot({
      path: testInfo.outputPath('checkin-draft.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Enviar check-in' }).click();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
    await expect(page.getByText(/Borrador guardado/)).toHaveCount(0);
  });
}
