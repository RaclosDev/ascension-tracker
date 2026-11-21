import { fireEvent } from '@testing-library/react';

/**
 * Elige una opción de un desplegable propio (components/ui/select.tsx) como lo haría el usuario:
 * abre el menú desde el botón y pulsa la opción con ese valor.
 */
export function chooseOption(trigger: HTMLElement, value: string) {
  const menuId = trigger.getAttribute('aria-controls');
  const menu = menuId ? document.getElementById(menuId) : null;
  if (!menu) throw new Error('El elemento no es un desplegable: no controla ningún menú');
  fireEvent.click(trigger);
  const item = menu.querySelector<HTMLButtonElement>(`[data-value="${CSS.escape(value)}"]`);
  if (!item) throw new Error(`El desplegable no tiene la opción «${value}»`);
  fireEvent.click(item);
}

/**
 * Elige un día en un selector de fecha propio (components/ui/date-picker.tsx): abre la hoja,
 * pasa de mes hasta el de la fecha y pulsa el día. Falla si el día está fuera de min/max.
 */
export function chooseDate(trigger: HTMLElement, iso: string) {
  const sheetId = trigger.getAttribute('aria-controls');
  const sheet = sheetId ? document.getElementById(sheetId) : null;
  if (!sheet) throw new Error('El elemento no es un selector de fecha: no controla ninguna hoja');
  fireEvent.click(trigger);
  for (let i = 0; i < 600; i++) {
    const day = sheet.querySelector<HTMLButtonElement>(`[data-date="${iso}"]:not([data-outside])`);
    if (day) {
      if (day.disabled) throw new Error(`El día ${iso} no se puede elegir`);
      fireEvent.click(day);
      return;
    }
    const shown = sheet.querySelector<HTMLElement>('[data-date]:not([data-outside])')?.dataset.date;
    const nav = sheet.querySelector<HTMLButtonElement>(
      `[aria-label="${shown && shown < iso ? 'Mes siguiente' : 'Mes anterior'}"]`,
    );
    if (!nav || nav.disabled) throw new Error(`El día ${iso} queda fuera del selector`);
    fireEvent.click(nav);
  }
  throw new Error(`No se llegó al mes de ${iso}`);
}
