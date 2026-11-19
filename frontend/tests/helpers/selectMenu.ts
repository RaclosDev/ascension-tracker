import type { Locator } from '@playwright/test';

/**
 * Elige una opción de un desplegable propio (src/components/ui/select.tsx) como el usuario:
 * abre el menú desde el botón y pulsa la opción con ese valor.
 */
export async function chooseOption(trigger: Locator, value: string) {
  await trigger.click();
  const menuId = await trigger.getAttribute('aria-controls');
  if (!menuId) throw new Error('El elemento no es un desplegable: no controla ningún menú');
  await trigger.page().locator(`[id="${menuId}"] [data-value="${value}"]`).click();
}
