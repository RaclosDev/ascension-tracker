import { test, expect, Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

const mockSavedFoods = [
  {
    id: 101,
    name: 'Pechuga de Pollo',
    brand: 'Mercadona',
    kcalPer100g: 110,
    proteinPer100g: 23,
    carbsPer100g: 0,
    fatPer100g: 1.5,
    servingSize: 100,
    servingLabel: '100g',
  },
  {
    id: 102,
    name: 'Arroz Basmati',
    brand: 'Brillante',
    kcalPer100g: 350,
    proteinPer100g: 8,
    carbsPer100g: 77,
    fatPer100g: 1,
    servingSize: 100,
    servingLabel: '100g',
  },
  {
    id: 103,
    name: 'Aceite de Oliva',
    brand: 'Carbonell',
    kcalPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    servingSize: 15,
    servingLabel: '15ml',
  },
];

const mockRecipes = [
  {
    id: 201,
    name: 'Tortilla de Avena',
    description: JSON.stringify([
      { product: 'Avena', quantity: 50, kcal: 180, protein: 7, carbs: 30, fat: 3 },
      { product: 'Huevo', quantity: 100, kcal: 140, protein: 12, carbs: 1, fat: 10 },
    ]),
    totalKcal: 320,
    totalProtein: 19,
    totalCarbs: 31,
    totalFat: 13,
  },
];

const mockRecentFoods = [
  {
    id: 301,
    product: 'Manzana Fuji',
    kcal: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    date: '2026-10-12',
    mealIndex: 1,
    amount: 100,
  },
];

async function setupMyFoodsRoutes(
  page: Page,
  options?: {
    savedFoods?: typeof mockSavedFoods;
    recipes?: typeof mockRecipes;
    onPostFood?: (payload: Record<string, unknown>) => void;
    onPutFood?: (id: string, payload: Record<string, unknown>) => void;
    onDeleteFood?: (id: string) => void;
    onPostRecipe?: (payload: Record<string, unknown>) => void;
    onDeleteRecipe?: (id: string) => void;
  },
) {
  const currentSaved = options?.savedFoods ?? [...mockSavedFoods];
  const currentRecipes = options?.recipes ?? [...mockRecipes];

  await page.route(/\/api\/nutrition\/my-foods(\/.*)?$/, async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: currentSaved,
      });
    } else if (method === 'POST') {
      const data = route.request().postDataJSON();
      options?.onPostFood?.(data);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        json: { id: 104, ...data },
      });
    } else if (method === 'PUT') {
      const id = url.split('/').pop() || '101';
      const data = route.request().postDataJSON();
      options?.onPutFood?.(id, data);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { id: Number(id) || 101, ...data },
      });
    } else if (method === 'DELETE') {
      const id = url.split('/').pop() || '';
      options?.onDeleteFood?.(id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true },
      });
    } else {
      await route.continue();
    }
  });

  await page.route(/\/api\/nutrition\/recipes(\/.*)?$/, async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: currentRecipes,
      });
    } else if (method === 'POST') {
      const data = route.request().postDataJSON();
      options?.onPostRecipe?.(data);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        json: { id: 202, ...data },
      });
    } else if (method === 'DELETE') {
      const id = url.split('/').pop() || '';
      options?.onDeleteRecipe?.(id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true },
      });
    } else {
      await route.continue();
    }
  });

  await page.route(/\/api\/nutrition\/logs\/recent(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockRecentFoods,
    });
  });
}

async function navigateToMyFoods(page: Page) {
  await page.goto('/nutrition');
  await expect(page).toHaveURL(/.*nutrition.*/, { timeout: 15000 });
  const foodsTab = page.getByRole('button', { name: /^Mis Alimentos$/i });
  await expect(foodsTab).toBeVisible({ timeout: 15000 });
  await foodsTab.click();
  await expect(page.getByPlaceholder(/buscar/i)).toBeVisible({ timeout: 10000 });
}

function getSearchBox(page: Page) {
  return page
    .getByRole('searchbox', { name: /buscar alimentos o recetas/i })
    .or(page.getByPlaceholder(/buscar/i));
}

function getViewModeButton(page: Page) {
  return page
    .getByRole('button', { name: /cuadr[ií]cula|lista/i })
    .or(page.locator('.mobile-scroll-x + button'));
}

async function openNewFoodModal(page: Page) {
  const directBtn = page.getByRole('button', { name: /nuevo alimento/i });
  if (await directBtn.isVisible().catch(() => false)) {
    await directBtn.click();
    return;
  }
  const fab = page
    .getByRole('button', { name: '+' })
    .or(page.getByRole('button', { name: /crear nuevo alimento/i }));
  await fab.click();
  const manualBtn = page.getByRole('button', { name: /crear manualmente/i });
  await manualBtn.click();
}

async function openNewRecipeForm(page: Page) {
  const directBtn = page.getByRole('button', { name: /nueva receta/i });
  if (await directBtn.isVisible().catch(() => false)) {
    await directBtn.click();
    return;
  }
  const createRecipeHeader = page
    .getByText(/crear receta con ingredientes/i)
    .or(page.getByText(/crear receta/i));
  await createRecipeHeader.first().click();
}

test.describe('Mis Alimentos & Recetas (MyFoodsPage)', () => {
  test('1. Filtros y búsqueda en tiempo real: texto, tipo, macro predominante y ordenación', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await setupMyFoodsRoutes(page);
    await navigateToMyFoods(page);

    const searchInput = getSearchBox(page);

    // 1.1 Búsqueda por texto
    await searchInput.fill('Arroz');
    await expect(page.getByText('Arroz Basmati')).toBeVisible();
    await expect(page.getByText('Pechuga de Pollo')).not.toBeVisible();

    await searchInput.clear();
    await expect(page.getByText('Pechuga de Pollo')).toBeVisible();
    await expect(page.getByText('Arroz Basmati')).toBeVisible();

    // 1.2 Filtro por tipo (Todos, Mis Alimentos, Recetas)
    // Filtro Recetas
    const recipesTab = page
      .locator('.mobile-scroll-x button')
      .filter({ has: page.locator('svg.lucide-chef-hat') });
    await recipesTab.click();
    await expect(page.getByText('Tortilla de Avena')).toBeVisible();
    await expect(page.getByText('Pechuga de Pollo')).not.toBeVisible();

    // Filtro Alimentos
    const foodsTab = page
      .locator('.mobile-scroll-x button')
      .filter({ has: page.locator('svg.lucide-apple') });
    await foodsTab.click();
    await expect(page.getByText('Pechuga de Pollo')).toBeVisible();
    await expect(page.getByText('Tortilla de Avena')).not.toBeVisible();

    // Filtro Todos
    const allTab = page
      .locator('.mobile-scroll-x button')
      .filter({ has: page.locator('svg.lucide-layout-grid') });
    await allTab.click();
    await expect(page.getByText('Pechuga de Pollo')).toBeVisible();
    await expect(page.getByText('Tortilla de Avena')).toBeVisible();

    // 1.3 Filtro por macro predominante (Proteína, Hidratos, Grasas)
    const proteinBtn = page.getByRole('button', { name: /^Prote[ií]na$/i });
    const carbsBtn = page.getByRole('button', { name: /^Carbos$/i });
    const fatBtn = page.getByRole('button', { name: /^Grasa$/i });
    const allMacroBtn = page.getByRole('button', { name: /^Todos$/i });

    // Filtrar por Proteína
    await proteinBtn.click();
    await expect(page.getByText('Pechuga de Pollo')).toBeVisible();
    await expect(page.getByText('Arroz Basmati')).not.toBeVisible();
    await expect(page.getByText('Aceite de Oliva')).not.toBeVisible();

    // Filtrar por Hidratos / Carbos
    await carbsBtn.click();
    await expect(page.getByText('Arroz Basmati')).toBeVisible();
    await expect(page.getByText('Pechuga de Pollo')).not.toBeVisible();
    await expect(page.getByText('Aceite de Oliva')).not.toBeVisible();

    // Filtrar por Grasas
    await fatBtn.click();
    await expect(page.getByText('Aceite de Oliva')).toBeVisible();
    await expect(page.getByText('Pechuga de Pollo')).not.toBeVisible();
    await expect(page.getByText('Arroz Basmati')).not.toBeVisible();

    // Restaurar Todos los macros
    await allMacroBtn.click();
    await expect(page.getByText('Pechuga de Pollo')).toBeVisible();
    await expect(page.getByText('Arroz Basmati')).toBeVisible();
    await expect(page.getByText('Aceite de Oliva')).toBeVisible();

    // 1.4 Ordenación alfabética y visualización de calorías
    const sortSelect = page
      .getByRole('combobox', { name: /ordenar alimentos/i })
      .or(page.getByLabel(/ordenar alimentos/i));
    await sortSelect.selectOption('name_asc');

    // Verificar orden alfabético A-Z
    const foodCards = page
      .locator('.food-card')
      .or(page.locator('div[draggable="true"]').filter({ hasText: /kcal/i }));
    await expect(foodCards.first()).toBeVisible();

    const firstCardText = await foodCards.nth(0).innerText();
    const secondCardText = await foodCards.nth(1).innerText();
    const thirdCardText = await foodCards.nth(2).innerText();

    expect(firstCardText).toContain('Aceite de Oliva');
    expect(secondCardText).toContain('Arroz Basmati');
    expect(thirdCardText).toContain('Pechuga de Pollo');

    // Comprobar visualización de calorías en las tarjetas
    await expect(page.getByText('110 kcal')).toBeVisible();
    await expect(page.getByText('350 kcal')).toBeVisible();
    await expect(page.getByText('884 kcal')).toBeVisible();
  });

  test('2. Toggle vista cuadrícula vs lista: alternancia de clases y estructura del catálogo', async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await setupMyFoodsRoutes(page);
    await navigateToMyFoods(page);

    const toggleButton = getViewModeButton(page);
    const gridContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');

    // Por defecto inicia en vista cuadrícula (grid)
    await expect(gridContainer).toBeVisible();

    // Alternar a vista lista
    await toggleButton.click();
    await expect(gridContainer).not.toBeVisible();

    // Verificar que los alimentos ahora se listan con la estructura de fila/lista
    const listContainer = page
      .locator('.flex.flex-col.gap-2')
      .filter({ hasText: 'Pechuga de Pollo' });
    await expect(listContainer).toBeVisible();

    // Alternar de regreso a vista cuadrícula
    await toggleButton.click();
    await expect(gridContainer).toBeVisible();
  });

  test('3. Crear y editar alimento manual: cálculo automático de Kcal, POST y PUT', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let createdPayload: Record<string, unknown> | null = null;
    let updatedPayload: Record<string, unknown> | null = null;
    let updatedId: string | null = null;

    await setupMyFoodsRoutes(page, {
      onPostFood: (payload) => {
        createdPayload = payload;
      },
      onPutFood: (id, payload) => {
        updatedId = id;
        updatedPayload = payload;
      },
    });

    await navigateToMyFoods(page);

    // 3.1 Crear alimento manual
    await openNewFoodModal(page);

    const modal = page.locator('[role="dialog"]').filter({ hasText: /Alimento/i });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Crear Alimento/i)).toBeVisible();

    const nameInput = modal.locator('div:has(> label:has-text("Nombre")) input');
    const brandInput = modal.locator('div:has(> label:has-text("Marca")) input');
    const protInput = modal.locator('div:has(> label:has-text("Prot")) input');
    const carbInput = modal.locator('div:has(> label:has-text("Carb")) input');
    const fatInput = modal.locator('div:has(> label:has-text("Grasa")) input');
    const kcalInput = modal.locator('div:has(> label:has-text("Kcal")) input');
    const servingSizeInput = modal.getByPlaceholder('Ej: 30');
    const servingLabelInput = modal.getByPlaceholder('Ej: 1 cazo');

    await nameInput.fill('Yogur Griego');
    await brandInput.fill('Fage');
    await protInput.fill('10');
    await carbInput.fill('4');
    await fatInput.fill('5');

    // Verificación de cálculo automático: P*4 + C*4 + F*9 = 10*4 + 4*4 + 5*9 = 40 + 16 + 45 = 101 kcal
    await expect(kcalInput).toHaveValue('101');

    await servingSizeInput.fill('150');
    await servingLabelInput.fill('1 tarrina');

    // Guardar alimento con POST /api/nutrition/my-foods
    const saveButton = modal.getByRole('button', { name: /^Guardar$/i });
    await saveButton.click();

    await expect(modal).not.toBeVisible();
    expect(createdPayload).toMatchObject({
      name: 'Yogur Griego',
      brand: 'Fage',
      proteinPer100g: 10,
      carbsPer100g: 4,
      fatPer100g: 5,
      kcalPer100g: 101,
      servingSize: 150,
      servingLabel: '1 tarrina',
    });

    // 3.2 Editar alimento manual existente con PUT /api/nutrition/my-foods/{id}
    const chickenCard = page
      .locator('.food-card')
      .or(page.locator('div[draggable="true"]'))
      .filter({ hasText: 'Pechuga de Pollo' })
      .first();
    await chickenCard.getByTitle('Editar').click();

    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Editar Alimento/i)).toBeVisible();

    await expect(nameInput).toHaveValue('Pechuga de Pollo');
    await expect(protInput).toHaveValue('23');

    // Modificar datos
    await nameInput.fill('Pechuga de Pollo Fileteada');
    await protInput.fill('24');

    // Recálculo automático: 24*4 + 0*4 + 1.5*9 = 96 + 13.5 = 109.5 kcal
    await expect(kcalInput).toHaveValue('109.5');

    const updateButton = modal.getByRole('button', { name: /^Actualizar$/i });
    await updateButton.click();

    await expect(modal).not.toBeVisible();
    expect(updatedId).toBe('101');
    expect(updatedPayload).toMatchObject({
      name: 'Pechuga de Pollo Fileteada',
      proteinPer100g: 24,
      kcalPer100g: 109.5,
    });
  });

  test('4. Crear y eliminar receta: ingredientes y porciones, POST y DELETE /api/nutrition/recipes', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let createdRecipePayload: Record<string, unknown> | null = null;
    let deletedRecipeId: string | null = null;

    await setupMyFoodsRoutes(page, {
      onPostRecipe: (payload) => {
        createdRecipePayload = payload;
      },
      onDeleteRecipe: (id) => {
        deletedRecipeId = id;
      },
    });

    // Configurar aceptación automática del confirm de borrado
    page.on('dialog', (dialog) => dialog.accept());

    await navigateToMyFoods(page);

    // 4.1 Crear receta
    await openNewRecipeForm(page);

    const recipeNameInput = page.getByPlaceholder('Nombre de receta');
    await expect(recipeNameInput).toBeVisible();
    await recipeNameInput.fill('Batido Proteico Casero');

    const protRecipeInput = page.getByPlaceholder('Prot total');
    const carbRecipeInput = page.getByPlaceholder('Carb total');
    const fatRecipeInput = page.getByPlaceholder('Grasa total');
    const kcalRecipeInput = page.getByPlaceholder('Kcal total');

    await protRecipeInput.fill('32');
    await carbRecipeInput.fill('40');
    await fatRecipeInput.fill('6');

    // Cálculo automático al rellenar macros de receta: 32*4 + 40*4 + 6*9 = 128 + 160 + 54 = 342 kcal
    await expect(kcalRecipeInput).toHaveValue('342');

    // Guardar receta con POST /api/nutrition/recipes
    const saveRecipeBtn = page.getByRole('button', { name: /guardar receta/i });
    await saveRecipeBtn.click();

    expect(createdRecipePayload).toMatchObject({
      name: 'Batido Proteico Casero',
      totalProtein: 32,
      totalCarbs: 40,
      totalFat: 6,
      totalKcal: 342,
    });

    // 4.2 Eliminar receta existente con DELETE /api/nutrition/recipes/{id}
    const recipeCard = page
      .locator('.recipe-card')
      .or(page.locator('div[draggable]').filter({ hasText: 'Tortilla de Avena' }))
      .first();
    await recipeCard.getByTitle('Editar').click();

    // Formulario de edición abierto
    await expect(page.getByText(/Editar Receta/i)).toBeVisible();

    // Botón de eliminar en el formulario
    const deleteRecipeBtn = page.getByRole('button', { name: /eliminar receta/i });
    await expect(deleteRecipeBtn).toBeVisible();
    await deleteRecipeBtn.click();

    expect(deletedRecipeId).toBe('201');
  });

  test('5. Selección múltiple y borrado masivo: BulkSelectionToolbar con contador y DELETE en lote', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const deletedFoodIds: string[] = [];

    await setupMyFoodsRoutes(page, {
      onDeleteFood: (id) => {
        deletedFoodIds.push(id);
      },
    });

    // Aceptar automáticamente los diálogos window.confirm
    page.on('dialog', (dialog) => dialog.accept());

    await navigateToMyFoods(page);

    const bulkToolbar = page.locator('.bulk-action-bar');

    // Inicialmente no debe haber ninguna barra de acciones en masa
    await expect(bulkToolbar).not.toBeVisible();

    const chickenCard = page
      .locator('.food-card')
      .or(page.locator('div[draggable="true"]'))
      .filter({ hasText: 'Pechuga de Pollo' })
      .first();

    const riceCard = page
      .locator('.food-card')
      .or(page.locator('div[draggable="true"]'))
      .filter({ hasText: 'Arroz Basmati' })
      .first();

    // Seleccionar primer alimento (Pechuga de Pollo)
    await chickenCard.click();
    await expect(bulkToolbar).toBeVisible();
    await expect(bulkToolbar.getByText('1 seleccionados')).toBeVisible();

    // Seleccionar segundo alimento (Arroz Basmati)
    await riceCard.click();
    await expect(bulkToolbar.getByText('2 seleccionados')).toBeVisible();

    // Ejecutar borrado en lote
    const bulkDeleteBtn = bulkToolbar.getByRole('button', { name: /borrar/i });
    await bulkDeleteBtn.click();

    // Verificar que se invocó DELETE para ambos IDs
    expect(deletedFoodIds).toContain('101');
    expect(deletedFoodIds).toContain('102');
  });
});
