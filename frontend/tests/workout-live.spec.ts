import { test, expect, Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

/**
 * Sets up catalog mocks and baseline auth mocks for live workout tests.
 */
async function setupWorkoutCatalogMocks(page: Page) {
  await setupAuthMocks(page);

  // Provide mock catalog exercises for ExercisePicker
  await page.route('**/exercises.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: 'bench-press',
          name: 'Press de Banca',
          muscle: 'pecho',
          equipment: 'barra',
        },
      ],
    });
  });

  await page.route('**/exercises-base.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: 'base-pecho-press-de-pecho-plano-barra',
          name: 'Press de Pecho Plano con Barra',
          muscle: 'pecho',
          equipment: 'barra',
        },
      ],
    });
  });

  await page.route(/\/api\/workouts(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { content: [], number: 0, totalPages: 0 },
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { id: 'mock-workout-id' },
      });
    }
  });
}

/**
 * Helper to initiate an empty workout, open picker, and add the first exercise.
 */
async function startWorkoutWithExercise(page: Page) {
  await setupWorkoutCatalogMocks(page);
  await page.goto('/workout');

  const startBtn = page.getByRole('button', { name: /empezar entrenamiento/i });
  await expect(startBtn).toBeVisible({ timeout: 15000 });
  await startBtn.click();

  const emptyOption = page
    .locator('.start-workout-option')
    .filter({ hasText: /entrenamiento vac[ií]o/i });
  await expect(emptyOption).toBeVisible({ timeout: 10000 });
  await emptyOption.click();

  // ExercisePicker opens automatically on startEmpty
  const exerciseItem = page.locator('.picker-exercise-item').first();
  await expect(exerciseItem).toBeVisible({ timeout: 10000 });
  await exerciseItem.click();

  const addBtn = page.getByRole('button', { name: /a[ñn]adir al entreno/i });
  await expect(addBtn).toBeVisible({ timeout: 5000 });
  await addBtn.click();

  // Verify the exercise card is rendered
  await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Sesión de Entrenamiento en Vivo (Workout Live)', () => {
  test('1. Iniciar sesión vacía y añadir ejercicio desde el catálogo', async ({ page }) => {
    await setupWorkoutCatalogMocks(page);
    await page.goto('/workout');

    // 1. Abrir modal de inicio
    const startBtn = page.getByRole('button', { name: /empezar entrenamiento/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    // 2. Elegir "Entrenamiento vacío"
    const emptyOption = page
      .locator('.start-workout-option')
      .filter({ hasText: /entrenamiento vac[ií]o/i });
    await expect(emptyOption).toBeVisible({ timeout: 10000 });
    await emptyOption.click();

    // 3. Probar también cerrar y reabrir el selector con el botón "Añadir ejercicio"
    const closePickerBtn = page.locator('.workout-sheet-close').first();
    await expect(closePickerBtn).toBeVisible({ timeout: 5000 });
    await closePickerBtn.click();

    const addExerciseBtn = page.getByRole('button', { name: /a[ñn]adir ejercicio/i });
    await expect(addExerciseBtn).toBeVisible({ timeout: 5000 });
    await addExerciseBtn.click();

    // 4. Seleccionar ejercicio del catálogo y añadirlo
    const exerciseItem = page.locator('.picker-exercise-item').first();
    await expect(exerciseItem).toBeVisible({ timeout: 10000 });
    await exerciseItem.click();

    const addToWorkoutBtn = page.getByRole('button', { name: /a[ñn]adir al entreno/i });
    await expect(addToWorkoutBtn).toBeVisible({ timeout: 5000 });
    await addToWorkoutBtn.click();

    // 5. Verificar que se añade al entrenamiento con sus series iniciales
    const cardHeader = page.locator('.exercise-card-header').first();
    await expect(cardHeader).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.set-row')).toHaveCount(3);
  });

  test('2. Gestión de series: añadir serie, marcar completada, ciclar tipo y eliminar', async ({
    page,
  }) => {
    await startWorkoutWithExercise(page);

    const initialSetRows = page.locator('.set-row');
    const initialCount = await initialSetRows.count();
    expect(initialCount).toBeGreaterThan(0);

    // A) Añadir serie (+ Añadir serie)
    const addSetBtn = page.getByRole('button', { name: /a[ñn]adir serie/i });
    await expect(addSetBtn).toBeVisible({ timeout: 5000 });
    await addSetBtn.click();
    await expect(page.locator('.set-row')).toHaveCount(initialCount + 1);

    // B) Ciclar tipo de serie: normal -> calentamiento [W] -> drop set [D] -> fallo [F] -> normal
    const firstSet = page.locator('.set-row').first();
    const typeBtn = firstSet.locator('.set-type-btn');
    await expect(typeBtn).toBeVisible({ timeout: 5000 });

    // Normal inicial -> Calentamiento (W)
    await typeBtn.click();
    await expect(typeBtn).toHaveText('W');

    // Calentamiento (W) -> Drop set (D)
    await typeBtn.click();
    await expect(typeBtn).toHaveText('D');

    // Drop set (D) -> Fallo (F)
    await typeBtn.click();
    await expect(typeBtn).toHaveText('F');

    // Fallo (F) -> Normal (vuelve al índice numérico '1')
    await typeBtn.click();
    await expect(typeBtn).toHaveText('1');

    // C) Marcar serie como completada (checkmark)
    const checkBtn = firstSet.getByRole('button').filter({ has: page.locator('svg.lucide-check') });
    await expect(checkBtn).toBeVisible({ timeout: 5000 });
    await checkBtn.click();
    await expect(firstSet).toHaveClass(/completed/);

    // D) Eliminar serie
    const countBeforeDelete = await page.locator('.set-row').count();
    const lastDeleteBtn = page.getByRole('button', { name: /eliminar serie/i }).last();
    await lastDeleteBtn.focus();
    await lastDeleteBtn.click({ force: true });
    await expect(page.locator('.set-row')).toHaveCount(countBeforeDelete - 1);
  });

  test('3. Temporizador de descanso con formato amigable y controles', async ({ page }) => {
    await startWorkoutWithExercise(page);

    // Verificar selector de descanso en la tarjeta ('60s', '90s', etc.)
    const restSelect = page.locator('.exercise-card-rest-select');
    await expect(restSelect).toBeVisible({ timeout: 5000 });
    await expect(restSelect.locator('option', { hasText: '1m 30s' })).toBeAttached();
    await expect(restSelect.locator('option', { hasText: /^1m$/ })).toBeAttached();

    // Al completar serie, se activa el RestBanner flotante
    const checkBtn = page
      .locator('.set-row')
      .first()
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-check') });
    await checkBtn.click();

    // Verificar presencia de banner de descanso y formato de tiempo
    const restLabel = page.getByText('Descanso', { exact: true });
    await expect(restLabel).toBeVisible({ timeout: 5000 });
    await expect(restLabel.locator('..')).toContainText(/\d+:\d{2}|\d+s/);

    // Botón de ajuste de tiempo (+15)
    const adjustBtn = page.getByRole('button', { name: '+15', exact: true });
    await expect(adjustBtn).toBeVisible({ timeout: 5000 });
    await adjustBtn.click();

    // Botón saltar / omitir descanso
    const skipBtn = page.getByRole('button', { name: 'Omitir', exact: true });
    await expect(skipBtn).toBeVisible({ timeout: 5000 });
    await skipBtn.click();

    // El banner de descanso desaparece al saltarlo
    await expect(page.getByRole('button', { name: 'Omitir', exact: true })).toHaveCount(0);
  });

  test('4. Minimizar sesión y banner persistente con reanudación sin pérdida de estado', async ({
    page,
  }) => {
    await startWorkoutWithExercise(page);

    // Marcar una serie para comprobar persistencia de estado
    const checkBtn = page
      .locator('.set-row')
      .first()
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-check') });
    await checkBtn.click();

    // Botón "Minimizar"
    const minimizeBtn = page.getByRole('button', { name: /minimizar/i }).first();
    await expect(minimizeBtn).toBeVisible({ timeout: 5000 });
    await minimizeBtn.click();

    // Navegar automáticamente a /dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });

    // Verificar presencia del ActiveWorkoutBanner persistente con rol y aria-label
    const floatingBanner = page.locator(
      '[role="region"][aria-label*="Entrenamiento activo en segundo plano"]',
    );
    await expect(floatingBanner).toBeVisible({ timeout: 10000 });

    // Botón "Reanudar"
    const resumeBtn = floatingBanner.getByRole('button', { name: /reanudar/i });
    await expect(resumeBtn).toBeVisible({ timeout: 5000 });
    await resumeBtn.click();

    // Vuelve a /workout y mantiene el estado intacto
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 10000 });
    await expect(page.getByText('En curso')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.set-row.completed')).toHaveCount(1);
  });

  test('5. Terminar y guardar entreno enviando POST /api/workouts', async ({ page }) => {
    let postReceived = false;
    let savedPayload: Record<string, unknown> | null = null;

    await setupWorkoutCatalogMocks(page);

    // Interceptar POST /api/workouts para verificar el payload y la petición de guardado
    await page.route(/\/api\/workouts(\?.*)?$/, async (route) => {
      if (route.request().method() === 'POST') {
        postReceived = true;
        savedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 'saved-workout-101', ...savedPayload },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { content: [], number: 0, totalPages: 0 },
        });
      }
    });

    await page.goto('/workout');

    // Iniciar y añadir ejercicio
    const startBtn = page.getByRole('button', { name: /empezar entrenamiento/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    const emptyOption = page
      .locator('.start-workout-option')
      .filter({ hasText: /entrenamiento vac[ií]o/i });
    await expect(emptyOption).toBeVisible({ timeout: 10000 });
    await emptyOption.click();

    const exerciseItem = page.locator('.picker-exercise-item').first();
    await expect(exerciseItem).toBeVisible({ timeout: 10000 });
    await exerciseItem.click();

    const addToWorkoutBtn = page.getByRole('button', { name: /a[ñn]adir al entreno/i });
    await expect(addToWorkoutBtn).toBeVisible({ timeout: 5000 });
    await addToWorkoutBtn.click();

    // Marcar al menos una serie completada para que se habilite el guardado real
    const checkBtn = page
      .locator('.set-row')
      .first()
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-check') });
    await checkBtn.click();

    // Pulsar "Terminar Entrenamiento"
    const finishBtn = page.getByRole('button', { name: /terminar entrenamiento/i });
    await expect(finishBtn).toBeVisible({ timeout: 5000 });
    await finishBtn.click();

    // Confirmación en el modal
    const dialogTitle = page.getByRole('heading', { name: /finalizar sesi[oó]n/i });
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    const confirmBtn = page.getByRole('button', { name: /^guardar$/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Verificar que se realizó el POST /api/workouts con los datos de la sesión
    await expect.poll(() => postReceived, { timeout: 10000 }).toBe(true);
    expect(savedPayload).not.toBeNull();
    expect(Array.isArray((savedPayload as { exercises?: unknown[] })?.exercises)).toBe(true);

    // La sesión activa finaliza y el botón de terminar ya no está visible
    await expect(finishBtn).toHaveCount(0);
  });
});
