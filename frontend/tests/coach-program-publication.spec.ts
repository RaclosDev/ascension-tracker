import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { Program } from '../src/lib/coach/coachPrograms';

for (const width of [390, 1440]) {
  test(`coach recovers, previews and publishes a program at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    let saved: Program | null = null;
    let revision = 0;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if ((path === 'programs' || path === 'programs/p1') && route.request().method() !== 'GET') {
        saved = {
          ...(route.request().postDataJSON() as Program),
          id: 'p1',
          updatedAt: `2026-11-11T12:00:0${++revision}Z`,
        };
        return route.fulfill({ status: path === 'programs' ? 201 : 200, json: saved });
      }
      if (path === 'programs')
        return route.fulfill({ json: saved ? [{ ...saved, dayCount: saved.days.length }] : [] });
      if (path === 'programs/p1') return route.fulfill({ json: saved });
      return route.fulfill({ json: [] });
    });

    await page.goto('/entrenador/programas');
    await expect(page.getByRole('heading', { name: 'Biblioteca de entrenamiento' })).toBeVisible();
    await page.getByRole('link', { name: 'Nuevo programa', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Fuerza · bloque inicial');
    await page.getByRole('button', { name: 'Añadir entrenamiento el lunes' }).click();
    await page.getByLabel('Buscar ejercicio para añadir').fill('banca');
    await page.getByRole('button', { name: /^Press de Banca Plano$/ }).click();
    await page.reload();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Fuerza · bloque inicial');
    await expect(
      page.getByText('Borrador guardado en esta pestaña.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
    await expect(page).toHaveURL(/programas\/p1$/);
    await expect(
      page.getByRole('button', { name: 'Guardar borrador', exact: true }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Vista previa del programa' })).toContainText(
      'Press de Banca Plano',
    );
    await page.screenshot({ path: info.outputPath('program-preview.png'), fullPage: true });
    await page.getByRole('button', { name: 'Guardar listo para asignar' }).click();
    await expect(
      page.getByText('Versión guardada: lista para asignar.', { exact: false }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Volver a programas' }).click();
    await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('DRAFT');
    await expect(page.getByText('No hay programas con esos filtros.')).toBeVisible();
    await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('READY');
    await expect(page.getByText('Fuerza · bloque inicial', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('program-library.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
}
