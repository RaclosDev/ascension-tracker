import { useState } from 'react';

import { Bookmark, Square, Check, X, Save } from 'lucide-react';
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

import { WorkoutCelebrationModal } from '@/components/workout/WorkoutCelebrationModal';
import { useWorkoutStore } from '@/lib/workout/store';
import { useSaveWorkout, useSaveTemplate } from '@/lib/workout/api';
import { haptics } from '@/lib/haptics';
import toast from 'react-hot-toast';

export function FooterActions() {
  const activeWorkout = useWorkoutStore((s) => s.active);
  const isEditing = Boolean(activeWorkout?.editingId);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const clearActiveWorkout = useWorkoutStore((s) => s.clearActiveWorkout);
  const cancelEditWorkout = useWorkoutStore((s) => s.cancelEditWorkout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);
  const saveAsTemplate = useWorkoutStore((s) => s.saveAsTemplate);
  const saveWorkoutMutation = useSaveWorkout();
  const saveTemplateMutation = useSaveTemplate();

  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [cancelEditOpen, setCancelEditOpen] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasExercises = useWorkoutStore((s) => (s.active?.exercises.length ?? 0) > 0);

  function openFinish() {
    const active = useWorkoutStore.getState().active;
    if (!active) return;
    const hasWork = active.exercises.some((e) => e.sets.some((s) => s.completed));
    if (!hasWork) {
      haptics.warning();
      setEmptyOpen(true);
      return;
    }

    haptics.medium();
    // Cancel rest timer and notifications so bell sound doesn't ring while in finish modal
    useWorkoutStore.getState().skipRest();
    dismissRestNotifications();

    setSaveError(null);
    setFinishOpen(true);
  }

  function doSaveTemplate() {
    haptics.light();
    const tpl = saveAsTemplate();
    if (tpl) saveTemplateMutation.mutate(tpl);
  }

  function handleSaveEdit() {
    const active = useWorkoutStore.getState().active;
    if (!active) return;
    const hasWork = active.exercises.some((e) => e.sets.some((s) => s.completed));
    if (!hasWork) {
      haptics.warning();
      setEmptyOpen(true);
      return;
    }

    haptics.success();
    const durationMs =
      active.editingFinishedAt && active.startedAt
        ? Math.max(60000, active.editingFinishedAt - active.startedAt)
        : 3600000;

    const record = finishWorkout(active.name, durationMs, active.startedAt);
    if (!record) return;

    saveWorkoutMutation.mutate(record, {
      onSuccess: () => {
        clearActiveWorkout();
      },
      onError: () => {
        toast.error('Error al guardar los cambios del entrenamiento');
      },
    });
  }

  if (isEditing) {
    return (
      <div className="workout-footer-actions">
        <button
          onClick={handleSaveEdit}
          disabled={saveWorkoutMutation.isPending}
          className="workout-finish-btn btn-press"
          style={{ background: 'var(--accent-primary, #0284c7)' }}
        >
          <Save size={18} />
          {saveWorkoutMutation.isPending ? 'Guardando cambios...' : 'Guardar Cambios'}
        </button>

        <button className="workout-secondary-btn btn-press" onClick={() => setCancelEditOpen(true)}>
          <X size={16} />
          Cancelar edición
        </button>

        <AlertDialog open={cancelEditOpen} onOpenChange={setCancelEditOpen}>
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
                ¿Cancelar edición?
              </AlertDialogTitle>
              <AlertDialogDescription
                style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}
              >
                Los cambios no guardados en este entrenamiento se descartarán y volverás al
                historial.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn btn-secondary">Seguir editando</AlertDialogCancel>
              <AlertDialogAction
                className="btn btn-danger btn-press"
                onClick={() => {
                  haptics.light();
                  cancelEditWorkout();
                }}
              >
                Salir sin guardar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Empty sets warning */}
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
                Marca al menos una serie para guardar el entrenamiento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn btn-primary">Entendido</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="workout-footer-actions">
      <button onClick={openFinish} className="workout-finish-btn btn-press">
        <Check size={20} />
        Terminar Entrenamiento
      </button>
      <button
        className="workout-secondary-btn btn-press"
        onClick={doSaveTemplate}
        disabled={!hasExercises}
      >
        <Bookmark size={16} />
        Guardar como plantilla
      </button>
      <button
        className="workout-secondary-btn danger btn-press"
        onClick={() => {
          haptics.warning();
          setDiscardOpen(true);
        }}
      >
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
            <AlertDialogAction
              className="btn btn-danger btn-press"
              onClick={() => {
                haptics.warning();
                discardWorkout();
              }}
            >
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
        onSave={async (name, durationMin, notes, selectedStartedAt) => {
          setSaveError(null);
          const record = finishWorkout(name, durationMin * 60000, selectedStartedAt);
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
