import { useSyncExternalStore } from 'react';
import { DEMO } from '../demo/mode';

export type ColorMode = 'light' | 'dark' | 'system';

export const COLOR_MODE_KEY = 'ascension_color_mode';

const WALL_COLORS = { light: '#e6e0d3', dark: '#0f172a' } as const;
const DARK_QUERY = '(prefers-color-scheme: dark)';
const CHANGE_EVENT = 'ascension:color-mode';
/** Sin elección guardada la app sigue al sistema; la demo arranca en oscuro. */
const DEFAULT_MODE: ColorMode = DEMO ? 'dark' : 'system';

function isColorMode(value: string | null): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(COLOR_MODE_KEY);
    return isColorMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

/** Aplica el modo a `<html>` y al color de la barra del sistema. */
export function applyColorMode(mode: ColorMode): void {
  const resolved = resolveColorMode(mode);
  document.documentElement.setAttribute('data-mode', resolved);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', WALL_COLORS[resolved]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** El modo elegido (claro, oscuro o sistema), lo cambie quien lo cambie. */
export function useColorMode(): ColorMode {
  return useSyncExternalStore(subscribe, readColorMode);
}

/** El modo que se está viendo: claro u oscuro. */
export function useResolvedColorMode(): 'light' | 'dark' {
  return useSyncExternalStore(subscribe, () =>
    document.documentElement.getAttribute('data-mode') === 'light' ? 'light' : 'dark',
  );
}

export function saveColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(COLOR_MODE_KEY, mode);
  } catch {
    /* El modo se aplica en esta pestaña aunque no se pueda guardar. */
  }
  applyColorMode(mode);
}

/** Sigue los cambios del sistema mientras el modo elegido sea «Sistema». */
export function watchSystemColorMode(): () => void {
  const media = window.matchMedia?.(DARK_QUERY);
  if (!media) return () => {};
  const onChange = () => {
    if (readColorMode() === 'system') applyColorMode('system');
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
