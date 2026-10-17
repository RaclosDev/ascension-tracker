import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Utilities & Biomechanical Calculators Flows', () => {
  test('1. Renderizado general de la pantalla Utilidades y Calculadoras', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /utilidades y calculadoras/i })).toBeVisible({
      timeout: 15000,
    });

    // Secciones principales visibles
    await expect(page.getByRole('button', { name: /Estratega Nutricional IA/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Gasto por Pasos')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Gasto Metabólico por Tiempo')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Calculadoras de Nutrición')).toBeVisible({ timeout: 15000 });
  });

  test('2. Calculadora de Gasto por Pasos (Weyand): cálculo biomecánico reactivo', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    // Desplegar acordeón de Gasto por Pasos
    const stepsButton = page.getByRole('button', { name: /gasto por pasos/i });
    await expect(stepsButton).toBeVisible({ timeout: 15000 });
    await stepsButton.click();

    const weightInput = page.getByLabel(/peso corporal \(kg\)/i);
    const stepsInput = page.getByLabel(/pasos totales/i);

    await expect(weightInput).toBeVisible({ timeout: 15000 });
    await expect(stepsInput).toBeVisible({ timeout: 15000 });

    // Introducir 80 kg y 10000 pasos
    await weightInput.fill('80');
    await stepsInput.fill('10000');

    // Comprobar cálculo reactivo de calorías quemadas (~261.95 kcal según Weyand)
    const stepsStatus = page.getByRole('status').filter({ hasText: /calorías quemadas/i });
    await expect(stepsStatus).toBeVisible({ timeout: 15000 });
    await expect(stepsStatus).toContainText(/261|262/);
  });

  test('3. Calculadora de Gasto Metabólico por Tiempo: cálculo de VO2 y calorías', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    // Desplegar acordeón de Gasto Metabólico
    const metabolicButton = page.getByRole('button', { name: /gasto metabólico por tiempo/i });
    await expect(metabolicButton).toBeVisible({ timeout: 15000 });
    await metabolicButton.click();

    const weightInput = page.getByLabel(/^peso \(kg\)$/i);
    const heightInput = page.getByLabel(/altura \(m\)/i);
    const distanceInput = page.getByLabel(/distancia \(metros\)/i);
    const minutesInput = page.getByLabel(/tiempo \(min\)/i);
    const secondsInput = page.getByLabel(/tiempo \(seg\)/i);

    await expect(weightInput).toBeVisible({ timeout: 15000 });
    await expect(heightInput).toBeVisible({ timeout: 15000 });

    // Introducir parámetros de carrera/caminata
    await weightInput.fill('75');
    await heightInput.fill('1.75');
    await distanceInput.fill('1000');
    await minutesInput.fill('5');
    await secondsInput.fill('0');

    // Comprobar cálculo de gasto metabólico total y VO2
    const metabolicStatus = page.getByRole('status').filter({ hasText: /gasto metabólico total/i });
    await expect(metabolicStatus).toBeVisible({ timeout: 15000 });
    await expect(metabolicStatus).toContainText(/kcal/);
    await expect(metabolicStatus).toContainText(/vo2 consumido/i);
  });

  test('4. Calculadoras de Nutrición: precarga de datos y cálculo de TDEE y grasa corporal', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    // Mock de settings con biometría completa para cálculo de TDEE y grasa marina
    await page.route('**/api/settings**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          calorieGoal: 2000,
          age: 28,
          heightCm: 180,
          sex: 'M',
          activityFactor: 1.4,
          startWeight: 80,
          goalWeight: 75,
        },
      });
    });

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    // Verificar presencia de tarjetas de nutrición
    await expect(page.getByText('Gasto de mantenimiento (TDEE)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/% Grasa Corporal \(Marina\)/i)).toBeVisible({
      timeout: 15000,
    });

    // Abrir acordeón de grasa corporal
    const bfHeader = page.getByRole('button', { name: /grasa corporal/i });
    await expect(bfHeader).toBeVisible({ timeout: 15000 });
    await bfHeader.click();

    // Introducir medidas corporales para grasa marina
    const waistInput = page.getByLabel(/cintura \(cm\)/i);
    const neckInput = page.getByLabel(/cuello \(cm\)/i);

    await waistInput.fill('82');
    await neckInput.fill('38');

    // Verificar estimación de grasa corporal
    await expect(page.getByText(/grasa corporal estimada/i)).toBeVisible({ timeout: 15000 });
  });

  test('5. Estratega Nutricional IA: acordeón desplegable accesible', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    const aiHeader = page.getByRole('button', { name: /Estratega Nutricional IA/i });
    await expect(aiHeader).toBeVisible({ timeout: 15000 });
    await aiHeader.click();

    // Comprobar que se expande el contenedor del asistente
    await expect(page.getByText('Tus Macros Restantes de Hoy', { exact: true })).toBeVisible({
      timeout: 15000,
    });
  });
});
