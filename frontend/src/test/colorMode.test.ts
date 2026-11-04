import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyColorMode, readColorMode, saveColorMode, COLOR_MODE_KEY } from '../utils/colorMode';

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe('colorMode', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-mode');
    document.head.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('usa «Sistema» por defecto y descarta valores desconocidos', () => {
    expect(readColorMode()).toBe('system');
    localStorage.setItem(COLOR_MODE_KEY, 'sepia');
    expect(readColorMode()).toBe('system');
  });

  it('resuelve «Sistema» según la preferencia del dispositivo', () => {
    mockSystemDark(false);
    applyColorMode('system');
    expect(document.documentElement.dataset.mode).toBe('light');
    mockSystemDark(true);
    applyColorMode('system');
    expect(document.documentElement.dataset.mode).toBe('dark');
  });

  it('guarda el modo elegido y actualiza el color de la barra del sistema', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#0f172a">';
    saveColorMode('light');
    expect(localStorage.getItem(COLOR_MODE_KEY)).toBe('light');
    expect(document.documentElement.dataset.mode).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#e6e0d3',
    );
  });
});
