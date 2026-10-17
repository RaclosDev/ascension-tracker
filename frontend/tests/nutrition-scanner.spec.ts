import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test.describe('Nutrition Diary & Barcode Scanner Flows', () => {
  test('Nutrition Page renders daily diary, macros summary and meals', async ({ page }) => {
    await setupAuthMocks(page);

    await page.goto('/nutrition');

    await expect(page).toHaveURL(/.*nutrition.*/, { timeout: 15000 });

    // Verify meals
    await expect(page.getByText('Desayuno')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Comida', { exact: true })).toBeVisible();
    await expect(page.getByText('Cena')).toBeVisible();

    // Verify Macro Summary Header
    await expect(page.getByText(/Calorías|kcal/i).first()).toBeVisible();
    await expect(page.getByText(/Proteínas/i).first()).toBeVisible();
    await expect(page.getByText(/Hidratos/i).first()).toBeVisible();
    await expect(page.getByText(/Grasas/i).first()).toBeVisible();
  });

  test('can switch between Diario and Mis Alimentos and view saved foods list', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    const savedFoodsFixture = [
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
    ];

    await page.route('**/api/nutrition/my-foods**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: savedFoodsFixture,
      });
    });

    await page.goto('/nutrition');

    // Switch to "Mis Alimentos"
    const foodsTab = page.getByRole('button', { name: /^Mis Alimentos$/i });
    await expect(foodsTab).toBeVisible({ timeout: 15000 });
    await foodsTab.click();

    // Verify items in list
    await expect(page.getByText('Pechuga de Pollo')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Arroz Basmati')).toBeVisible();
  });

  test('Barcode scanner triggers external lookup and renders preview card with action buttons', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    let savedFoodPayload: Record<string, unknown> | null = null;

    // Mock external barcode lookup
    await page.route('**/api/food-external/barcode**', async (route) => {
      const url = new URL(route.request().url());
      const code = url.searchParams.get('code');

      if (code === '8410000000000') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: {
            product: {
              product_name: 'Avena Integral Suave',
              brands: 'Hacendado',
              nutriments: {
                'energy-kcal_100g': 375,
                proteins_100g: 13.5,
                carbohydrates_100g: 58.7,
                fat_100g: 7.0,
              },
              serving_quantity: 100,
              serving_size: '100g',
            },
          },
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          json: { error: 'Product not found' },
        });
      }
    });

    // Mock POST /api/nutrition/my-foods (saving the scanned food)
    await page.route('**/api/nutrition/my-foods**', async (route) => {
      if (route.request().method() === 'POST') {
        savedFoodPayload = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: { id: 200, ...savedFoodPayload },
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [],
        });
      }
    });

    await page.goto('/nutrition');

    // Switch to "Mis Alimentos"
    await page.getByRole('button', { name: /^Mis Alimentos$/i }).click();

    // Click floating action button "+" to open menu
    const fabBtn = page.locator('button:has-text("+")').last();
    await expect(fabBtn).toBeVisible({ timeout: 10000 });
    await fabBtn.click();

    // Click "Escanear Código (Barras/QR)"
    const scanOption = page.getByRole('button', { name: /Escanear Código/i });
    await expect(scanOption).toBeVisible({ timeout: 5000 });
    await scanOption.click();

    // Scanner modal is open
    await expect(page.getByRole('heading', { name: 'Escanear' })).toBeVisible({ timeout: 5000 });

    // Wait for __testScanBarcode helper to be registered
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              typeof (window as unknown as { __testScanBarcode?: unknown }).__testScanBarcode ===
              'function',
          ),
        { timeout: 10000 },
      )
      .toBe(true);

    // Simulate scanning barcode 8410000000000
    await page.evaluate(() => {
      const fn = (window as unknown as { __testScanBarcode: (code: string) => void })
        .__testScanBarcode;
      fn('8410000000000');
    });

    // Scanned product card preview must appear
    await expect(page.getByText('Avena Integral Suave')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hacendado')).toBeVisible();
    await expect(page.getByText('375')).toBeVisible();
    await expect(page.getByText('13.5g')).toBeVisible();
    await expect(page.getByText('58.7g')).toBeVisible();
    await expect(page.getByText('7g', { exact: true })).toBeVisible();

    // Action buttons "Guardar" and "Editar" must be visible
    const saveScannedBtn = page.getByRole('button', { name: 'Guardar', exact: true });
    const editScannedBtn = page.getByRole('button', { name: 'Editar', exact: true });
    await expect(saveScannedBtn).toBeVisible();
    await expect(editScannedBtn).toBeVisible();

    // Click "Guardar"
    await saveScannedBtn.click();

    // Verify product was saved via POST /api/nutrition/my-foods
    await expect.poll(() => savedFoodPayload !== null, { timeout: 10000 }).toBeTruthy();
    expect(savedFoodPayload?.name).toBe('Avena Integral Suave');
    expect(savedFoodPayload?.kcalPer100g).toBe(375);
    expect(savedFoodPayload?.proteinPer100g).toBe(13.5);

    // Scanner modal closes on save
    await expect(page.getByRole('heading', { name: 'Escanear' })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('Barcode scanner displays error alert when product is not found in external databases', async ({
    page,
  }) => {
    await setupAuthMocks(page);

    await page.route('**/api/food-external/barcode**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { status: 0, product: null },
      });
    });

    await page.goto('/nutrition');
    await page.getByRole('button', { name: /^Mis Alimentos$/i }).click();

    // Open scanner modal
    const fabBtn = page.locator('button:has-text("+")').last();
    await fabBtn.click();
    await page.getByRole('button', { name: /Escanear Código/i }).click();

    await expect(page.getByRole('heading', { name: 'Escanear' })).toBeVisible({ timeout: 5000 });

    // Wait for scanner hook
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              typeof (window as unknown as { __testScanBarcode?: unknown }).__testScanBarcode ===
              'function',
          ),
        { timeout: 10000 },
      )
      .toBe(true);

    // Scan an unknown barcode
    await page.evaluate(() => {
      const fn = (window as unknown as { __testScanBarcode: (code: string) => void })
        .__testScanBarcode;
      fn('0000000000000');
    });

    // Error alert must appear
    await expect(page.getByText(/No se encontró ningún producto para el código/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
