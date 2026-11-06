import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Settings Page & User Preferences Flows', () => {
  test('shows the section menu and switches sections through the URL', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/settings');

    const nav = page.getByRole('navigation', { name: 'Secciones de ajustes' });
    const personalLink = nav.getByRole('link', { name: 'Datos personales' });
    await expect(personalLink).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Apariencia' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Entrenamiento' })).toBeVisible();

    // Personal data is the default section, shown without any extra click
    await expect(page.locator('.form-group select').first()).toBeVisible();
    await expect(page.locator('.form-group input[type="number"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Guardar Cambios/i })).toBeVisible();

    // Only one section is shown at a time and the active one lives in the URL
    await nav.getByRole('link', { name: 'Datos y cuenta' }).click();
    await expect(page).toHaveURL(/\/settings\?section=data$/);
    await expect(page.getByText('Copia de Seguridad y Privacidad')).toBeVisible();
    await expect(page.getByText('Cuenta', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Guardar Cambios/i })).toHaveCount(0);

    // Deep links open the requested section directly
    await page.goto('/settings?section=theme');
    await expect(nav.getByRole('link', { name: 'Apariencia' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: 'Tema y Apariencia' })).toBeVisible();
  });

  test('allows updating personal biometrics and submits PUT /api/settings', async ({ page }) => {
    await setupAuthMocks(page);

    let putSettingsPayload: Record<string, unknown> | null = null;
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'PUT') {
        putSettingsPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { ...putSettingsPayload },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/settings');

    // Ensure personal section is shown
    const personalHeader = page
      .getByRole('navigation', { name: 'Secciones de ajustes' })
      .getByRole('link', { name: 'Datos personales' });
    await personalHeader.click();

    // Fill new biometrics
    const ageInput = page
      .locator('.form-group')
      .filter({ hasText: /^Edad$/i })
      .locator('input');
    await ageInput.fill('32');

    const heightInput = page
      .locator('.form-group')
      .filter({ hasText: /^Altura/i })
      .locator('input');
    await heightInput.fill('185');

    // Click "Guardar Cambios"
    const saveBtn = page.getByRole('button', { name: /Guardar Cambios/i });
    await saveBtn.click();

    // Verify PUT /api/settings was called with updated biometrics
    await expect.poll(() => putSettingsPayload !== null, { timeout: 5000 }).toBeTruthy();
    expect(putSettingsPayload?.age).toBe(32);
    expect(putSettingsPayload?.heightCm).toBe(185);

    // Toast notification
    await expect(page.getByText(/Datos personales guardados/i)).toBeVisible({ timeout: 5000 });
  });

  test('configures workout preferences with rest timer friendly format and RPE toggle', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/settings');

    // Open Workout section
    const workoutHeader = page
      .getByRole('navigation', { name: 'Secciones de ajustes' })
      .getByRole('link', { name: 'Entrenamiento' });
    await workoutHeader.click();

    // Rest preset input
    const restInput = page.getByRole('spinbutton', { name: /Descanso base en segundos/i });
    await expect(restInput).toBeVisible();

    // Change to 120s and verify value
    await restInput.fill('120');
    await expect(restInput).toHaveValue('120');

    // Change to 90s and verify value
    await restInput.fill('90');
    await expect(restInput).toHaveValue('90');

    // Toggle RPE checkbox
    const rpeCheckbox = page
      .locator('.form-group')
      .filter({ hasText: /Mostrar RPE/i })
      .locator('input[type="checkbox"]');
    await expect(rpeCheckbox).toBeVisible();
    const wasChecked = await rpeCheckbox.isChecked();
    await rpeCheckbox.click();
    expect(await rpeCheckbox.isChecked()).toBe(!wasChecked);
  });

  test('toggles hidden equipment and syncs with workout preferences', async ({ page }) => {
    await setupAuthMocks(page);

    let putWorkoutPrefsPayload: Record<string, unknown> | null = null;
    await page.route('**/api/workout-preferences', async (route) => {
      if (route.request().method() === 'PUT') {
        putWorkoutPrefsPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { ...putWorkoutPrefsPayload },
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/settings');

    // Open Workout section
    const workoutHeader = page
      .getByRole('navigation', { name: 'Secciones de ajustes' })
      .getByRole('link', { name: 'Entrenamiento' });
    await workoutHeader.click();

    // Toggle equipment e.g. "Multipower (Smith)" checkbox
    const multipowerLabel = page.locator('label').filter({ hasText: /Multipower/i });
    await expect(multipowerLabel).toBeVisible();
    await multipowerLabel.click();

    // Verify PUT /api/workout-preferences includes multipower in hiddenEquipments
    await expect.poll(() => putWorkoutPrefsPayload !== null, { timeout: 5000 }).toBeTruthy();
    expect((putWorkoutPrefsPayload?.hiddenEquipments as string[]) || []).toContain('multipower');
  });

  test('theme color preset updates custom accent color and persists in localStorage', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.goto('/settings');

    // Open Theme section
    const themeHeader = page
      .getByRole('navigation', { name: 'Secciones de ajustes' })
      .getByRole('link', { name: 'Apariencia' });
    await themeHeader.click();

    // Click on preset color #E11D48
    const roseColorBtn = page.locator('button[title="#E11D48"]');
    await expect(roseColorBtn).toBeVisible();
    await roseColorBtn.click();

    // Verify localStorage has been updated
    const storedColor = await page.evaluate(() => localStorage.getItem('ascension_custom_color'));
    expect(storedColor).toBe('#E11D48');

    // Check explanatory text
    await expect(page.getByText(/El color acento que elegiste es el #E11D48/i)).toBeVisible();
  });

  test('logout button triggers session cleanup and redirects to login', async ({ page }) => {
    await setupAuthMocks(page);

    let logoutCalled = false;
    await page.route('**/api/auth/logout', async (route) => {
      logoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { message: 'Logged out' },
      });
    });

    await page.goto('/settings?section=data');

    // Locate and click "Cerrar Sesión"
    const logoutBtn = page.getByRole('button', { name: /Cerrar Sesión/i });
    await logoutBtn.scrollIntoViewIfNeeded();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify logout call
    await expect.poll(() => logoutCalled, { timeout: 5000 }).toBeTruthy();

    // Verify redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('deletes the account only after typed confirmation, then signs out', async ({ page }) => {
    await setupAuthMocks(page);

    const calls: string[] = [];
    await page.route('**/api/auth/account', async (route) => {
      calls.push(route.request().method());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { message: 'Account deleted successfully' },
      });
    });
    await page.route('**/api/auth/logout', async (route) => {
      calls.push('logout');
      await route.fulfill({ status: 200, contentType: 'application/json', json: {} });
    });

    await page.goto('/settings?section=data');

    const openButton = page.getByRole('button', { name: 'Borrar mi cuenta' });
    await openButton.scrollIntoViewIfNeeded();
    await openButton.click();

    const dialog = page.getByRole('alertdialog');
    const confirm = dialog.getByRole('button', { name: 'Borrar cuenta' });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel(/Escribe BORRAR/).fill('borrar');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page).toHaveURL(/\/login/);
    expect(calls).toEqual(['DELETE', 'logout']);
  });
});
