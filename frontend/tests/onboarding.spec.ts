import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Onboarding Flow', () => {
  test('new user without settings is shown OnboardingScreen', async ({ page }) => {
    await setupAuthMocks(page);

    // Override /api/settings to return 204 No Content (unconfigured user)
    await page.route('**/api/settings**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 204,
          contentType: 'application/json',
          body: '',
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { success: true },
        });
      }
    });

    await page.goto('/');

    // Verify Onboarding Welcome header is visible
    await expect(page.getByText('Bienvenido a Ascension')).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Para empezar, necesitamos conocer algunos datos básicos sobre ti.'),
    ).toBeVisible({ timeout: 10000 });

    // Verify Step 1 fields exist
    await expect(page.getByText('Sexo')).toBeVisible();
    await expect(page.getByText('Edad')).toBeVisible();
    await expect(page.getByText('Altura (cm)')).toBeVisible();
    await expect(page.getByText(/Peso Inicial \(kg\)/i)).toBeVisible();
    await expect(page.getByText(/Peso Objetivo \(kg\)/i)).toBeVisible();
    await expect(page.getByText('Actividad')).toBeVisible();
  });

  test('user can complete all 4 onboarding steps and submit with weeklyGoal and startDate', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let submittedSettingsPayload: Record<string, unknown> | null = null;
    let mealsResetCalled = false;

    // Track PUT /api/settings and POST /nutrition/meals/reset
    await page.route('**/api/settings**', async (route) => {
      if (route.request().method() === 'GET') {
        if (submittedSettingsPayload) {
          // After submission, return the saved settings
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: submittedSettingsPayload,
          });
        } else {
          // Initial unconfigured state
          await route.fulfill({
            status: 204,
            contentType: 'application/json',
            body: '',
          });
        }
      } else if (route.request().method() === 'PUT') {
        submittedSettingsPayload = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: submittedSettingsPayload,
        });
      }
    });

    await page.route('**/api/nutrition/meals/reset**', async (route) => {
      mealsResetCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true },
      });
    });

    await page.goto('/');

    // --- PASO 1: Datos Personales ---
    await expect(page.getByText('Bienvenido a Ascension')).toBeVisible({ timeout: 15000 });

    // Fill Step 1 inputs
    const ageInput = page.locator('input[type="number"]').nth(0);
    const heightInput = page.locator('input[type="number"]').nth(1);
    const startWeightInput = page.locator('input[type="number"]').nth(2);
    const goalWeightInput = page.locator('input[type="number"]').nth(3);

    await ageInput.fill('28');
    await heightInput.fill('178');
    await startWeightInput.fill('82.5');
    await goalWeightInput.fill('75.0');

    // Click "Continuar" to Step 2
    const continueBtn = page.getByRole('button', { name: 'Continuar' });
    await continueBtn.click();

    // --- PASO 2: Configuración de Comidas ---
    await expect(page.getByText('Configura tus Comidas')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/4 comidas: Desayuno, Comida, Cena y Snacks/i)).toBeVisible();

    // Keep default 4 meals and click "Continuar" to Step 3
    await continueBtn.click();

    // --- PASO 3: Plan de Pérdida de Peso (WeightLossPlan) ---
    await expect(page.getByText(/Plan de Pérdida de Peso|Calorías diarias a comer/i)).toBeVisible({
      timeout: 10000,
    });

    // Click "Guardar y Continuar" to Step 4
    const savePlanBtn = page.getByRole('button', { name: 'Guardar y Continuar' });
    await expect(savePlanBtn).toBeVisible({ timeout: 10000 });
    await savePlanBtn.click();

    // --- PASO 4: Estrategia de Macros ---
    await expect(page.getByText('Estrategia de Macros')).toBeVisible({ timeout: 10000 });
    const finishBtn = page.getByRole('button', { name: 'Finalizar y Empezar' });
    await expect(finishBtn).toBeVisible({ timeout: 10000 });

    // Click "Finalizar y Empezar"
    await finishBtn.click();

    // Verify PUT /api/settings was invoked with weeklyGoal and startDate
    await expect.poll(() => submittedSettingsPayload !== null, { timeout: 10000 }).toBeTruthy();
    expect(submittedSettingsPayload?.weeklyGoal).toBe(0.5);
    expect(submittedSettingsPayload?.startDate).toBeDefined();
    expect(submittedSettingsPayload?.sex).toBe('M');
    expect(submittedSettingsPayload?.age).toBe(28);
    expect(submittedSettingsPayload?.heightCm).toBe(178);
    expect(submittedSettingsPayload?.startWeight).toBe(82.5);
    expect(submittedSettingsPayload?.goalWeight).toBe(75.0);
    expect(submittedSettingsPayload?.macroStrategy).toBe('BALANCED');

    // Verify meals reset was called
    await expect.poll(() => mealsResetCalled, { timeout: 10000 }).toBe(true);
  });

  test('can navigate back and forth between onboarding steps without losing filled data', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.route('**/api/settings**', async (route) => {
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: '',
      });
    });

    await page.goto('/');

    await expect(page.getByText('Bienvenido a Ascension')).toBeVisible({ timeout: 15000 });

    const ageInput = page.locator('input[type="number"]').nth(0);
    const heightInput = page.locator('input[type="number"]').nth(1);
    const startWeightInput = page.locator('input[type="number"]').nth(2);
    const goalWeightInput = page.locator('input[type="number"]').nth(3);

    await ageInput.fill('32');
    await heightInput.fill('180');
    await startWeightInput.fill('85.0');
    await goalWeightInput.fill('80.0');

    // Go to step 2
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Configura tus Comidas')).toBeVisible({ timeout: 10000 });

    // Go back to step 1
    const backBtn = page.getByRole('button', { name: 'Atrás' });
    await backBtn.click();

    // Verify fields are preserved
    await expect(page.getByText('Bienvenido a Ascension')).toBeVisible({ timeout: 10000 });
    await expect(ageInput).toHaveValue('32');
    await expect(heightInput).toHaveValue('180');
    await expect(startWeightInput).toHaveValue('85.0');
    await expect(goalWeightInput).toHaveValue('80.0');
  });
});
