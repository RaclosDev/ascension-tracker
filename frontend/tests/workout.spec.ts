import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Workout Page', () => {
  test('shows workout page tabs', async ({ page }) => {
    await setupAuthMocks(page);

    // Explicit static exercise mocks
    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    await page.goto('/workout');

    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    const historyTab = page.getByRole('button', { name: 'Historial', exact: true });
    const exercisesTab = page.getByRole('button', { name: 'Ejercicios', exact: true });
    const templatesTab = page.getByRole('button', { name: /Plantillas|Rutinas/i });

    await expect(historyTab).toBeVisible({ timeout: 15000 });
    await expect(exercisesTab).toBeVisible({ timeout: 15000 });
    await expect(templatesTab).toBeVisible({ timeout: 15000 });
  });

  test('can start workout, minimize it, navigate app with floating banner, and resume', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
    });
    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', json: [] });
    });

    await page.goto('/workout');

    // Iniciar entrenamiento
    const startWorkoutBtn = page.getByRole('button', { name: /Empezar Entrenamiento/i });
    await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
    await startWorkoutBtn.click();

    // Seleccionar entrenamiento vacío en el modal
    const startEmptyOption = page.locator('.start-workout-option').first();
    await expect(startEmptyOption).toBeVisible({ timeout: 10000 });
    await startEmptyOption.click();

    // Cerrar el selector inicial de ejercicios para ver la sesión activa
    const closePickerBtn = page.locator('.workout-sheet-close').first();
    await expect(closePickerBtn).toBeVisible({ timeout: 5000 });
    await closePickerBtn.click();

    // Comprobar que la sesión activa está en curso con el botón Minimizar
    const minimizeBtn = page.getByRole('button', { name: /Minimizar/i }).first();
    await expect(minimizeBtn).toBeVisible({ timeout: 10000 });

    // Minimizar sesión para salir a la app
    await minimizeBtn.click();
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 });

    // El banner persistente debe ser visible fuera de /workout
    const banner = page.getByRole('region', { name: /Entrenamiento activo en segundo plano/i });
    await expect(banner).toBeVisible({ timeout: 10000 });

    // Pulsar en reanudar para volver al entreno activo
    const resumeBtn = page.getByRole('button', { name: /Reanudar/i });
    await resumeBtn.click();

    // Debe volver a /workout con el entreno en curso
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 10000 });
    await expect(page.getByText('En curso')).toBeVisible({ timeout: 10000 });
  });

  test('active workout with exercises renders without React error #185 loop', async ({ page }) => {
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

    await page.goto('/workout');

    // Iniciar entrenamiento vacío
    const startWorkoutBtn = page.getByRole('button', { name: /Empezar Entrenamiento/i });
    await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
    await startWorkoutBtn.click();

    const startEmptyOption = page.locator('.start-workout-option').first();
    await expect(startEmptyOption).toBeVisible({ timeout: 10000 });
    await startEmptyOption.click();

    // En el selector, desplegar el primer ejercicio disponible y añadirlo a la sesión
    const exerciseItem = page.locator('.picker-exercise-item').first();
    await expect(exerciseItem).toBeVisible({ timeout: 10000 });
    await exerciseItem.click();

    const addBtn = page.getByRole('button', { name: /Añadir al entreno/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Verificar que la tarjeta de ejercicio se ha montado y la app no crashea con #185
    await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Algo salió mal')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Minimizar/i }).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
