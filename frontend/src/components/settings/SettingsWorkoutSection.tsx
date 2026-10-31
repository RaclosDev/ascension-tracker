import React from 'react';
import { Dumbbell, UploadCloud } from 'lucide-react';
import { SettingsAccordionHeader } from './SettingsAccordionHeader';
import { formatRestFriendly } from '../../lib/workout/format';

interface SettingsWorkoutSectionProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  restPreset: number;
  onRestPresetChange: (val: number) => void;
  workoutSettings?: { showRpe: boolean };
  onWorkoutSettingsChange: (settings: { showRpe: boolean }) => void;
  hiddenEquipments: string[];
  onToggleHiddenEquipment: (eq: string) => void;
  onOpenHevyModal: () => void;
}

const ALL_EQUIPMENTS = [
  'barra',
  'mancuernas',
  'maquina',
  'multipower',
  'polea',
  'banda',
  'kettlebell',
  'peso corporal',
];

export function SettingsWorkoutSection({
  isOpen,
  onToggle,
  restPreset,
  onRestPresetChange,
  workoutSettings,
  onWorkoutSettingsChange,
  hiddenEquipments,
  onToggleHiddenEquipment,
  onOpenHevyModal,
}: SettingsWorkoutSectionProps) {
  const [localRest, setLocalRest] = React.useState(String(restPreset));

  React.useEffect(() => {
    setLocalRest(String(restPreset));
  }, [restPreset]);

  return (
    <div
      className={`card accordion-card transition-all duration-300 ease-out ${isOpen ? 'p-4 sm:p-6' : 'px-5 py-4'} mb-4`}
    >
      <SettingsAccordionHeader
        panelId="settings-workout-panel"
        title="Entrenamiento"
        icon={Dumbbell}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen && (
        <div
          id="settings-workout-panel"
          className="accordion-content fade-in mt-5 pt-5 border-t border-white/10"
        >
          <div
            className="form-group"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ paddingRight: '1rem' }}>
              <label className="form-label" style={{ marginBottom: '2px' }}>
                Descanso Base (segundos)
              </label>
              <div className="form-hint" style={{ marginTop: 0 }}>
                El tiempo que se aplicará por defecto a todos los ejercicios si no configuras uno
                específico.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                inputMode="numeric"
                className="form-input"
                style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}
                value={localRest}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalRest(val);
                  if (val !== '') {
                    const parsed = parseInt(val, 10);
                    if (!Number.isNaN(parsed) && parsed >= 5) {
                      onRestPresetChange(parsed);
                    }
                  }
                }}
                onBlur={() => {
                  const parsed = parseInt(localRest, 10);
                  if (Number.isNaN(parsed) || parsed < 5) {
                    setLocalRest(String(restPreset >= 5 ? restPreset : 90));
                    onRestPresetChange(restPreset >= 5 ? restPreset : 90);
                  }
                }}
                min="5"
                step="15"
                aria-label="Descanso base en segundos"
              />
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                seg ({formatRestFriendly(restPreset)})
              </span>
            </div>
          </div>

          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <label className="form-label" style={{ marginBottom: '2px' }}>
                Mostrar RPE (Esfuerzo Percibido)
              </label>
              <div className="form-hint" style={{ marginTop: 0 }}>
                Muestra una columna de RPE en los ejercicios para medir la intensidad (1-10)
              </div>
            </div>
            <label className="flex items-center justify-center min-w-11 min-h-11 cursor-pointer">
              <input
                type="checkbox"
                checked={workoutSettings?.showRpe ?? false}
                onChange={(e) =>
                  onWorkoutSettingsChange({ ...workoutSettings, showRpe: e.target.checked })
                }
                aria-label="Mostrar RPE en entrenamientos"
                style={{ transform: 'scale(1.2)' }}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              borderTop: '1px dashed var(--border-subtle)',
              paddingTop: '1.5rem',
            }}
          >
            <label className="form-label" style={{ marginBottom: '2px' }}>
              Ocultar material no disponible
            </label>
            <div className="form-hint" style={{ marginTop: 0, marginBottom: '1rem' }}>
              Los ejercicios que usen estos materiales no aparecerán en las búsquedas ni en los
              catálogos.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {ALL_EQUIPMENTS.map((eq) => {
                const isHidden = hiddenEquipments.includes(eq);
                return (
                  <label
                    key={eq}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minHeight: '44px',
                      fontSize: '0.85rem',
                      color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)',
                      textDecoration: isHidden ? 'line-through' : 'none',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isHidden}
                      onChange={() => onToggleHiddenEquipment(eq)}
                      aria-label={`Ocultar material ${eq}`}
                    />
                    {eq === 'multipower' ? 'Multipower (Smith)' : eq}
                  </label>
                );
              })}
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              borderTop: '1px dashed var(--border-subtle)',
              paddingTop: '1.5rem',
            }}
          >
            <label className="form-label">Importar desde Hevy</label>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginBottom: 'var(--space-md)',
              }}
            >
              Sube el archivo{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                workout_data.csv
              </span>{' '}
              exportado de Hevy para migrar todo tu histórico de entrenamientos.
            </p>
            <button
              type="button"
              onClick={onOpenHevyModal}
              className="btn btn-primary min-h-11"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
              aria-label="Abrir modal para importar entrenamientos desde Hevy"
            >
              <UploadCloud size={18} />
              Importar CSV de Hevy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
