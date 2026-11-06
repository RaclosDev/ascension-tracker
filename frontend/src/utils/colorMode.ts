export type ColorMode = 'light' | 'dark' | 'system';

export const COLOR_MODE_KEY = 'ascension_color_mode';

const WALL_COLORS = { light: '#e6e0d3', dark: '#0f172a' } as const;
const DARK_QUERY = '(prefers-color-scheme: dark)';

function isColorMode(value: string | null): value is ColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(COLOR_MODE_KEY);
    return isColorMode(stored) ? stored : 'system';
  } catch {
    return 'system';
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
