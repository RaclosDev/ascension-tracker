import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Backup, Restore & Hevy Import Flows', () => {
  test('Settings page displays Backup and Privacy section and allows JSON export', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let exportCalled = false;
    await page.route('**/api/user/export**', async (route) => {
      exportCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json;charset=UTF-8',
        headers: {
          'Content-Disposition': 'attachment; filename="ascension-backup-2026-10-14.json"',
        },
        json: {
          version: '1.0',
          exportedAt: '2026-10-14T02:00:00Z',
          userEmail: 'test@example.com',
          workouts: [],
          customExercises: [],
          workoutTemplates: [],
          foodLogs: [],
          meals: [],
          recipes: [],
          savedFoods: [],
          stepsEntries: [],
          weightEntries: [],
          settings: null,
        },
      });
    });

    await page.goto('/settings');

    // Section exists
    await expect(page.getByText('Copia de Seguridad y Privacidad')).toBeVisible({ timeout: 15000 });
    const exportBtn = page.getByRole('button', { name: /Exportar copia de seguridad \(JSON\)/i });
    await expect(exportBtn).toBeVisible();

    // Trigger export
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await exportBtn.click();
    const download = await downloadPromise;

    expect(exportCalled).toBe(true);
    expect(download.suggestedFilename()).toBe('ascension-backup-2026-10-14.json');
  });

  test('RestoreBackupModal rejects corrupted JSON and incompatible versions', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/settings');

    // Open Restore Modal
    const openRestoreBtn = page.getByRole('button', {
      name: /Restaurar copia de seguridad \(JSON\)/i,
    });
    await expect(openRestoreBtn).toBeVisible({ timeout: 15000 });
    await openRestoreBtn.click();

    await expect(page.getByRole('heading', { name: /Restaurar Copia de Seguridad/i })).toBeVisible({
      timeout: 5000,
    });

    const fileInput = page.locator('input[type="file"]');

    // 1. Corrupted JSON file
    await fileInput.setInputFiles({
      name: 'corrupted.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ invalid-json'),
    });

    await expect(
      page.getByText('Error al leer el archivo. Asegúrate de que no esté dañado.'),
    ).toBeVisible({ timeout: 5000 });

    // 2. Unsupported version
    await fileInput.setInputFiles({
      name: 'future-version.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: '3.0', workouts: [] })),
    });

    await expect(
      page.getByText('Versión de copia de seguridad no compatible (se requiere versión 1.0)'),
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test('RestoreBackupModal enforces OVERWRITE safety confirmation and permits immediate MERGE restore', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let restorePayload: Record<string, unknown> | null = null;
    let restoreModeQueryParam: string | null = null;

    await page.route('**/api/user/restore**', async (route) => {
      restorePayload = route.request().postDataJSON() as Record<string, unknown>;
      const url = new URL(route.request().url());
      restoreModeQueryParam = url.searchParams.get('mode');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          mode: restoreModeQueryParam,
          workoutsRestored: 2,
          exercisesRestored: 1,
          templatesRestored: 1,
          foodLogsRestored: 4,
          mealsRestored: 3,
          recipesRestored: 1,
          savedFoodsRestored: 2,
          stepsEntriesRestored: 7,
          weightEntriesRestored: 5,
          settingsRestored: true,
        },
      });
    });

    await page.goto('/settings');

    const openRestoreBtn = page.getByRole('button', {
      name: /Restaurar copia de seguridad \(JSON\)/i,
    });
    await expect(openRestoreBtn).toBeVisible({ timeout: 15000 });
    await openRestoreBtn.click();

    await expect(page.getByRole('heading', { name: /Restaurar Copia de Seguridad/i })).toBeVisible({
      timeout: 5000,
    });

    const fileInput = page.locator('input[type="file"]');
    const validBackup = {
      version: '1.0',
      exportedAt: '2026-10-14T00:00:00Z',
      userEmail: 'user@example.com',
      workouts: [{ id: 'w1' }, { id: 'w2' }],
      customExercises: [{ id: 'e1' }],
      workoutTemplates: [{ id: 't1' }],
      foodLogs: [{ id: 1 }, { id: 2 }],
      meals: [],
      recipes: [],
      savedFoods: [],
      stepsEntries: [],
      weightEntries: [{ id: 10, weight: 80.5 }],
      settings: { kcal: 2100 },
    };

    await fileInput.setInputFiles({
      name: 'ascension-backup-valid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(validBackup)),
    });

    // Preview counters visible
    await expect(page.getByText('Entrenos')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Comidas', { exact: true })).toBeVisible();

    // Default mode is OVERWRITE. Confirm button must be disabled until safety checkbox is checked
    const confirmBtn = page.getByRole('button', { name: 'Confirmar Restauración' });
    await expect(confirmBtn).toBeDisabled();

    // Switch to MERGE mode
    const mergeRadio = page.getByRole('radio', { name: /Fusionar datos/i });
    await mergeRadio.check();

    // In MERGE mode, confirm button is immediately active
    await expect(confirmBtn).toBeEnabled();

    // Switch back to OVERWRITE mode
    const overwriteRadio = page.getByRole('radio', { name: /Sobrescribir datos/i });
    await overwriteRadio.check();
    await expect(confirmBtn).toBeDisabled();

    // Check the safety checkbox
    const safetyCheckbox = page.getByRole('checkbox', {
      name: /Entiendo y deseo sobrescribir los datos actuales/i,
    });
    await safetyCheckbox.check();
    await expect(confirmBtn).toBeEnabled();

    // Submit restore
    await confirmBtn.click();

    // Verify API call was executed with OVERWRITE mode
    await expect.poll(() => restorePayload !== null, { timeout: 10000 }).toBeTruthy();
    expect(restoreModeQueryParam).toBe('OVERWRITE');
    expect(restorePayload?.version).toBe('1.0');

    // Success toast shown
    await expect(page.getByText(/Copia de seguridad restaurada/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('Hevy CSV import modal opens and renders summary preview upon CSV upload', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let importCalled = false;
    await page.route('**/api/workouts/import**', async (route) => {
      importCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          importedWorkouts: 1,
          importedExercises: 1,
          importedSets: 3,
        },
      });
    });

    await page.goto('/settings');

    // Open Workout Accordion
    const workoutHeader = page.locator('.accordion-header', { hasText: 'Entrenamiento' });
    await expect(workoutHeader).toBeVisible({ timeout: 15000 });
    await workoutHeader.click();

    // Click Hevy Import button
    const hevyBtn = page.getByRole('button', {
      name: /Abrir modal para importar entrenamientos desde Hevy/i,
    });
    await expect(hevyBtn).toBeVisible({ timeout: 10000 });
    await hevyBtn.click();

    // Modal title visible
    await expect(page.getByRole('heading', { name: 'Importar desde Hevy' })).toBeVisible({
      timeout: 5000,
    });

    const csvContent = `title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
"Pierna Torso","14 Oct 2026, 10:00","14 Oct 2026, 11:00","","Sentadilla",,"",0,"normal",100,5,,,8
"Pierna Torso","14 Oct 2026, 10:00","14 Oct 2026, 11:00","","Sentadilla",,"",1,"normal",100,5,,,8
"Pierna Torso","14 Oct 2026, 10:00","14 Oct 2026, 11:00","","Sentadilla",,"",2,"normal",100,5,,,8`;

    const fileInput = page.locator('input[type="file"][accept=".csv"]');
    await fileInput.setInputFiles({
      name: 'workout_data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Preview summary must appear
    await expect(page.getByText('Series registradas')).toBeVisible({ timeout: 5000 });

    // Confirm button click
    const submitBtn = page.getByRole('button', { name: /Importar \d+ entrenamientos/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect.poll(() => importCalled, { timeout: 10000 }).toBe(true);
    await expect(page.getByText(/Importados con éxito \d+ entrenamientos/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
