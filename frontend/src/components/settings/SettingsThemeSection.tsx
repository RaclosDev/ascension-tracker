import React from 'react';
import { Palette } from 'lucide-react';
import { SettingsAccordionHeader } from './SettingsAccordionHeader';

interface SettingsThemeSectionProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  customColor: string;
  onColorChange: (color: string) => void;
  presets?: string[];
}

const DEFAULT_PRESETS = ['#0085FF', '#E11D48', '#FFFFFF', '#FF5E00', '#8B5CF6'];

export function SettingsThemeSection({
  isOpen,
  onToggle,
  customColor,
  onColorChange,
  presets = DEFAULT_PRESETS,
}: SettingsThemeSectionProps) {
  return (
    <div
      className={`card accordion-card transition-all duration-300 ease-out ${isOpen ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
    >
      <SettingsAccordionHeader
        panelId="settings-theme-panel"
        title="Tema y Apariencia"
        icon={Palette}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen && (
        <div
          id="settings-theme-panel"
          className="accordion-content fade-in mt-5 pt-5 border-t border-white/10"
        >
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Color Principal
            </label>
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
              El color acento que elegiste es el {customColor}. ¡Se aplicará instantáneamente en
              toda la aplicación!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
