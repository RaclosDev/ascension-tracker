import { Dumbbell, ChevronUp, ChevronDown } from 'lucide-react';
import { VariantSelector } from './variant-selector';
import { MUSCLE_LABEL, type Exercise, type ActiveWorkout } from '@/lib/workout/types';

interface Props {
  groupedList: Exercise[][];
  aliases: Record<string, string>;
  customGifs: Record<string, string>;
  active: ActiveWorkout | null;
  expandedId: string | null;
  toggleExpand: (id: string) => void;
  selectedGrip?: string;
  setSelectedGrip: (value: string | undefined) => void;
  selectedMachine?: string;
  setSelectedMachine: (value: string | undefined) => void;
  finalHistoricalGrips: string[];
  finalHistoricalMachines: string[];
  globalGrips: string[];
  globalMachines: string[];
  handleAddGrip: (value: string) => void;
  handleAddMachine: (value: string) => void;
  handleAddVariant: (id: string) => void;
}

export function ExercisePickerList({
  groupedList,
  aliases,
  customGifs,
  active,
  expandedId,
  toggleExpand,
  selectedGrip,
  setSelectedGrip,
  selectedMachine,
  setSelectedMachine,
  finalHistoricalGrips,
  finalHistoricalMachines,
  globalGrips,
  globalMachines,
  handleAddGrip,
  handleAddMachine,
  handleAddVariant,
}: Props) {
  return (
    <>
      {groupedList.length === 0 ? (
        <p
          style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          Nada coincide.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
            paddingBottom: '0.5rem',
          }}
        >
          {groupedList.map((group) => {
            const isGroup = group.length > 1;
            const baseName = isGroup
              ? (aliases[group[0].id] || group[0].name).replace(/\s*\(.*$/, '').trim()
              : null;

            return (
              <div key={group[0].id + '_group'}>
                {isGroup && <div className="picker-group-header">{baseName}</div>}
                <div style={{ paddingLeft: isGroup ? '0.25rem' : '0' }}>
                  {group.map((ex: import('@/lib/workout/types').Exercise) => {
                    const dName = aliases[ex.id] || ex.name;
                    const shortName = isGroup
                      ? dName.replace(/^[^(]*\(\s*/, '').replace(/\)\s*$/, '')
                      : dName;

                    const isExpanded = expandedId === ex.id;

                    return (
                      <div key={ex.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(ex.id)}
                          className="picker-exercise-item"
                          style={{
                            borderBottomLeftRadius: isExpanded ? 0 : undefined,
                            borderBottomRightRadius: isExpanded ? 0 : undefined,
                            borderBottom: isExpanded ? '1px solid var(--border-medium)' : undefined,
                          }}
                        >
                          {customGifs[ex.id] !== 'none' && (customGifs[ex.id] || ex.gifUrl) ? (
                            <img
                              src={customGifs[ex.id] || ex.gifUrl}
                              alt=""
                              loading="lazy"
                              className="picker-exercise-thumb"
                            />
                          ) : (
                            <div className="picker-exercise-thumb-placeholder">
                              <Dumbbell size={18} />
                            </div>
                          )}

                          <div className="picker-exercise-info">
                            <div className="picker-exercise-name">
                              {shortName}
                              {ex.custom && <span className="picker-custom-badge">Propio</span>}
                              {active?.exercises.some((e) => e.exerciseId === ex.id) && (
                                <span className="picker-in-workout-badge">En entreno</span>
                              )}
                            </div>
                            <div className="picker-exercise-meta">
                              {MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]} ·{' '}
                              {ex.equipment}
                            </div>
                          </div>
                          <div
                            style={{
                              color: 'var(--text-secondary)',
                              marginLeft: 'auto',
                              paddingRight: '0.5rem',
                            }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div
                            style={{
                              padding: '1rem',
                              background: 'var(--bg-secondary)',
                              borderBottomLeftRadius: '12px',
                              borderBottomRightRadius: '12px',
                              marginBottom: '0.15rem',
                            }}
                          >
                            {/* Grips */}
                            <div style={{ marginBottom: '1rem' }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  marginBottom: '0.5rem',
                                  fontWeight: 600,
                                }}
                              >
                                Agarre
                              </div>
                              <VariantSelector
                                type="grip"
                                value={selectedGrip}
                                onChange={(val) => setSelectedGrip(val)}
                                historicalOptions={finalHistoricalGrips}
                                globalOptions={globalGrips}
                                onAddOption={handleAddGrip}
                              />
                            </div>

                            {/* Machine (Input + Chips) */}
                            {(ex.equipment === 'maquina' ||
                              ex.equipment === 'polea' ||
                              ex.equipment === 'multipower') && (
                              <div style={{ marginBottom: '1rem' }}>
                                <div
                                  style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  Máquina / Variante
                                </div>
                                <VariantSelector
                                  type="machine"
                                  value={selectedMachine}
                                  onChange={(val) => setSelectedMachine(val)}
                                  historicalOptions={finalHistoricalMachines}
                                  globalOptions={globalMachines}
                                  onAddOption={handleAddMachine}
                                />
                              </div>
                            )}

                            <button
                              className="btn btn-primary"
                              style={{
                                width: '100%',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                marginTop: '0.5rem',
                              }}
                              onClick={() => handleAddVariant(ex.id)}
                            >
                              {active?.exercises.some((e) => e.exerciseId === ex.id)
                                ? 'Añadir de nuevo al entreno'
                                : 'Añadir al entreno'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
