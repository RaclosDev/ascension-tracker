import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { NutritionPlan, NutritionPlanRequest } from '../src/lib/coach/nutritionPlan';

for (const width of [390, 1440]) {
  test(`coach recovers, previews and publishes nutrition with immutable history at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    const original: NutritionPlan = {
      id: 'p1',
      coach: { name: 'Laura', email: 'laura@example.test', picture: null },
      training: { protein: 180, carbs: 300, fat: 70, kcal: 2550 },
      rest: { protein: 180, carbs: 150, fat: 80, kcal: 2040 },
      notes: 'Versión original',
      createdAt: '2026-11-01T10:00:00Z',
      meals: [
        {
          dayType: 'TRAINING',
          slotName: 'Comida',
          recipeId: 'r1',
          name: 'Bowl original',
          description: 'Preparación publicada',
          servings: 1,
          protein: 40,
          carbs: 50,
          fat: 10,
          kcal: 450,
        },
      ],
    };
    let current = original;
    let submitted: { expectedPlanId: string | null; plan: NutritionPlanRequest } | null = null;
    let targetReads = 0;
    let adherenceReads = 0;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
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
      if (path === 'recipes')
        return route.fulfill({
          json: [
            {
              id: 'r1',
              name: 'Bowl actualizado',
              description: 'Preparación actual',
              protein: 45,
              carbs: 60,
              fat: 12.5,
              kcal: 533,
              updatedAt: '2026-11-11T10:00:00Z',
            },
          ],
        });
      if (path === 'clients/l1/nutrition-plan') return route.fulfill({ json: current });
      if (path === 'clients/l1/nutrition-plan/publish') {
        submitted = route.request().postDataJSON() as {
          expectedPlanId: string | null;
          plan: NutritionPlanRequest;
        };
        current = {
          ...original,
          ...submitted.plan,
          id: 'p2',
          createdAt: '2026-11-11T10:00:00Z',
          training: { ...submitted.plan.training, kcal: 2630 },
          rest: original.rest,
          meals: [
            {
              ...original.meals[0],
              name: 'Bowl actualizado',
              description: 'Preparación actual',
              servings: 1.5,
              protein: 67.5,
              carbs: 90,
              fat: 18.8,
              kcal: 799,
            },
          ],
        };
        return route.fulfill({ json: current });
      }
      if (path === 'clients/l1/nutrition-plan/history')
        return route.fulfill({
          json: [
            { ...current, status: 'ACTIVE', endedAt: null },
            { ...original, status: 'ENDED', endedAt: '2026-11-11T10:00:00Z' },
          ],
        });
      if (path === 'clients/l1/nutrition-plan/history/p1') return route.fulfill({ json: original });
      if (path === 'clients/l1/targets') {
        targetReads++;
        return route.fulfill({
          json: {
            kcal: current.training.kcal,
            customProteinGrams: current.training.protein,
            customCarbsGrams: current.training.carbs,
            customFatGrams: current.training.fat,
          },
        });
      }
      if (path === 'clients/l1/nutrition-plan/adherence') adherenceReads++;
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/atletas/l1?seccion=nutricion');
    await page.getByLabel('Proteína día de entreno', { exact: true }).fill('200');
    await page.getByLabel('Raciones de la comida 1 día de entreno').fill('1.5');
    await page.getByLabel('Notas para tu atleta').fill('Versión preparada para Ana');
    await page.reload();
    await expect(page.getByLabel('Proteína día de entreno', { exact: true })).toHaveValue('200');
    await expect(page.getByLabel('Raciones de la comida 1 día de entreno')).toHaveValue('1.5');
    await expect(page.getByText('799 kcal', { exact: true })).toBeVisible();
    await page
      .getByLabel('Raciones de la comida 1 día de entreno')
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath('nutrition-editor.png'),
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Vista previa de la pauta', exact: true }).click();
    const preview = page.getByRole('region', { name: 'Vista previa de la pauta' });
    await expect(preview).toContainText('Bowl actualizado');
    await expect(preview).toContainText('1.5 raciones · 799 kcal');
    await preview
      .getByText('Comida: Bowl actualizado')
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.screenshot({
      path: info.outputPath('nutrition-preview.png'),
      animations: 'disabled',
    });
    const targetReadsBefore = targetReads;
    const adherenceReadsBefore = adherenceReads;
    await page.getByRole('button', { name: 'Publicar pauta', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Publicar pauta nutricional' });
    await expect(confirmation).toContainText('solo para este atleta');
    await confirmation.getByRole('button', { name: 'Publicar pauta', exact: true }).click();
    await expect(page.getByText('Pauta de nutrición publicada', { exact: true })).toBeVisible();
    await expect.poll(() => targetReads).toBeGreaterThan(targetReadsBefore);
    await expect.poll(() => adherenceReads).toBeGreaterThan(adherenceReadsBefore);
    expect(submitted).toMatchObject({
      expectedPlanId: 'p1',
      plan: {
        training: { protein: 200 },
        notes: 'Versión preparada para Ana',
        meals: [{ recipeId: 'r1', servings: 1.5, expectedRecipeUpdatedAt: '2026-11-11T10:00:00Z' }],
      },
    });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Publicar pauta', exact: true })).toBeDisabled();
    await expect(page.getByText('La pauta publicada ha cambiado', { exact: false })).toHaveCount(0);
    await page.getByRole('button', { name: 'Historial de pautas' }).click();
    const archived = page.getByRole('listitem').filter({ hasText: 'Finalizada' });
    await archived.getByRole('button', { name: 'Ver versión', exact: true }).click();
    await expect(archived).toContainText('Bowl original');
    await expect(archived).toContainText('1 raciones · 450 kcal');
    await expect(archived).not.toContainText('Bowl actualizado');
    await expect(archived.getByRole('spinbutton')).toHaveCount(0);
    await archived
      .getByText('Comida: Bowl original')
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.screenshot({
      path: info.outputPath('nutrition-history.png'),
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
