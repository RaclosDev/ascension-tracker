import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export interface ExerciseVariantsTabProps {
  globalGrips: string[];
  globalMachines: string[];
  onAddGrip: (grip: string) => void;
  onRemoveGrip: (grip: string) => void;
  onAddMachine: (machine: string) => void;
  onRemoveMachine: (machine: string) => void;
}

export function ExerciseVariantsTab({
  globalGrips,
  globalMachines,
  onAddGrip,
  onRemoveGrip,
  onAddMachine,
  onRemoveMachine,
}: ExerciseVariantsTabProps) {
  const [newGrip, setNewGrip] = useState('');
  const [newMachine, setNewMachine] = useState('');

  return (
    <div
      style={{
        padding: '0 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      <div>
        <h3
          style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Agarres Guardados
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {globalGrips.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No hay agarres guardados.
            </div>
          )}
          {globalGrips.map((g) => (
            <div
              key={g}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                fontSize: '0.85rem',
              }}
            >
              <span>{g}</span>
              <button
                type="button"
                onClick={() => onRemoveGrip(g)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
                aria-label={`Eliminar agarre ${g}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={newGrip}
            onChange={(e) => setNewGrip(e.target.value)}
            placeholder="Añadir agarre..."
            className="form-input"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newGrip.trim()) {
                onAddGrip(newGrip.trim());
                setNewGrip('');
              }
            }}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            Añadir
          </button>
        </div>
      </div>

      <div>
        <h3
          style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: 'var(--text-primary)',
          }}
        >
          Máquinas / Marcas
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {globalMachines.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No hay máquinas guardadas.
            </div>
          )}
          {globalMachines.map((m) => (
            <div
              key={m}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                fontSize: '0.85rem',
              }}
            >
              <span>{m}</span>
              <button
                type="button"
                onClick={() => onRemoveMachine(m)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
                aria-label={`Eliminar máquina ${m}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={newMachine}
            onChange={(e) => setNewMachine(e.target.value)}
            placeholder="Añadir máquina..."
            className="form-input"
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newMachine.trim()) {
                onAddMachine(newMachine.trim());
                setNewMachine('');
              }
            }}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
