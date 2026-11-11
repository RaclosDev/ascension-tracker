import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { NutritionTemplate } from '../src/lib/coach/nutritionTemplates';
import type { NutritionPlan, NutritionPlanRequest } from '../src/lib/coach/nutritionPlan';

for (const width of [390, 1440]) {
  test(`coach saves a reusable nutrition plan and adapts a separate client copy at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    let template: NutritionTemplate | null = null;
    let published: NutritionPlan | null = null;
    let publications = 0;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      const method = route.request().method();
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'recipes') return route.fulfill({ json: [] });
      if (path === 'nutrition-templates' && method === 'POST') {
        const request = route.request().postDataJSON() as {
          name: string;
          plan: NutritionPlanRequest;
        };
        template = {
          id: 't1',
          name: request.name,
          version: 1,
          updatedAt: '2026-11-11T10:00:00Z',
          content: {
            ...request.plan,
            training: { ...request.plan.training, kcal: 2550 },
            rest: { ...request.plan.rest, kcal: 2040 },
            meals: [],
          },
        };
        return route.fulfill({ status: 201, json: template });
      }
      if (path === 'nutrition-templates')
        return route.fulfill({
          json: template ? [{ ...template, trainingKcal: 2550, restKcal: 2040 }] : [],
        });
      if (path === 'nutrition-templates/t1') return route.fulfill({ json: template });
      if (path === 'clients/l1')
        return route.fulfill({
          json: {
            linkId: 'l1',
            client: { name: 'Ana García', email: 'ana@example.test', picture: null },
            since: '2026-11-01T10:00:00Z',
            permissions: {
              training: false,
              editTraining: false,
              body: false,
              nutrition: true,
              editNutrition: true,
            },
          },
        });
      if (path === 'clients/l1/nutrition-plan')
        return published ? route.fulfill({ json: published }) : route.fulfill({ status: 204 });
      if (path === 'clients/l1/nutrition-plan/publish') {
        const request = route.request().postDataJSON() as {
          plan: NutritionPlanRequest;
          expectedPlanId: string | null;
        };
        expect(request.expectedPlanId).toBeNull();
        publications++;
        published = {
          ...request.plan,
          id: 'p1',
          coach: { name: 'Coach', email: 'coach@example.test', picture: null },
          createdAt: '2026-11-11T10:00:00Z',
          training: { ...request.plan.training, kcal: 2630 },
          rest: { ...request.plan.rest, kcal: 2040 },
          meals: [],
        };
        return route.fulfill({ json: published });
      }
      if (path === 'clients/l1/targets')
        return route.fulfill({
          json: { kcal: 2040, customProteinGrams: 180, customCarbsGrams: 150, customFatGrams: 80 },
        });
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/planificacion');
    await page.getByRole('link', { name: 'Abrir pautas' }).click();
    await expect(page.getByRole('heading', { name: 'Biblioteca de pautas' })).toBeVisible();
    await page.getByRole('link', { name: 'Crear pauta' }).click();
    await page.getByLabel('Nombre de la pauta').fill('Base de entrenamiento');
    for (const [label, value] of Object.entries({
      'Proteína día de entreno': '180',
      'Carbohidratos día de entreno': '300',
      'Grasa día de entreno': '70',
      'Proteína día de descanso': '180',
      'Carbohidratos día de descanso': '150',
      'Grasa día de descanso': '80',
    }))
      await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByLabel('Notas para tu alumno').fill('Adaptar al horario del alumno');
    await page.reload();
    await expect(page.getByLabel('Nombre de la pauta')).toHaveValue('Base de entrenamiento');
    await expect(page.getByLabel('Proteína día de entreno', { exact: true })).toHaveValue('180');
    await page.getByRole('button', { name: 'Vista previa de la pauta' }).click();
    await expect(page.getByRole('region', { name: 'Vista previa de la pauta' })).toContainText(
      '2550 kcal',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('region', { name: 'Vista previa de la pauta' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('library-preview.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Guardar en biblioteca' }).click();
    await expect(page).toHaveURL(/\/entrenador\/pautas\/t1$/);
    await expect(page.getByRole('button', { name: 'Guardar en biblioteca' })).toBeDisabled();
    expect(publications).toBe(0);
    await page.goto('/entrenador/alumnos/l1?seccion=nutricion');
    await page.getByRole('button', { name: 'Usar pauta de biblioteca' }).click();
    await page.getByLabel('Pauta de biblioteca', { exact: true }).selectOption('t1');
    await page.getByRole('button', { name: 'Copiar al borrador' }).click();
    await expect(page.getByLabel('Proteína día de entreno', { exact: true })).toHaveValue('180');
    expect(publications).toBe(0);
    await page.getByLabel('Proteína día de entreno', { exact: true }).fill('200');
    await page.getByLabel('Notas para tu alumno').fill('Adaptación para Ana');
    await page
      .getByLabel('Proteína día de entreno', { exact: true })
      .evaluate((element) => element.scrollIntoView({ block: 'center' }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('client-copy.png'), animations: 'disabled' });
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Publicar pauta', exact: true }).click();
    await expect(page.getByText('Pauta de nutrición publicada', { exact: true })).toBeVisible();
    expect(publications).toBe(1);
    await page.goto('/entrenador/pautas/t1');
    await expect(page.getByLabel('Proteína día de entreno', { exact: true })).toHaveValue('180');
    await expect(page.getByLabel('Notas para tu alumno')).toHaveValue(
      'Adaptar al horario del alumno',
    );
    expect(errors).toEqual([]);
  });
}
