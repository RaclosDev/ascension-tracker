import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Utilities & Biomechanical Calculators Flows', () => {
  test('1. Navegación por pestañas entre Fuerza, Nutrición y Unidades', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /utilidades y calculadoras/i })).toBeVisible({
      timeout: 15000,
    });

    const sectionsNav = page.getByRole('navigation', {
      name: /secciones de utilidades/i,
    });
    const strengthTab = sectionsNav.getByRole('button', { name: /fuerza/i });
    const nutritionTab = sectionsNav.getByRole('button', { name: /nutrici[oó]n/i });
    const toolsTab = sectionsNav.getByRole('button', { name: /unidades/i });

    // Panel Fuerza inicial activo
    await expect(strengthTab).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Calculadora de 1RM y Porcentajes de Fuerza')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Distribución de Discos en Barra (Plate Loader)')).toBeVisible({
      timeout: 15000,
    });

    // Cambiar a pestaña Nutrición
    await nutritionTab.click();
    await expect(page.getByText('Gasto Energético (BMR y TDEE)')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Reparto de Macronutrientes por Comidas')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Calculadora de 1RM y Porcentajes de Fuerza')).not.toBeVisible();

    // Cambiar a pestaña Unidades
    await toolsTab.click();
    await expect(page.getByText('Conversor de Unidades Fitness')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Gasto Energético (BMR y TDEE)')).not.toBeVisible();

    // Regresar a pestaña Fuerza
    await strengthTab.click();
    await expect(page.getByText('Calculadora de 1RM y Porcentajes de Fuerza')).toBeVisible({
      timeout: 15000,
    });
  });

  test('2. Calculadora 1RM (Fuerza): cálculo reactivo y tabla de zonas de intensidad', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    const weightInput = page.getByLabel(/peso levantado/i);
    const repsInput = page.getByLabel(/repeticiones logradas/i);
    const formulaSelect = page.getByLabel(/fórmula matemática/i);

    await expect(weightInput).toBeVisible({ timeout: 15000 });
    await expect(repsInput).toBeVisible({ timeout: 15000 });

    // Introducir peso de 100 kg y 5 repeticiones
    await weightInput.fill('100');
    await repsInput.fill('5');

    // Comprobar visualización reactiva del 1RM estimado en status
    const statusContainer = page.getByRole('status').filter({ hasText: /1RM Estimado/i });
    await expect(statusContainer).toBeVisible({ timeout: 15000 });
    await expect(statusContainer).toContainText(/114\.[0-9]|115|116/);

    // Seleccionar fórmula Epley explícitamente (~116.7 kg teóricos)
    await formulaSelect.selectOption('epley');
    await expect(statusContainer).toContainText(/116\.[57]|117/);

    // Verificar desglose comparativo de fórmulas (Epley y Brzycki con exact match)
    await expect(page.getByText('Epley', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Brzycki', { exact: true })).toBeVisible({ timeout: 15000 });

    // Verificar reactividad de la tabla de zonas de carga e intensidades
    await expect(page.getByText('Tabla de Zonas de Carga e Intensidad')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByRole('cell', { name: '100%' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '95%' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '90%' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '85%' })).toBeVisible();

    // Actualizar peso reactivamente a 120 kg y verificar recalculo
    await weightInput.fill('120');
    await expect(statusContainer).toContainText(/140/);
  });

  test('3. Calculadora de discos (Plate Loader): cálculo simétrico de discos por lado', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    const targetInput = page.getByLabel(/peso total objetivo/i);
    const barSelect = page.getByLabel(/tipo de barra/i);

    await expect(targetInput).toBeVisible({ timeout: 15000 });
    await expect(barSelect).toBeVisible({ timeout: 15000 });

    // Configurar 100 kg con barra estándar de 20 kg
    await targetInput.fill('100');
    await barSelect.selectOption('20');

    // Verificar cálculo de carga por cada lado: (100 - 20) / 2 = 40 kg
    const sideStatus = page.getByRole('status').filter({ hasText: /carga por cada lado/i });
    await expect(sideStatus).toBeVisible({ timeout: 15000 });
    await expect(sideStatus).toContainText('40 kg');
    await expect(sideStatus).toContainText('Total barra + discos: 100 kg');
    await expect(sideStatus).toContainText('✓ Carga Exacta');

    // Desglose simétrico por cada lado (1x25kg + 1x15kg = 40kg)
    await expect(page.getByText(/1 × disco de 25 kg/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/1 × disco de 15 kg/i)).toBeVisible({ timeout: 15000 });

    // Modificar peso reactivamente a 60 kg (20 kg por lado -> 1x20kg)
    await targetInput.fill('60');
    await expect(sideStatus).toContainText('20 kg');
    await expect(page.getByText(/1 × disco de 20 kg/i)).toBeVisible({ timeout: 15000 });
  });

  test('4. Calculadora TDEE y déficit (Nutrición): precarga de settings y cálculo reactivo', async ({
    page,
  }) => {
    // Variable para certificar que NO se llama a la ruta inválida /users/settings
    let forbiddenEndpointCalled = false;
    await page.route('**/users/settings**', async (route) => {
      forbiddenEndpointCalled = true;
      await route.abort();
    });

    let getSettingsCalled = false;
    let putSettingsPayload: unknown = null;

    const mockSettings = {
      age: 25,
      heightCm: 180,
      sex: 'M',
      activityFactor: 1.55,
      targetCalories: 2600,
    };

    await setupAuthMocks(page);

    // Mock específico de GET /api/settings y PUT /api/settings
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'GET') {
        getSettingsCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: mockSettings,
        });
      } else if (route.request().method() === 'PUT') {
        putSettingsPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: putSettingsPayload,
        });
      } else {
        await route.fallback();
      }
    });

    // Mock específico de peso actual en dashboard
    await page.route('**/api/weights/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { currentWeight: 80.0 },
      });
    });

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    // Cambiar a pestaña Nutrición dentro de la navegación de utilidades
    const sectionsNav = page.getByRole('navigation', {
      name: /secciones de utilidades/i,
    });
    await sectionsNav.getByRole('button', { name: /nutrici[oó]n/i }).click();

    // Confirmar que se consumió GET /api/settings y nunca /users/settings
    await expect.poll(() => getSettingsCalled, { timeout: 10000 }).toBe(true);
    expect(forbiddenEndpointCalled).toBe(false);

    // Acotar selectores a la tarjeta de TDEE para evitar colisiones con otros calculadores
    const tdeeCard = page.locator('.accordion-card').filter({ hasText: /Gasto Energético/i });
    await expect(tdeeCard).toBeVisible({ timeout: 15000 });

    const ageInput = tdeeCard.getByLabel(/edad \(años\)/i);
    const heightInput = tdeeCard.getByLabel(/altura \(cm\)/i);
    const weightInput = tdeeCard.getByLabel(/peso corporal \(kg\)/i);

    await expect(ageInput).toHaveValue('25', { timeout: 15000 });
    await expect(heightInput).toHaveValue('180', { timeout: 15000 });
    await expect(weightInput).toHaveValue('80', { timeout: 15000 });

    // Verificar cálculo inicial BMR (1805 kcal) y TDEE (2798 kcal con factor 1.55)
    await expect(tdeeCard.getByText('1805').first()).toBeVisible({ timeout: 15000 });
    await expect(tdeeCard.getByText('2798').first()).toBeVisible({ timeout: 15000 });

    // Modificar valores (cambiar edad a 30) y verificar cálculo reactivo instantáneo
    await ageInput.fill('30');
    // BMR con edad 30: 1805 - (5 * 5) = 1780 kcal, TDEE: 1780 * 1.55 = 2759 kcal
    await expect(tdeeCard.getByText('1780').first()).toBeVisible({ timeout: 15000 });
    await expect(tdeeCard.getByText('2759').first()).toBeVisible({ timeout: 15000 });

    // Si la interfaz presenta botón de guardado en ajustes, verificar persistencia vía PUT /api/settings
    const saveSettingsBtn = tdeeCard.getByRole('button', {
      name: /(guardar.*ajustes|guardar)/i,
    });
    if (await saveSettingsBtn.isVisible().catch(() => false)) {
      await saveSettingsBtn.click();
      await expect.poll(() => putSettingsPayload !== null, { timeout: 5000 }).toBe(true);
    }

    // Confirmación estricta de que /users/settings nunca fue invocado
    expect(forbiddenEndpointCalled).toBe(false);
  });

  test('5. Convertidor de unidades (Unidades): conversión bidireccional reactiva de peso y longitud', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/utilities');
    await expect(page).toHaveURL(/.*utilities.*/, { timeout: 15000 });

    // Cambiar a pestaña Unidades dentro de la barra de utilidades
    const sectionsNav = page.getByRole('navigation', {
      name: /secciones de utilidades/i,
    });
    await sectionsNav.getByRole('button', { name: /unidades/i }).click();
    await expect(page.getByText('Conversor de Unidades Fitness')).toBeVisible({ timeout: 15000 });

    // 1. Conversión de Peso (kg ↔ lbs)
    const kgInput = page.getByLabel('Kilogramos (kg)');
    const lbsInput = page.getByLabel('Libras (lbs)');

    await expect(kgInput).toBeVisible({ timeout: 15000 });
    await expect(lbsInput).toBeVisible({ timeout: 15000 });

    // Introducir peso en kg y comprobar valor reactivo en lbs (100 kg -> 220.46 lbs)
    await kgInput.fill('100');
    await expect(lbsInput).toHaveValue('220.46', { timeout: 10000 });

    // Conversión inversa reactiva (lbs -> kg)
    await lbsInput.fill('110.23');
    await expect(kgInput).toHaveValue('50', { timeout: 10000 });

    // 2. Conversión de Altura / Longitud (cm ↔ in / ft)
    const heightCategoryBtn = page.getByRole('button', { name: /altura/i });
    await heightCategoryBtn.click();

    const cmInput = page.getByLabel('Centímetros (cm)');
    const inInput = page.getByLabel('Pulgadas (in)');
    const ftInput = page.getByLabel('Pies (ft)');

    await expect(cmInput).toBeVisible({ timeout: 15000 });
    await expect(inInput).toBeVisible({ timeout: 15000 });
    await expect(ftInput).toBeVisible({ timeout: 15000 });

    // Introducir altura en cm (180 cm -> 70.87 in, 5 ft)
    await cmInput.fill('180');
    await expect(inInput).toHaveValue('70.87', { timeout: 10000 });
    await expect(ftInput).toHaveValue('5', { timeout: 10000 });

    // Conversión inversa reactiva (pulgadas a cm)
    await inInput.fill('70.87');
    await expect(cmInput).toHaveValue('180', { timeout: 10000 });
  });
});
