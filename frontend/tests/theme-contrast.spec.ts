import { expect, test, type Locator } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

async function expectReadable(locator: Locator) {
  const result = await locator.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const blend = (front: number[], back: number[]) =>
      front
        .slice(0, 3)
        .map((channel, index) => (channel * front[3]) / 255 + back[index] * (1 - front[3] / 255));
    const ancestors: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement)
      ancestors.unshift(node);
    let background = [255, 255, 255];
    for (const node of ancestors) {
      const style = getComputedStyle(node);
      background = blend(rgba(style.backgroundColor), background);
      // The shared danger button uses a solid gradient rather than background-color.
      if (node === element && node.classList.contains('btn-danger')) {
        background = blend(rgba(style.getPropertyValue('--color-danger')), background);
      }
    }
    const color = getComputedStyle(element).color;
    const foreground = blend(rgba(color), background);
    const luminance = (rgb: number[]) =>
      rgb
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const a = luminance(foreground);
    const b = luminance(background);
    return {
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      color,
      background,
      label: element.textContent,
    };
  });
  expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(4.5);
}

for (const mode of ['dark', 'light']) {
  test(`controles legibles en pared, tarjeta y diálogo (${mode})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/tests/fixtures/theme-controls.html?mode=${mode}`);
    for (const color of [
      '#0b5f74',
      '#0085ff',
      '#e11d48',
      '#ff5e00',
      '#8b5cf6',
      '#000000',
      '#ffffff',
      '#ffff00',
    ]) {
      await page.getByLabel('Color de acento').fill(color);
      for (const scope of ['wall', 'card', 'dialog']) {
        const area = page.getByTestId(scope);
        for (const tab of await area.getByRole('tab').all()) await expectReadable(tab);
        for (const name of [
          'Uno',
          'Dos',
          'Prono',
          'Supino',
          '-5',
          '+5',
          'Guardar',
          'Completado',
          'Continuar',
          'Eliminar',
          'Serie completada',
          'Marcar serie',
        ]) {
          await expectReadable(area.getByRole('button', { name, exact: true }));
        }
      }
    }
    for (const scope of ['wall', 'card', 'dialog']) {
      const button = page.getByTestId(scope).getByRole('button', { name: 'Marcar serie' });
      await button.hover();
      await expectReadable(button);
    }
    await page.getByRole('button', { name: 'Abrir diálogo' }).click();
    const close = page.getByRole('button', { name: 'Cerrar', exact: true });
    await expectReadable(close);
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(close).toBeHidden();
  });

  test(`filtros de ejercicios mantienen contraste al cambiar de pestaña (${mode})`, async ({
    page,
  }, testInfo) => {
    await setupAuthMocks(page);
    await page.emulateMedia({
      colorScheme: mode === 'dark' ? 'dark' : 'light',
      reducedMotion: 'reduce',
    });
    await page.route('**/api/coach/profile', (route) => route.fulfill({ json: { active: false } }));
    await page.route('**/api/coaching/today?*', (route) => route.fulfill({ json: {} }));
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    await page.setViewportSize(
      mode === 'dark' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
    );
    await page.goto('/workout');
    await page.getByRole('button', { name: 'Ejercicios', exact: true }).click();
    const filters = page.getByRole('tablist', { name: 'Filtro de ejercicios' });
    for (const name of ['Básicos', 'Todos', 'Personalizados', 'Variantes']) {
      const tab = filters.getByRole('tab', { name, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(tab).toHaveCSS(
        'background-color',
        mode === 'dark' ? 'rgb(243, 236, 220)' : 'rgb(17, 24, 39)',
      );
      await expectReadable(tab);
    }
    await filters.getByRole('tab', { name: 'Básicos', exact: true }).click();
    await expect(filters.getByRole('tab', { name: 'Básicos', exact: true })).toHaveCSS(
      'color',
      mode === 'dark' ? 'rgb(17, 24, 39)' : 'rgb(243, 236, 220)',
    );
    await page.screenshot({ path: testInfo.outputPath(`exercises-${mode}.png`), fullPage: true });
  });
}
