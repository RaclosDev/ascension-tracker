import React from 'react';
import { Dumbbell, UploadCloud } from 'lucide-react';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { formatRestFriendly } from '../../lib/workout/format';

interface SettingsWorkoutSectionProps {
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

const EQUIPMENT_LABELS: Record<string, string> = {
  barra: 'Barra',
  mancuernas: 'Mancuernas',
  maquina: 'Máquina',
  multipower: 'Multipower (Smith)',
  polea: 'Polea',
  banda: 'Banda elástica',
  kettlebell: 'Kettlebell',
  'peso corporal': 'Peso corporal',
};

export function SettingsWorkoutSection({
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
    <div className="card p-4 sm:p-6">
      <SettingsSectionHeader
        title="Entrenamiento"
        icon={Dumbbell}
        description="Cómo se comportan tus sesiones y qué material tienes a mano."
      />
      <div className="settings-card-body">
        <section className="settings-group" aria-labelledby="settings-workout-session">
          <h3 id="settings-workout-session" className="settings-group-title">
            Durante la sesión
          </h3>
          <div className="settings-rows">
            <div className="form-group settings-row">
              <div className="settings-row-text">
                <span className="form-label">Descanso base (segundos)</span>
                <div className="form-hint">
                  El tiempo que se aplicará por defecto a todos los ejercicios si no configuras uno
                  específico.
                </div>
              </div>
              <div className="settings-row-control">
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

            <div className="form-group settings-row">
              <div className="settings-row-text">
                <span className="form-label">Mostrar RPE (esfuerzo percibido)</span>
                <div className="form-hint">
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
          </div>
        </section>

        <section className="settings-group" aria-labelledby="settings-workout-equipment">
          <h3 id="settings-workout-equipment" className="settings-group-title">
            Ocultar material no disponible
          </h3>
          <p className="settings-group-hint" style={{ marginBottom: '0.75rem' }}>
            Los ejercicios que usen estos materiales no aparecerán en las búsquedas ni en los
            catálogos.
          </p>
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
                    color: isHidden ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: isHidden ? 'line-through' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isHidden}
                    onChange={() => onToggleHiddenEquipment(eq)}
                    aria-label={`Ocultar material ${eq}`}
                  />
                  {EQUIPMENT_LABELS[eq] ?? eq}
                </label>
              );
            })}
          </div>
        </section>

        <section className="settings-group" aria-labelledby="settings-workout-hevy">
          {/* No es un encabezado: el diálogo de importación ya se titula igual. */}
          <p id="settings-workout-hevy" className="settings-group-title">
            Importar desde Hevy
          </p>
          <p className="settings-group-hint" style={{ marginBottom: 'var(--space-md)' }}>
            Sube el archivo{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>workout_data.csv</span>{' '}
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
        </section>
      </div>
    </div>
  );
}
