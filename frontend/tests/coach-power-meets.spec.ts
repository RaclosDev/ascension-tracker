import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { MeetContent, PowerMeet } from '../src/lib/coach/powerMeets';

for (const width of [390, 1440]) {
  test(`coach plans and records a competition at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    let saved: PowerMeet | undefined;
    let canEdit = true;
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'clients/l1')
        return route.fulfill({
          json: {
            linkId: 'l1',
            client: { name: 'Ana García', email: 'ana@example.test' },
            since: '2026-11-01T10:00:00Z',
            permissions: {
              training: true,
              editTraining: canEdit,
              nutrition: false,
              body: false,
              editNutrition: false,
            },
          },
        });
      if (path === 'clients/l1/powerlifting')
        return route.fulfill({
          json: {
            linkId: 'l1',
            version: 0,
            updatedAt: null,
            profile: {
              enabled: true,
              equipment: 'CLASSIC',
              federation: 'AEPower',
              trainingMax: { squat: null, bench: null, deadlift: null },
              marks: [],
              notes: '',
            },
          },
        });
      if (path.startsWith('clients/l1/powerlifting/meets')) {
        if (route.request().method() !== 'GET') {
          const request = route.request().postDataJSON() as {
            content: MeetContent;
            expectedVersion: number;
          };
          expect(request.expectedVersion).toBe(saved?.version ?? 0);
          saved = {
            id: 'm1',
            linkId: 'l1',
            content: request.content,
            version: (saved?.version ?? 0) + 1,
            updatedAt: '2026-11-11T10:00:00Z',
          };
          return route.fulfill({ json: saved });
        }
        return route.fulfill({ json: saved ? [saved] : [] });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/alumnos/l1?seccion=powerlifting&vista=competiciones');
    await page.getByRole('button', { name: 'Nueva competición' }).click();
    await page.getByLabel('Nombre de la competición').fill('Campeonato de primavera');
    await page.getByLabel('Fecha de competición').fill('2027-06-01');
    await expect(page.getByLabel('Federación', { exact: true })).toHaveValue('AEPower');
    await page.getByRole('button', { name: 'Añadir bloque' }).click();
    await page.getByLabel('Nombre del bloque').fill('Preparación específica');
    await page.getByLabel('Inicio', { exact: true }).fill('2027-04-01');
    await page.getByLabel('Fin', { exact: true }).fill('2027-05-25');
    await page.getByLabel('Objetivo del bloque').fill('Practicar comandos y afinar aperturas');
    for (const [lift, planned, actual] of [
      ['Sentadilla', '180', '177.5'],
      ['Press de banca', '110', '107.5'],
      ['Peso muerto', '220', '215'],
    ]) {
      const first = page.getByRole('group', { name: `${lift} · Intento 1`, exact: true });
      await first.getByLabel('Previsto (kg)').fill(planned);
      await first.getByLabel('Realizado (kg)').fill(actual);
      await first.getByRole('combobox', { name: 'Resultado', exact: true }).selectOption('VALID');
      for (const number of [2, 3]) {
        await page
          .getByRole('group', { name: `${lift} · Intento ${number}`, exact: true })
          .getByRole('combobox', { name: 'Resultado', exact: true })
          .selectOption('WITHDRAWN');
      }
    }
    await expect(page.getByText('510 kg', { exact: true })).toBeVisible();
    await expect(page.getByText('500 kg', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Nombre del bloque')).toHaveValue('Preparación específica');
    await page.getByRole('button', { name: 'Guardar competición', exact: true }).click();
    await expect(page.getByText('Competición guardada', { exact: true })).toBeVisible();
    expect(saved?.content.attempts).toHaveLength(9);
    expect(saved?.content.blocks).toHaveLength(1);
    await page.getByLabel('Archivar competición conservando los resultados').check();
    await page.getByRole('button', { name: 'Guardar competición', exact: true }).click();
    await expect.poll(() => saved?.content.archived).toBe(true);
    await page.getByRole('button', { name: 'Volver a competiciones' }).click();
    await expect(page.getByRole('button', { name: /Campeonato de primavera/ })).toHaveCount(0);
    await page.getByLabel('Mostrar archivadas').check();
    await page.getByRole('button', { name: /Campeonato de primavera/ }).click();
    canEdit = false;
    await page.reload();
    await expect(page.getByLabel('Nombre de la competición')).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Guardar competición', exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('heading', { name: 'Intentos y resultado' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('powerlifting-meet.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
}
