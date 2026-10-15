import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus, Square, Check, ChevronDown } from 'lucide-react';
import { dismissRestNotifications } from '@/lib/workout/notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExerciseCard } from '@/components/workout/exercise-card';
import { ExercisePicker } from '@/components/workout/exercise-picker';
import { RestBanner } from '@/components/workout/rest-banner';
import { EmptyCard } from '@/components/workout/dashboard';
import { WorkoutCelebrationModal } from '@/components/workout/WorkoutCelebrationModal';
import { useWorkoutStore } from '@/lib/workout/store';
import type { WorkoutExercise } from '@/lib/workout/types';

const EMPTY_EXERCISES: WorkoutExercise[] = [];

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
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: 'var(--text-secondary)',
            }}
          >
            Entrenar
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Sin sesión activa
          </h1>
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
      <button onClick={() => setPickerOpen(true)} className="add-exercise-btn">
        <Plus size={18} />
        Añadir ejercicio
      </button>
      <FooterActions />
    </>
  );
}

function LiveSession() {
  const navigate = useNavigate();
  const workoutName = useWorkoutStore((s) => s.active?.name?.trim() || 'Entrenamiento');
  const exercises = useWorkoutStore((s) => s.active?.exercises ?? EMPTY_EXERCISES);

  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header
        className="live-session-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.25rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            En curso
          </span>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0.1rem 0 0',
            }}
          >
            {workoutName}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {totalSetsCount > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.35rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {completedSetsCount}/{totalSetsCount} series
            </span>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary live-session-minimize-btn"
            style={{
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
            aria-label="Minimizar entrenamiento y navegar por la app"
            title="Minimizar entrenamiento"
          >
            <ChevronDown size={16} />
            <span>Minimizar</span>
          </button>
        </div>
      </header>

      <RestBanner />

      {exercises.length === 0 ? (
        <EmptyCard
          title="Añade el primer ejercicio"
          body="Elige de la biblioteca o crea uno propio. Las series vacías esperan kilos y reps."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {exercises.map((row, i) => (
            <div key={row.id} style={{ display: 'flex', gap: '0.5rem' }}>
              {row.supersetId && (
                <div
                  style={{
                    width: '4px',
                    background: 'var(--accent-primary)',
                    borderRadius: '4px',
                    opacity: 0.8,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <ExerciseCard rowId={row.id} index={i} total={exercises.length} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useSaveWorkout, useSaveTemplate } from '@/lib/workout/api';

function FooterActions() {
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const clearActiveWorkout = useWorkoutStore((s) => s.clearActiveWorkout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);
  const saveAsTemplate = useWorkoutStore((s) => s.saveAsTemplate);
  const saveWorkoutMutation = useSaveWorkout();
  const saveTemplateMutation = useSaveTemplate();

  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasExercises = useWorkoutStore((s) => (s.active?.exercises.length ?? 0) > 0);

  function openFinish() {
    const active = useWorkoutStore.getState().active;
    if (!active) return;
    const hasWork = active.exercises.some((e) => e.sets.some((s) => s.completed));
    if (!hasWork) {
      setEmptyOpen(true);
      return;
    }

    // Cancel rest timer and notifications so bell sound doesn't ring while in finish modal
    useWorkoutStore.getState().skipRest();
    dismissRestNotifications();

    setSaveError(null);
    setFinishOpen(true);
  }

  function doSaveTemplate() {
    const tpl = saveAsTemplate();
    if (tpl) saveTemplateMutation.mutate(tpl);
  }

  return (
    <div className="workout-footer-actions">
      <button onClick={openFinish} className="workout-finish-btn">
        <Check size={20} />
        Terminar Entrenamiento
      </button>
      <button className="workout-secondary-btn" onClick={doSaveTemplate} disabled={!hasExercises}>
        <Bookmark size={16} />
        Guardar como plantilla
      </button>
      <button className="workout-secondary-btn danger" onClick={() => setDiscardOpen(true)}>
        <Square size={16} />
        Descartar
      </button>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent
          className="card"
          style={{
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            width: '95vw',
            maxWidth: '400px',
            maxHeight: '85dvh',
            overflowY: 'auto',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              ¿Descartar la sesión?
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}
            >
              Se pierde el cronómetro y las series de esta sesión. El historial no cambia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn btn-secondary">Seguir entrenando</AlertDialogCancel>
            <AlertDialogAction className="btn btn-danger" onClick={discardWorkout}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={emptyOpen} onOpenChange={setEmptyOpen}>
        <AlertDialogContent
          className="card"
          style={{
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            width: '95vw',
            maxWidth: '400px',
            maxHeight: '85dvh',
            overflowY: 'auto',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}
            >
              No hay series completadas
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}
            >
              Marca al menos una serie para guardar el entrenamiento en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn btn-primary">Entendido</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WorkoutCelebrationModal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        activeWorkout={useWorkoutStore.getState().active}
        onSave={async (name, durationMin, notes) => {
          setSaveError(null);
          const record = finishWorkout(name, durationMin * 60000);
          if (!record) return;
          if (notes) record.notes = notes;
          saveWorkoutMutation.mutate(record, {
            onSuccess: () => {
              setFinishOpen(false);
              clearActiveWorkout();
            },
            onError: () => {
              setSaveError(
                'No se pudo sincronizar con el servidor. Tu entrenamiento sigue protegido y guardado localmente en este dispositivo. Puedes reintentar cuando recuperes conexión.',
              );
            },
          });
        }}
        isSaving={saveWorkoutMutation.isPending}
        saveError={saveError}
      />
    </div>
  );
}
