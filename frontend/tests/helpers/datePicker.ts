import type { Locator } from '@playwright/test';

/**
 * Elige un día en el calendario propio (src/components/ui/date-picker.tsx) como el usuario:
 * abre la hoja desde el botón, pasa de mes hasta el del día y lo pulsa. `iso` es AAAA-MM-DD.
 */
export async function pickDate(trigger: Locator, iso: string) {
  await trigger.click();
  const sheetId = await trigger.getAttribute('popovertarget');
  if (!sheetId) throw new Error('El elemento no es un calendario: no abre ninguna hoja');
  const sheet = trigger.page().locator(`[id="${sheetId}"]`);
  const target = iso.slice(0, 7);
  for (let i = 0; i < 60; i++) {
    const shown = await sheet
      .locator('.ui-date-day:not([data-outside])')
      .first()
      .getAttribute('data-date');
    const month = shown?.slice(0, 7) ?? target;
    if (month === target) break;
    await sheet
      .getByRole('button', { name: month < target ? 'Mes siguiente' : 'Mes anterior' })
      .click();
  }
  await sheet.locator(`[data-date="${iso}"]:not([data-outside])`).click();
}
