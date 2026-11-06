import { useState } from 'react';
import { Palette } from 'lucide-react';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SegmentedControl } from '../ui/segmented-control';
import { readColorMode, saveColorMode, type ColorMode } from '../../utils/colorMode';

interface SettingsThemeSectionProps {
  customColor: string;
  onColorChange: (color: string) => void;
  presets?: string[];
}

const DEFAULT_PRESETS = ['#0085FF', '#E11D48', '#FFFFFF', '#FF5E00', '#8B5CF6'];

const MODE_OPTIONS: { label: string; value: ColorMode }[] = [
  { label: 'Claro', value: 'light' },
  { label: 'Oscuro', value: 'dark' },
  { label: 'Sistema', value: 'system' },
];

function isColorMode(value: string): value is ColorMode {
  return MODE_OPTIONS.some((option) => option.value === value);
}

export function SettingsThemeSection({
  customColor,
  onColorChange,
  presets = DEFAULT_PRESETS,
}: SettingsThemeSectionProps) {
  const [colorMode, setColorMode] = useState<ColorMode>(readColorMode);

  const handleModeChange = (value: string) => {
    if (!isColorMode(value)) return;
    setColorMode(value);
    saveColorMode(value);
  };

  return (
    <div className="card p-4 sm:p-6">
      <SettingsSectionHeader title="Tema y Apariencia" icon={Palette} />
      <div className="mt-5 pt-5 border-t border-white/10">
        <div className="form-group" role="group" aria-labelledby="settings-color-mode-label">
          <span
            id="settings-color-mode-label"
            className="form-label"
            style={{ marginBottom: '0.5rem', display: 'block' }}
          >
            Modo
          </span>
          <SegmentedControl options={MODE_OPTIONS} value={colorMode} onChange={handleModeChange} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            «Sistema» sigue el modo claro u oscuro de tu dispositivo.
          </p>
        </div>
        <div className="form-group">
          <span className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Color Principal
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="color"
              value={customColor}
              onChange={(e) => onColorChange(e.target.value)}
              aria-label="Selector de color personalizado"
              style={{
                width: '44px',
                height: '44px',
                flexShrink: 0,
                padding: '0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', alignItems: 'center' }}>
              {presets.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorChange(color)}
                  className="flex items-center justify-center w-11 h-11 p-0 bg-transparent border-none cursor-pointer"
                  title={color}
                  aria-label={`Color ${color}`}
                >
                  <span
                    className="block w-8 h-8 rounded-full"
                    style={{
                      background: color,
                      border: customColor === color ? '2px solid white' : '2px solid transparent',
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginTop: '0.75rem',
            }}
          >
            El color acento que elegiste es el {customColor}. ¡Se aplicará instantáneamente en toda
            la aplicación!
          </p>
        </div>
      </div>
    </div>
  );
}
