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
