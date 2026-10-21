import { test, expect, Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

interface CustomPayload {
  id?: string;
  name?: string;
  muscle?: string;
  equipment?: string;
  exerciseGifs?: Record<string, string>;
  [key: string]: unknown;
}

const MOCK_CATALOG_EXERCISES = [
  {
    id: 'bench-press-bar',
    name: 'Press de Banca con Barra',
    muscle: 'pecho',
    equipment: 'barra',
  },
  {
    id: 'dumbbell-fly',
    name: 'Aperturas con Mancuernas',
    muscle: 'pecho',
    equipment: 'mancuernas',
  },
  {
    id: 'chest-press-machine',
    name: 'Press de Pecho en Máquina',
    muscle: 'pecho',
    equipment: 'maquina',
  },
  {
    id: 'barbell-row',
    name: 'Remo con Barra',
    muscle: 'espalda_alta',
    equipment: 'barra',
  },
  {
    id: 'dumbbell-row',
    name: 'Remo con Mancuerna',
    muscle: 'dorsales',
    equipment: 'mancuernas',
  },
  {
    id: 'leg-press-machine',
    name: 'Prensa de Piernas',
    muscle: 'cuadriceps',
    equipment: 'maquina',
  },
];

async function setupStandardExerciseMocks(
  page: Page,
  extraExercises: Array<{
    id: string;
    name: string;
    muscle: string;
    equipment: string;
    gifUrl?: string;
  }> = [],
) {
  const combined = [...MOCK_CATALOG_EXERCISES, ...extraExercises];
  await page.route('**/exercises.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: combined,
    });
  });

  await page.route('**/exercises-base.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: combined,
    });
  });
}

test.describe('Workout History and Exercise Catalog', () => {
  test('1. Listado de historial y modal de detalles', async ({ page }) => {
    await setupAuthMocks(page);
    await setupStandardExerciseMocks(page);

    const pastWorkout = {
      id: 'workout-past-101',
      name: 'Torso Potencia',
      startedAt: 1700000000000,
      finishedAt: 1700003600000, // 3600000ms = 1:00:00 de duración
      notes: 'Excelente sesión de empuje',
      exercises: [
        {
          id: 'we-past-1',
          exerciseId: 'bench-press-bar',
          sets: [
            { id: 's-1', type: 'normal', weight: 80, reps: 8, completed: true },
            { id: 's-2', type: 'normal', weight: 80, reps: 8, completed: true },
          ],
        },
      ],
    };

    await page.route(/\/api\/workouts(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/workouts') {
        await route.fallback();
        return;
      }

      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            content: [pastWorkout],
            number: 0,
            totalPages: 1,
            totalElements: 1,
          },
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/workout');

    // Click en la pestaña 'Historial'
    const historyTab = page.getByRole('button', { name: /historial/i });
    await expect(historyTab).toBeVisible({ timeout: 15000 });
    await historyTab.click();

    // Comprobar que aparece la tarjeta del entreno
    const workoutCard = page.locator('article.card').filter({ hasText: 'Torso Potencia' });
    await expect(workoutCard).toBeVisible({ timeout: 15000 });

    // Click en el entrenamiento para abrir el modal a pantalla completa
    await workoutCard.getByRole('button').first().click();

    // Verificar modal .workout-detail-modal
    const detailModal = page.locator('.workout-detail-modal');
    await expect(detailModal).toBeVisible({ timeout: 10000 });
    await expect(detailModal.getByRole('heading', { name: 'Torso Potencia' })).toBeVisible();

    // Verificar duración (1:00:00)
    await expect(detailModal.getByText('Duración', { exact: false })).toBeVisible();
    await expect(detailModal.getByText('1:00:00')).toBeVisible();

    // Verificar volumen total (80*8 + 80*8 = 1280 kg)
    await expect(detailModal.getByText('Volumen', { exact: false })).toBeVisible();
    await expect(detailModal.getByText(/1\.?280 kg/i)).toBeVisible();

    // Verificar series completadas (2 series) en la estadística de resumen
    await expect(detailModal.getByText('Series', { exact: false })).toBeVisible();
    await expect(detailModal.getByRole('paragraph').filter({ hasText: /^2$/ })).toBeVisible();
  });

  test('2. Edición de entreno pasado previene duplicados', async ({ page }) => {
    await setupAuthMocks(page);
    await setupStandardExerciseMocks(page);

    const pastWorkout = {
      id: 'workout-edit-102',
      name: 'Torso Potencia a Editar',
      startedAt: 1700000000000,
      finishedAt: 1700003600000,
      notes: 'Sesión anterior',
      exercises: [
        {
          id: 'we-edit-1',
          exerciseId: 'bench-press-bar',
          sets: [{ id: 's-edit-1', type: 'normal', weight: 80, reps: 8, completed: true }],
        },
      ],
    };

    let postReceived = false;
    let putReceived = false;
    let putId = '';
    let putPayload: CustomPayload | null = null;

    await page.route(/\/api\/workouts(\/.*)?(\?.*)?$/, async (route) => {
      const req = route.request();
      const method = req.method();
      const url = new URL(req.url());
      const pathname = url.pathname;

      if (pathname === '/api/workouts') {
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: {
              content: [pastWorkout],
              number: 0,
              totalPages: 1,
              totalElements: 1,
            },
          });
          return;
        }

        if (method === 'POST') {
          postReceived = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { id: 'unexpected-post-id' },
          });
          return;
        }
      }

      if (
        pathname.startsWith('/api/workouts/') &&
        pathname !== '/api/workouts/recent' &&
        pathname !== '/api/workouts/templates' &&
        pathname !== '/api/workouts/custom-exercises'
      ) {
        if (method === 'PUT') {
          putReceived = true;
          putId = pathname.replace('/api/workouts/', '');
          putPayload = req.postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            json: { id: putId, ...putPayload },
          });
          return;
        }
      }

      await route.fallback();
    });

    await page.goto('/workout');

    // Navegar al historial
    const historyTab = page.getByRole('button', { name: /historial/i });
    await expect(historyTab).toBeVisible({ timeout: 15000 });
    await historyTab.click();

    // Localizar la tarjeta del entreno
    const workoutCard = page.locator('article.card').filter({ hasText: 'Torso Potencia a Editar' });
    await expect(workoutCard).toBeVisible({ timeout: 15000 });

    // Click en el botón de editar en la tarjeta (primer botón secundario de acciones de la tarjeta)
    const editBtn = workoutCard.locator('.btn-secondary, button:has(svg)').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // Verificar que carga la sesión en el editor de entrenamiento activo
    const finishBtn = page.getByRole('button', { name: /guardar cambios|terminar entrenamiento/i });
    await expect(finishBtn).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Torso Potencia a Editar')).toBeVisible();

    // Terminar sesión
    await finishBtn.click();

    // Si abre modal de confirmación, confirmar guardado
    const confirmSaveBtn = page.getByRole('button', { name: /^guardar$/i });
    if (await confirmSaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmSaveBtn.click();
    }

    // Esperar toast de éxito
    await expect(page.getByText('Entrenamiento guardado')).toBeVisible({ timeout: 10000 });

    // Verificaciones críticas: PUT enviado con el ID existente, ningún POST enviado
    expect(putReceived).toBe(true);
    expect(putId).toBe('workout-edit-102');
    expect(putPayload.id).toBe('workout-edit-102');
    expect(postReceived).toBe(false);
  });

  test('3. Catálogo de ejercicios y filtrado', async ({ page }) => {
    await setupAuthMocks(page);
    await setupStandardExerciseMocks(page);

    await page.goto('/workout');

    // Pestaña 'Ejercicios'
    const exercisesTab = page.getByRole('button', { name: 'Ejercicios', exact: true });
    await expect(exercisesTab).toBeVisible({ timeout: 15000 });
    await exercisesTab.click();

    // Comprobar que los ejercicios iniciales están presentes en la lista
    await expect(page.getByText('Press de Banca con Barra')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Remo con Barra')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Prensa de Piernas')).toBeVisible({ timeout: 10000 });

    // Filtrar por grupo muscular: 'pecho'
    const muscleSelect = page.locator('#filter-muscle-select');
    await expect(muscleSelect).toBeVisible({ timeout: 10000 });
    await muscleSelect.selectOption('pecho');

    // Verificar que solo se muestran ejercicios de pecho
    await expect(page.getByText('Press de Banca con Barra')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Aperturas con Mancuernas')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Press de Pecho en Máquina')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Remo con Barra')).toHaveCount(0);
    await expect(page.getByText('Prensa de Piernas')).toHaveCount(0);

    // Filtrar además por material/equipamiento: 'mancuernas'
    const equipSelect = page.locator('#filter-equipment-select');
    await expect(equipSelect).toBeVisible({ timeout: 10000 });
    await equipSelect.selectOption('mancuernas');

    // Verificar que solo se muestra el de pecho con mancuernas
    await expect(page.getByText('Aperturas con Mancuernas')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Press de Banca con Barra')).toHaveCount(0);
    await expect(page.getByText('Press de Pecho en Máquina')).toHaveCount(0);

    // Cambiar filtro de material a 'maquina'
    await equipSelect.selectOption('maquina');
    await expect(page.getByText('Press de Pecho en Máquina')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Aperturas con Mancuernas')).toHaveCount(0);

    // Cambiar grupo muscular a 'espalda_alta' y material a 'barra'
    await muscleSelect.selectOption('espalda_alta');
    await equipSelect.selectOption('barra');
    await expect(page.getByText('Remo con Barra')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Press de Pecho en Máquina')).toHaveCount(0);
  });

  test('4. Crear ejercicio personalizado', async ({ page }) => {
    await setupAuthMocks(page);
    await setupStandardExerciseMocks(page);

    let postPayload: CustomPayload | null = null;
    await page.route('**/api/workouts/custom-exercises**', async (route) => {
      if (route.request().method() === 'POST') {
        postPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            id: 'custom-ex-created-1',
            ...postPayload,
            custom: true,
          },
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [],
      });
    });

    await page.goto('/workout');

    // Pestaña 'Ejercicios'
    const exercisesTab = page.getByRole('button', { name: 'Ejercicios', exact: true });
    await expect(exercisesTab).toBeVisible({ timeout: 15000 });
    await exercisesTab.click();

    // Click en botón para crear ejercicio en la cabecera
    const createBtn = page.getByRole('button', { name: /crear|\+ nuevo/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Verificar modal CreateExerciseModal
    const modalTitle = page.getByRole('heading', { name: /crear ejercicio/i });
    await expect(modalTitle).toBeVisible({ timeout: 10000 });

    // Rellenar formulario
    await page.locator('#create-exercise-name').fill('Fondos Lastrados en Paralelas');
    await page.locator('#create-exercise-muscle').selectOption('pecho');
    await page.locator('#create-exercise-equipment').selectOption('mancuernas');

    // Enviar formulario
    const saveBtn = page.getByRole('button', { name: 'Guardar' });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();

    // Verificar toast de éxito
    await expect(page.getByText('Ejercicio guardado')).toBeVisible({ timeout: 10000 });

    // Verificar payload enviado por POST
    expect(postPayload).not.toBeNull();
    expect(postPayload.name).toBe('Fondos Lastrados en Paralelas');
    expect(postPayload.muscle).toBe('pecho');
    expect(postPayload.equipment).toBe('mancuernas');
  });

  test('5. Editar ejercicio personalizado y asignar GIF', async ({ page }) => {
    await setupAuthMocks(page);

    const catalogWithGif = [
      {
        id: 'cable-pushdown-gif',
        name: 'Extensión Tríceps Polea Alta',
        muscle: 'triceps',
        equipment: 'polea',
        gifUrl: 'https://example.com/cable-pushdown.gif',
      },
    ];
    await setupStandardExerciseMocks(page, catalogWithGif);

    const initialCustomExercise = {
      id: 'custom-ex-501',
      name: 'Press Francés Mancuerna',
      muscle: 'triceps',
      equipment: 'mancuernas',
      custom: true,
    };

    let currentCustomExercises = [initialCustomExercise];
    let putPayload: CustomPayload | null = null;
    let putId = '';

    await page.route(/\/api\/workouts\/custom-exercises(\/.*)?$/, async (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: currentCustomExercises,
        });
        return;
      }

      if (method === 'PUT') {
        putId = url.pathname.split('/api/workouts/custom-exercises/')[1] || '';
        putPayload = route.request().postDataJSON();
        currentCustomExercises = currentCustomExercises.map((ex) =>
          ex.id === putId ? { ...ex, ...putPayload } : ex,
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: putId, ...putPayload },
        });
        return;
      }

      await route.continue();
    });

    let prefsPutPayload: { exerciseGifs: Record<string, string>; [key: string]: unknown } | null =
      null;
    await page.route('**/api/workout-preferences**', async (route) => {
      if (route.request().method() === 'PUT') {
        prefsPutPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: prefsPutPayload,
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          defaultRestSeconds: 90,
          showRpe: false,
          hiddenEquipments: [],
          exerciseGifs: {},
          restTimers: {},
          globalMachines: [],
          globalGrips: [],
          exerciseVariants: {},
          exerciseAliases: {},
        },
      });
    });

    await page.goto('/workout');

    // Pestaña 'Ejercicios'
    const exercisesTab = page.getByRole('button', { name: 'Ejercicios', exact: true });
    await expect(exercisesTab).toBeVisible({ timeout: 15000 });
    await exercisesTab.click();

    // Pestaña 'Personalizados'
    const customTab = page.getByRole('tab', { name: /personalizados/i });
    await expect(customTab).toBeVisible({ timeout: 10000 });
    await customTab.click();

    // Localizar tarjeta del ejercicio personalizado
    const customCard = page.locator('li').filter({ hasText: /Press Francés Mancuerna/i });
    await expect(customCard).toBeVisible({ timeout: 15000 });

    // Abrir menú de opciones
    const moreMenuBtn = customCard.getByRole('button', { name: 'Más opciones' });
    await expect(moreMenuBtn).toBeVisible({ timeout: 10000 });
    await moreMenuBtn.click();

    // Click en Editar
    const editOption = page.getByRole('menuitem', { name: 'Editar' });
    await expect(editOption).toBeVisible({ timeout: 10000 });
    await editOption.click();

    // Modal CreateExerciseModal en modo edición
    const editModalTitle = page.getByRole('heading', { name: /editar ejercicio personalizado/i });
    await expect(editModalTitle).toBeVisible({ timeout: 10000 });

    // Modificar datos (nombre)
    const nameInput = page.locator('#create-exercise-name');
    await nameInput.fill('Press Francés Mancuerna Pro');

    // Guardar cambios
    const updateBtn = page.getByRole('button', { name: 'Actualizar' });
    await expect(updateBtn).toBeVisible({ timeout: 10000 });
    await updateBtn.click();

    // Toast de éxito para actualización
    await expect(page.getByText('Ejercicio actualizado')).toBeVisible({ timeout: 10000 });

    // Verificar PUT a /api/workouts/custom-exercises/{id}
    expect(putId).toBe('custom-ex-501');
    expect(putPayload.name).toBe('Press Francés Mancuerna Pro');

    // Ahora asignar GIF: abrir menú de opciones nuevamente
    await moreMenuBtn.click();

    const changeGifOption = page.getByRole('menuitem', { name: /cambiar gif/i });
    await expect(changeGifOption).toBeVisible({ timeout: 10000 });
    await changeGifOption.click();

    // Modal ChangeGifModal
    const gifModalTitle = page.getByRole('heading', { name: /seleccionar gif/i });
    await expect(gifModalTitle).toBeVisible({ timeout: 10000 });

    // Seleccionar el ejercicio del catálogo que tiene GIF
    const gifItemBtn = page.locator('button').filter({ hasText: 'Extensión Tríceps Polea Alta' });
    await expect(gifItemBtn).toBeVisible({ timeout: 10000 });
    await gifItemBtn.click();

    // Verificar que se actualizó /api/workout-preferences con la URL del GIF
    await expect.poll(() => prefsPutPayload).not.toBeNull();
    expect(prefsPutPayload.exerciseGifs['custom-ex-501']).toBe(
      'https://example.com/cable-pushdown.gif',
    );
  });
});
