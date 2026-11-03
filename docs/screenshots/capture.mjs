import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const ts = require('typescript');
const origin = 'http://localhost:5173';
const output = fileURLToPath(new URL('./', import.meta.url));
// Reuse the maintained browser fixtures without sending data to a backend.
const asModule = (source) => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64');
const fixtures = asModule(await readFile(new URL('../../frontend/tests/helpers/fixtures.ts', import.meta.url), 'utf8'));
const auth = await readFile(new URL('../../frontend/tests/helpers/auth.ts', import.meta.url), 'utf8');
const { setupAuthMocks } = await import(asModule(auth.replace("'./fixtures'", JSON.stringify(fixtures))));
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  const failures = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) {
      failures.push(url.pathname);
      return route.fulfill({ status: 501, json: {} });
    }
    if (![origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(url.origin)) return route.abort();
    return route.continue();
  });
  await setupAuthMocks(page);
  await page.route('**/api/nutrition/macros**', route => route.fulfill({ json: { kcal: 2000, protein: 150, carbs: 200, fat: 70 } }));
  await page.route('**/api/nutrition/logs**', route => route.fulfill({ json: [{ id: 901, date: new Date().toLocaleDateString('en-CA'), mealIndex: 0, product: 'Avena con yogur', quantity: 250, kcal: 520, protein: 30, carbs: 64, fat: 16, portionsJson: null }] }));
  page.on('pageerror', error => failures.push(error.message));
  async function capture(name) {
    await page.evaluate(async () => {
      for (const family of ['Inter', 'Oswald']) {
        for (const weight of [400, 500, 600, 700]) {
          const loaded = await document.fonts.load(`${weight} 16px "${family}"`);
          if (!loaded.length || loaded.some(face => face.status !== 'loaded')) throw new Error(`Missing font: ${family}`);
        }
      }
      await document.fonts.ready;
    });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: false, animations: 'disabled' });
  }
  await page.goto(origin + '/dashboard');
  await expect(page.locator('.kpi-card')).toHaveCount(4);
  await capture('dashboard');
  await page.goto(origin + '/nutrition');
  await expect(page.getByText('Desayuno', { exact: true })).toBeVisible();
  await capture('nutrition');
  await page.goto(origin + '/workout');
  await page.getByRole('button', { name: /empezar entrenamiento/i }).click();
  await page.locator('.start-workout-option').filter({ hasText: /entrenamiento vac[ií]o/i }).click();
  await page.locator('.picker-exercise-item').first().click();
  await page.getByRole('button', { name: /a[ñn]adir al entreno/i }).click();
  await expect(page.locator('.exercise-card-header').first()).toBeVisible();
  await page.locator('.set-input').first().fill('60');
  await page.locator('.set-input').nth(1).fill('10');
  await page.locator('.set-input').nth(1).blur();
  await capture('workout');
  if (failures.length) throw new Error(failures.join(', '));
  console.log('Three mobile screenshots captured; fonts and overflow verified.');
} finally { await browser.close(); }
