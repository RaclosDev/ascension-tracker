import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { THEME_TRIALS } from './themeTrials';

const KEY = 'ascension_theme_trial';

/** Provisional, localhost only: steps through the dark palettes being considered. */
export function ThemeTrial() {
  const [index, setIndex] = useState(() => {
    const saved = Number(localStorage.getItem(KEY));
    return saved > 0 && saved < THEME_TRIALS.length ? saved : 0;
  });
  useEffect(() => {
    let style = document.getElementById('theme-trial');
    if (!style) {
      style = document.createElement('style');
      style.id = 'theme-trial';
      document.head.append(style);
    }
    style.textContent = THEME_TRIALS[index].css;
    localStorage.setItem(KEY, String(index));
  }, [index]);
  return (
    <button
      type="button"
      className="nav-item"
      title="Provisional: cambia al siguiente modo oscuro de prueba"
      style={{ width: '100%', display: 'flex', alignItems: 'center' }}
      onClick={() => setIndex((index + 1) % THEME_TRIALS.length)}
    >
      <span className="nav-icon">
        <Palette size={20} aria-hidden />
      </span>
      <span style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem' }}>
        {THEME_TRIALS[index].name}
      </span>
    </button>
  );
}
