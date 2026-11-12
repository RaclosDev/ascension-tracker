import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { SavedPowerProfile } from '../src/lib/coach/powerlifting';

for (const width of [390, 1440]) {
  test(`coach saves powerlifting, restores drafts and handles conflicts at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    let saved: SavedPowerProfile = {
      linkId: 'l1',
      version: 0,
      updatedAt: null,
      profile: {
        enabled: false,
        equipment: 'CLASSIC',
        federation: '',
        trainingMax: { squat: null, bench: null, deadlift: null },
        marks: [],
        notes: '',
      },
    };
    let conflict = false;
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path.endsWith('/checkin-template'))
        return route.fulfill({ json: { questions: [], custom: false } });
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'clients/l1')
        return route.fulfill({
          json: {
            linkId: 'l1',
            client: { name: 'Ana García', email: 'ana@example.test' },
            since: '2026-11-01T10:00:00Z',
            permissions: {
              training: true,
              editTraining: true,
              nutrition: false,
              body: false,
              editNutrition: false,
            },
          },
        });
      if (path === 'clients/l1/powerlifting') {
        if (route.request().method() === 'PUT') {
          if (conflict) {
            saved = { ...saved, version: saved.version + 1 };
            return route.fulfill({
              status: 409,
              json: { message: 'El perfil ha cambiado. Revisa la versión guardada.' },
            });
          }
          const request = route.request().postDataJSON() as {
            profile: SavedPowerProfile['profile'];
            expectedVersion: number;
          };
          expect(request.expectedVersion).toBe(saved.version);
          saved = {
            ...saved,
            profile: request.profile,
            version: saved.version + 1,
            updatedAt: '2026-11-11T10:00:00Z',
          };
        }
        return route.fulfill({ json: saved });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/atletas/l1?seccion=gestion');
    await page.getByLabel('Mostrar herramientas de powerlifting').click();
    await expect(page.getByLabel('Mostrar herramientas de powerlifting')).toBeChecked();
    await page.getByRole('link', { name: 'Powerlifting', exact: true }).click();
    await page.getByLabel('Sentadilla (kg)', { exact: true }).fill('180');
    await page.getByRole('button', { name: 'Añadir marca' }).click();
    await page.getByLabel('Peso (kg)', { exact: true }).fill('190');
    await page.getByLabel('Referencia (opcional)', { exact: true }).fill('Campeonato local');
    await page.reload();
    await expect(page.getByLabel('Sentadilla (kg)', { exact: true })).toHaveValue('180');
    await expect(page.getByLabel('Referencia (opcional)', { exact: true })).toHaveValue(
      'Campeonato local',
    );
    await page.getByRole('button', { name: 'Guardar perfil de powerlifting' }).click();
    await expect(page.getByText('Perfil de powerlifting guardado')).toBeVisible();
    expect(saved.profile.marks[0].kg).toBe(190);
    conflict = true;
    await page.getByLabel('Sentadilla (kg)', { exact: true }).fill('185');
    await page.getByRole('button', { name: 'Guardar perfil de powerlifting' }).click();
    await page.getByRole('button', { name: 'Consultar versión guardada' }).click();
    await expect(
      page.getByText('Existe una versión más reciente.', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Guardar perfil de powerlifting' }),
    ).toBeDisabled();
    await expect(page.getByLabel('Sentadilla (kg)', { exact: true })).toHaveValue('185');
    await page.getByRole('button', { name: 'Descartar borrador' }).click();
    await expect(page.getByLabel('Sentadilla (kg)', { exact: true })).toHaveValue('180');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: info.outputPath('powerlifting-profile.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
}
