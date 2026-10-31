import { Bookmark, Plus } from 'lucide-react';

import { ExercisePicker } from '@/components/workout/exercise-picker';

import { EmptyCard } from '@/components/workout/dashboard';
import { useWorkoutStore } from '@/lib/workout/store';

import { haptics } from '@/lib/haptics';

import { LiveSession } from './live-session';
import { FooterActions } from './workout-footer-actions';

export function ActiveWorkout() {
  const hasActive = useWorkoutStore((s) => s.active !== null);
  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const setPickerOpen = useWorkoutStore((s) => s.setPickerOpen);

  if (!hasActive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <header style={{ marginBottom: '1rem' }}>
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            Entrenar
          </p>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Sin sesión activa
          </h2>
        </header>
        <EmptyCard
          title="Empieza cuando quieras"
          body="Crea una sesión vacía o lanza una plantilla. El historial rellena kilos y reps."
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => startEmpty()}
            className="btn btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Entrenamiento vacío
          </button>
          <button
            onClick={() => useWorkoutStore.getState().setTab('templates')}
            className="btn btn-secondary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <Bookmark size={18} style={{ marginRight: '0.5rem', color: 'var(--text-secondary)' }} />
            Mis Plantillas
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LiveSession />
      <ExercisePicker />
      <button
        onClick={() => {
          haptics.light();
          setPickerOpen(true);
        }}
        className="add-exercise-btn btn-press"
      >
        <Plus size={18} />
        Añadir ejercicio
      </button>
      <FooterActions />
    </>
  );
}

export default ActiveWorkout;
