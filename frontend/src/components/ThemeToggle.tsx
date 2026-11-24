import { Moon, Sun } from 'lucide-react';
import { saveColorMode, useResolvedColorMode } from '../utils/colorMode';

/**
 * Cambia entre el modo oscuro y el claro; el icono enseña el modo al que se va. En el menú
 * lateral es una fila más con su rótulo; en la cabecera del móvil, solo el icono.
 */
export function ThemeToggle({ variant }: { variant: 'nav' | 'icon' }) {
  const next = useResolvedColorMode() === 'dark' ? 'light' : 'dark';
  const label = next === 'light' ? 'Modo claro' : 'Modo oscuro';
  const Icon = next === 'light' ? Sun : Moon;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className="mobile-theme-btn"
        aria-label={`Cambiar a ${label.toLowerCase()}`}
        title={`Cambiar a ${label.toLowerCase()}`}
        onClick={() => saveColorMode(next)}
      >
        <Icon size={20} aria-hidden />
      </button>
    );
  }
  return (
    <button
      type="button"
      className="nav-item"
      title={`Cambiar a ${label.toLowerCase()}`}
      style={{ width: '100%', display: 'flex', alignItems: 'center' }}
      onClick={() => saveColorMode(next)}
    >
      <span className="nav-icon">
        <Icon size={20} aria-hidden />
      </span>
      <span className="nav-label" style={{ flex: 1, textAlign: 'left' }}>
        {label}
      </span>
    </button>
  );
}
