import { test, expect, Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

/**
 * Sets up catalog mocks and baseline auth mocks for live interactive workout gym tests.
 */
async function setupWorkoutGymMocks(page: Page) {
  await setupAuthMocks(page);

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
        {
          id: 'multipower-squat',
          name: 'Sentadilla en Multipower',
          muscle: 'piernas',
          equipment: 'multipower',
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
        json: { id: 'mock-workout-id', ...(route.request().postDataJSON() || {}) },
      });
    }
  });
}

/**
 * Helper to initiate an empty workout, open picker, and add "Press de Banca".
 */
async function startWorkoutWithBenchPress(page: Page) {
  await setupWorkoutGymMocks(page);
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

test.describe('Pruebas E2E de Interacción Real en Gimnasio (Interactive Gym Workflows)', () => {
  test('1. Stepper incrementa EXACTAMENTE una vez por pulsación (Previene Bug de Doble Toque)', async ({
    page,
  }) => {
    await startWorkoutWithBenchPress(page);

    const firstSetRow = page.locator('.set-row').first();
    await expect(firstSetRow).toBeVisible();

    // Localizar input de peso (decimal) e input de repeticiones (numeric) de la serie 1
    const weightInput = firstSetRow.locator('input[inputmode="decimal"]').first();
    const repsInput = firstSetRow.locator('input[inputmode="numeric"]').first();

    // 1.1 Enfocar input de peso -> debe abrir la barra del stepper de peso
    await weightInput.click();
    const plus125Btn = page.getByRole('button', { name: '+1.25', exact: true });
    await expect(plus125Btn).toBeVisible({ timeout: 5000 });

    // Pulsar exactamente una vez el botón +1.25
    await plus125Btn.click();

    // Verificar que el peso aumentó exactamente a 1.25 (NO 2.5)
    await expect(weightInput).toHaveValue('1.25');

    // Pulsar +2.5 una sola vez -> 1.25 + 2.5 = 3.75 (NO 6.25)
    const plus25Btn = page.getByRole('button', { name: '+2.5', exact: true });
    await expect(plus25Btn).toBeVisible();
    await plus25Btn.click();
    await expect(weightInput).toHaveValue('3.75');

    // Pulsar -1.25 una sola vez -> 3.75 - 1.25 = 2.5
    const minus125Btn = page.getByRole('button', { name: '-1.25', exact: true });
    await expect(minus125Btn).toBeVisible();
    await minus125Btn.click();
    await expect(weightInput).toHaveValue('2.5');

    // 1.2 Enfocar input de repeticiones -> debe cambiar al stepper de repeticiones
    await repsInput.click();
    const plus1RepsBtn = page.getByRole('button', { name: '+1', exact: true });
    await expect(plus1RepsBtn).toBeVisible({ timeout: 5000 });

    // Pulsar +1 reps una sola vez
    await plus1RepsBtn.click();
    // Debe tener exactamente valor "1" (NO "2")
    await expect(repsInput).toHaveValue('1');

    // Pulsar +5 reps una sola vez -> 1 + 5 = 6
    const plus5RepsBtn = page.getByRole('button', { name: '+5', exact: true });
    await expect(plus5RepsBtn).toBeVisible();
    await plus5RepsBtn.click();
    await expect(repsInput).toHaveValue('6');
  });

  test('2. Exclusividad de Steppers y Cierre Automático al Completar Serie', async ({ page }) => {
    await startWorkoutWithBenchPress(page);

    const setRows = page.locator('.set-row');
    const firstSet = setRows.nth(0);
    const secondSet = setRows.nth(1);

    const firstWeightInput = firstSet.locator('input[inputmode="decimal"]').first();
    const secondRepsInput = secondSet.locator('input[inputmode="numeric"]').first();

    // 2.1 Abrir stepper en Serie 1
    await firstWeightInput.click();
    await expect(page.getByRole('button', { name: '+1.25', exact: true })).toBeVisible({
      timeout: 5000,
    });

    // 2.2 Tocar input en Serie 2 -> El stepper de Serie 1 debe cerrarse y abrirse el de Serie 2
    await secondRepsInput.click();
    await expect(page.getByRole('button', { name: '+1', exact: true })).toBeVisible({
      timeout: 5000,
    });
    // Solo puede haber exactamente 1 barra de stepper visible en toda la pantalla
    const allStepperBars = page.locator('button:has-text("+1"), button:has-text("+1.25")');
    await expect(allStepperBars).toHaveCount(1);

    // 2.3 Completar Serie 2 pulsando su checkmark
    const secondCheckBtn = secondSet
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-check') });
    await secondCheckBtn.click();
    await expect(secondSet).toHaveClass(/completed/);

    // Al completar la serie, el stepper DEBE cerrarse inmediatamente
    await expect(page.getByRole('button', { name: '+1', exact: true })).toHaveCount(0);
  });

  test('3. El botón de eliminar serie mantiene su tamaño estándar (Previene Bug de Botón Gigante)', async ({
    page,
  }) => {
    await startWorkoutWithBenchPress(page);

    const firstSet = page.locator('.set-row').first();
    const weightInput = firstSet.locator('input[inputmode="decimal"]').first();

    // Abrir el stepper
    await weightInput.click();
    await expect(page.getByRole('button', { name: '+1.25', exact: true })).toBeVisible();

    // El botón de eliminar serie tiene aria-label="Eliminar serie 1"
    const deleteBtn = page.locator('button[aria-label="Eliminar serie 1"]');
    await expect(deleteBtn).toBeAttached();

    // Obtener las dimensiones de la fila de la serie y del botón de eliminar
    const rowBox = await firstSet.boundingBox();
    const deleteBtnBox = await deleteBtn.boundingBox();

    expect(rowBox).not.toBeNull();
    expect(deleteBtnBox).not.toBeNull();

    // El botón de eliminar NO debe estirarse a lo largo del stepper (debe tener <= 50px de altura, similar a la fila)
    expect(deleteBtnBox!.height).toBeLessThanOrEqual(52);
    // Su altura debe ser coherente con la altura de la fila de la serie (~40px)
    expect(Math.abs(deleteBtnBox!.height - rowBox!.height)).toBeLessThanOrEqual(5);
  });

  test('4. Teclado real: Borrado completo con Backspace y escritura de nuevo valor (Ajustes y Entreno)', async ({
    page,
  }) => {
    await setupWorkoutGymMocks(page);

    // 4.1 En Configuración -> Descanso Base: comprobar que borrar el último dígito ("9" de "90") no se bloquea
    await page.goto('/settings');

    const workoutHeader = page.locator('.accordion-header').filter({ hasText: /Entrenamiento/i });
    await expect(workoutHeader).toBeVisible({ timeout: 10000 });
    await workoutHeader.click();

    const restInput = page.getByRole('spinbutton', { name: /Descanso base en segundos/i });
    await expect(restInput).toBeVisible({ timeout: 5000 });
    await expect(restInput).toHaveValue('90');

    // Hacer clic en el input y situar cursor al final
    await restInput.click();
    await page.keyboard.press('End');

    // Pulsar Backspace una vez: 90 -> 9
    await page.keyboard.press('Backspace');
    await expect(restInput).toHaveValue('9');

    // Pulsar Backspace otra vez: 9 -> "" (NO debe revertirse automáticamente ni bloquearse)
    await page.keyboard.press('Backspace');
    await expect(restInput).toHaveValue('');

    // Escribir 120
    await page.keyboard.type('120');
    await expect(restInput).toHaveValue('120');

    // Al perder el foco (Tab), debe formatearse amigablemente a "(2m)"
    await page.keyboard.press('Tab');
    await expect(page.getByText(/seg \(2m\)/i)).toBeVisible();

    // 4.2 En Entrenamiento: comprobar borrado completo y tipeo en los inputs de series
    await page.goto('/workout');
    const resumeOrStart = page
      .getByRole('button', { name: /empezar entrenamiento/i })
      .or(page.getByRole('button', { name: /reanudar/i }));
    await expect(resumeOrStart.first()).toBeVisible({ timeout: 10000 });

    if (await page.getByRole('button', { name: /empezar entrenamiento/i }).isVisible()) {
      await page.getByRole('button', { name: /empezar entrenamiento/i }).click();
      const emptyOption = page
        .locator('.start-workout-option')
        .filter({ hasText: /entrenamiento vac[ií]o/i });
      await emptyOption.click();
      await page.locator('.picker-exercise-item').first().click();
      await page.getByRole('button', { name: /a[ñn]adir al entreno/i }).click();
    }

    const firstSet = page.locator('.set-row').first();
    const workoutWeightInput = firstSet.locator('input[inputmode="decimal"]').first();

    // Escribir un valor numérico
    await workoutWeightInput.click();
    await page.keyboard.type('85');
    await expect(workoutWeightInput).toHaveValue('85');

    // Borrar con Backspace los dos dígitos
    await page.keyboard.press('Backspace');
    await expect(workoutWeightInput).toHaveValue('8');
    await page.keyboard.press('Backspace');
    await expect(workoutWeightInput).toHaveValue('');

    // Escribir nuevo valor decimal con punto: 92.5
    await page.keyboard.type('92.5');
    await expect(workoutWeightInput).toHaveValue('92.5');
  });

  test('5. Resiliencia de Sesión: Caída de red / 401 NO borra el entrenamiento activo ni las series', async ({
    page,
  }) => {
    await startWorkoutWithBenchPress(page);

    const firstSet = page.locator('.set-row').first();
    const secondSet = page.locator('.set-row').nth(1);

    // Rellenar Serie 1: 80kg x 10 repes y marcarla completada
    const firstWeight = firstSet.locator('input[inputmode="decimal"]').first();
    const firstReps = firstSet.locator('input[inputmode="numeric"]').first();
    const firstCheck = firstSet
      .getByRole('button')
      .filter({ has: page.locator('svg.lucide-check') });

    await firstWeight.fill('80');
    await firstReps.fill('10');
    await firstCheck.click();
    await expect(firstSet).toHaveClass(/completed/);

    // Rellenar Serie 2: 85kg x 8 repes (sin completar)
    const secondWeight = secondSet.locator('input[inputmode="decimal"]').first();
    const secondReps = secondSet.locator('input[inputmode="numeric"]').first();
    await secondWeight.fill('85');
    await secondReps.fill('8');

    // Simular que el endpoint /api/auth/refresh responde con error 500 o 401 debido a caída de red
    await page.route('**/api/auth/refresh**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        json: { message: 'Internal Server Error (Mobile Network Dropout)' },
      });
    });

    // Recargar la página (simula que el navegador cerró la pestaña por memoria o el usuario refrescó)
    await page.reload();

    // Verificar que la app NO expulsó al usuario a /login
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 10000 });

    // Verificar que el entrenamiento activo sigue presente en pantalla
    await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('En curso')).toBeVisible();

    // Verificar integridad absoluta de los datos guardados en IndexedDB ('ascension-workout-v1')
    const reloadedFirstSet = page.locator('.set-row').first();
    const reloadedSecondSet = page.locator('.set-row').nth(1);

    // Serie 1 debe seguir completada con 80kg y 10 repes
    await expect(reloadedFirstSet).toHaveClass(/completed/);
    await expect(reloadedFirstSet.locator('input[inputmode="decimal"]').first()).toHaveValue('80');
    await expect(reloadedFirstSet.locator('input[inputmode="numeric"]').first()).toHaveValue('10');

    // Serie 2 debe seguir con 85kg y 8 repes
    await expect(reloadedSecondSet.locator('input[inputmode="decimal"]').first()).toHaveValue('85');
    await expect(reloadedSecondSet.locator('input[inputmode="numeric"]').first()).toHaveValue('8');
  });

  test('6. Persistencia de Material Excluido y Preferencias sin reseteos silenciosos', async ({
    page,
  }) => {
    let savedPrefs: Record<string, unknown> = {
      defaultRestSeconds: 90,
      restPreset: 90,
      showRpe: false,
      hiddenEquipments: [],
      globalMachines: [],
      globalGrips: [],
      exerciseAliases: {},
      exerciseVariants: {},
      exerciseGifs: {},
      restTimers: {},
    };

    await setupWorkoutGymMocks(page);

    // Interceptar guardado y consulta de preferencias en backend
    await page.route('**/api/workout-preferences**', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
        const body = route.request().postDataJSON() || {};
        savedPrefs = { ...savedPrefs, ...body };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: savedPrefs,
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: savedPrefs,
        });
      }
    });

    // 6.1 Ir a Configuración -> Ocultar multipower
    await page.goto('/settings');
    const workoutHeader = page.locator('.accordion-header').filter({ hasText: /Entrenamiento/i });
    await expect(workoutHeader).toBeVisible({ timeout: 10000 });
    await workoutHeader.click();

    const multipowerToggle = page.locator('input[aria-label="Ocultar material multipower"]');
    await expect(multipowerToggle).toBeVisible({ timeout: 5000 });
    await expect(multipowerToggle).not.toBeChecked();

    // Marcar multipower como excluido
    await multipowerToggle.check();
    await expect(multipowerToggle).toBeChecked();

    // 6.2 Recargar la página y verificar que multipower SIGUE excluido (no se reseteó a vacío)
    await page.reload();
    const reloadedWorkoutHeader = page
      .locator('.accordion-header')
      .filter({ hasText: /Entrenamiento/i });
    await expect(reloadedWorkoutHeader).toBeVisible({ timeout: 10000 });
    await reloadedWorkoutHeader.click();
    const reloadedMultipowerToggle = page.locator(
      'input[aria-label="Ocultar material multipower"]',
    );
    await expect(reloadedMultipowerToggle).toBeVisible({ timeout: 5000 });
    await expect(reloadedMultipowerToggle).toBeChecked();

    // 6.3 Ir a /workout y verificar que al buscar ejercicios, los de multipower están filtrados
    await page.goto('/workout');
    const startBtn = page.getByRole('button', { name: /empezar entrenamiento/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      const emptyOption = page
        .locator('.start-workout-option')
        .filter({ hasText: /entrenamiento vac[ií]o/i });
      await emptyOption.click();

      // El catálogo contiene "Press de Banca" (barra) y "Sentadilla en Multipower" (multipower)
      // Como multipower está oculto en preferences, "Sentadilla en Multipower" no debe mostrarse
      await expect(page.getByText('Sentadilla en Multipower')).toHaveCount(0);
      await expect(page.getByText('Press de Banca')).toBeVisible();
    }
  });
});
