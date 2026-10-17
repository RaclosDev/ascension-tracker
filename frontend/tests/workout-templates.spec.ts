import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Workout Templates & Routines Flows', () => {
  test('1. Renderizado de cuadrícula de plantillas con rutinas predefinidas y conteo', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const mockExercises = [
      { id: 'bench-press', name: 'Press de Banca', muscle: 'pecho', equipment: 'barra' },
      { id: 'barbell-row', name: 'Remo con Barra', muscle: 'espalda', equipment: 'barra' },
      { id: 'squat', name: 'Sentadilla', muscle: 'piernas', equipment: 'barra' },
    ];

    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockExercises,
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    const mockTemplates = [
      {
        id: 'tpl-1',
        name: 'Torso Hipertrofia',
        exercises: [{ exerciseId: 'bench-press' }, { exerciseId: 'barbell-row' }],
      },
      {
        id: 'tpl-2',
        name: 'Pierna Fuerza',
        exercises: [{ exerciseId: 'squat' }],
      },
    ];

    await page.route(/\/api\/workouts\/templates(\/.*)?/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockTemplates,
      });
    });

    await page.goto('/workout');
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    // Pestaña: page.getByRole('button', { name: /plantillas|rutinas/i })
    const templatesTab = page.getByRole('button', { name: /plantillas|rutinas/i });
    await expect(templatesTab).toBeVisible({ timeout: 15000 });
    await templatesTab.click();

    // Tarjetas plantilla: page.locator('li.card')
    const cards = page.locator('li.card');
    await expect(cards).toHaveCount(2, { timeout: 10000 });

    // Comprobar títulos y conteos
    await expect(cards.nth(0)).toContainText('Torso Hipertrofia');
    await expect(cards.nth(0)).toContainText('2 ejercicios');
    await expect(cards.nth(1)).toContainText('Pierna Fuerza');
    await expect(cards.nth(1)).toContainText('1 ejercicios');
  });

  test('2. Crear nueva plantilla agregando ejercicios y enviando POST /api/workouts/templates', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const mockExercises = [
      { id: 'bench-press', name: 'Press de Banca', muscle: 'pecho', equipment: 'barra' },
    ];

    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockExercises,
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockExercises,
      });
    });

    let postReceived = false;
    let postBody: { name?: string; exercises?: { exerciseId: string }[] } | null = null;

    await page.route(/\/api\/workouts\/templates(\/.*)?/, async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        postReceived = true;
        postBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            id: 'new-tpl-id',
            name: postBody?.name || 'Nueva Plantilla',
            exercises: postBody?.exercises || [],
          },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [],
        });
      }
    });

    await page.goto('/workout');
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    // Pestaña: page.getByRole('button', { name: /plantillas|rutinas/i })
    const templatesTab = page.getByRole('button', { name: /plantillas|rutinas/i });
    await expect(templatesTab).toBeVisible({ timeout: 15000 });
    await templatesTab.click();

    // Botón nueva plantilla: page.getByRole('button', { name: /nueva plantilla/i })
    const newTemplateBtn = page.getByRole('button', { name: /nueva plantilla/i });
    await expect(newTemplateBtn).toBeVisible({ timeout: 10000 });
    await newTemplateBtn.click();

    // El selector de ejercicios se abre automáticamente al iniciar un entreno vacío
    // Agregar ejercicio directamente desde el selector (.workout-sheet ya visible)
    const exerciseItem = page.locator('.picker-exercise-item').first();
    await expect(exerciseItem).toBeVisible({ timeout: 10000 });
    await exerciseItem.click();

    const addBtn = page.getByRole('button', { name: /añadir al entreno/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();

    // Esperar a que el ejercicio aparezca en la sesión activa
    await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });

    // Guardar plantilla
    const saveBtn = page.getByRole('button', { name: /guardar como plantilla/i });
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Toast de éxito y verificación de llamada POST
    await expect(page.getByText(/plantilla guardada/i)).toBeVisible({ timeout: 10000 });
    expect(postReceived).toBe(true);
    expect(postBody).not.toBeNull();
    expect(postBody?.exercises?.length).toBeGreaterThanOrEqual(1);
    expect(postBody?.exercises?.[0].exerciseId).toBe('bench-press');
  });

  test('3. Inicio rápido de entreno desde plantilla con ejercicios y pesos sugeridos', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const mockExercises = [
      { id: 'bench-press', name: 'Press de Banca', muscle: 'pecho', equipment: 'barra' },
    ];

    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockExercises,
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    // Plantilla existente
    const mockTemplates = [
      {
        id: 'tpl-torso',
        name: 'Torso Hipertrofia',
        exercises: [{ exerciseId: 'bench-press' }],
      },
    ];

    await page.route(/\/api\/workouts\/templates(\/.*)?/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockTemplates,
      });
    });

    // Historial reciente con peso previo completado para bench-press (85.5 kg x 8 reps)
    await page.route('**/api/workouts/recent**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [
          {
            id: 'workout-recent-1',
            name: 'Torso Previo',
            startedAt: Date.now() - 86400000,
            finishedAt: Date.now() - 82800000,
            exercises: [
              {
                id: 'rec-ex-1',
                exerciseId: 'bench-press',
                notes: '',
                sets: [
                  {
                    id: 'rec-set-1',
                    type: 'normal',
                    weight: '85.5',
                    reps: '8',
                    completed: true,
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    await page.goto('/workout');
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    // Pestaña: page.getByRole('button', { name: /plantillas|rutinas/i })
    const templatesTab = page.getByRole('button', { name: /plantillas|rutinas/i });
    await expect(templatesTab).toBeVisible({ timeout: 15000 });
    await templatesTab.click();

    // Tarjeta plantilla: page.locator('li.card')
    const templateCard = page.locator('li.card').first();
    await expect(templateCard).toBeVisible({ timeout: 10000 });

    // Botón empezar: page.locator('li.card').getByRole('button', { name: /empezar/i })
    const startBtn = templateCard.getByRole('button', { name: /empezar/i });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();

    // Inicia sesión activa con ejercicio precargado
    await expect(page.locator('.exercise-card-header').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Press de Banca')).toBeVisible();

    // Peso y repeticiones sugeridos a partir del historial reciente
    const weightInput = page.locator('.set-input').first();
    await expect(weightInput).toHaveValue('85.5', { timeout: 5000 });
  });

  test('4. Eliminar plantilla dispara DELETE /api/workouts/templates/{id}, toast de éxito y remueve la tarjeta', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const mockExercises = [
      { id: 'bench-press', name: 'Press de Banca', muscle: 'pecho', equipment: 'barra' },
    ];

    await page.route('**/exercises.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockExercises,
      });
    });

    await page.route('**/exercises-base.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    let deleteRequested = false;
    let deletedId = '';
    let templatesData = [
      {
        id: 'tpl-delete-123',
        name: 'Rutina a Eliminar',
        exercises: [{ exerciseId: 'bench-press' }],
      },
    ];

    await page.route(/\/api\/workouts\/templates(\/.*)?/, async (route) => {
      const method = route.request().method();
      if (method === 'DELETE') {
        deleteRequested = true;
        const url = route.request().url();
        deletedId = url.split('/').pop()?.split('?')[0] || '';
        templatesData = [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { success: true },
        });
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: templatesData,
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/workout');
    await expect(page).toHaveURL(/.*workout.*/, { timeout: 15000 });

    // Pestaña: page.getByRole('button', { name: /plantillas|rutinas/i })
    const templatesTab = page.getByRole('button', { name: /plantillas|rutinas/i });
    await expect(templatesTab).toBeVisible({ timeout: 15000 });
    await templatesTab.click();

    // Tarjeta plantilla presente: page.locator('li.card')
    const cards = page.locator('li.card');
    await expect(cards).toHaveCount(1, { timeout: 10000 });
    await expect(cards.first()).toContainText('Rutina a Eliminar');

    // Botón eliminar: page.getByRole('button', { name: /eliminar plantilla/i })
    const deleteBtn = page.getByRole('button', { name: /eliminar plantilla/i });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // Verificaciones: toast de éxito, llamada DELETE y tarjeta removida
    await expect(page.getByText(/plantilla eliminada/i)).toBeVisible({ timeout: 10000 });
    expect(deleteRequested).toBe(true);
    expect(deletedId).toBe('tpl-delete-123');
    await expect(page.locator('li.card')).toHaveCount(0, { timeout: 10000 });
    await expect(page.getByText('Sin plantillas')).toBeVisible({ timeout: 10000 });
  });
});
