import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Plus,
  Square,
  Check,
  ChevronDown,
  Edit3,
  Calendar,
  Clock,
  X,
  Save,
} from 'lucide-react';
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
import { useSaveWorkout, useSaveTemplate } from '@/lib/workout/api';
import { haptics } from '@/lib/haptics';
import toast from 'react-hot-toast';
import type { WorkoutExercise } from '@/lib/workout/types';

const EMPTY_EXERCISES: WorkoutExercise[] = [];

function toLocalDatetimeString(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function fromLocalDatetimeString(str: string): number {
  if (!str) return Date.now();
  const d = new Date(str);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

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

function LiveSession() {
  const navigate = useNavigate();
  const activeWorkout = useWorkoutStore((s) => s.active);
  const setWorkoutName = useWorkoutStore((s) => s.setWorkoutName);
  const setWorkoutDate = useWorkoutStore((s) => s.setWorkoutDate);
  const isEditing = Boolean(activeWorkout?.editingId);
  const workoutName = activeWorkout?.name?.trim() || 'Entrenamiento';
  const exercises = activeWorkout?.exercises ?? EMPTY_EXERCISES;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(workoutName);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetsCount = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0,
  );

  const durationMin = activeWorkout
    ? Math.max(
        1,
        Math.round(
          ((activeWorkout.editingFinishedAt || activeWorkout.startedAt + 3600000) -
            activeWorkout.startedAt) /
            60000,
        ),
      )
    : 60;

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
        <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}
          >
            {isEditing ? (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary-light, #38bdf8)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                <Edit3 size={11} />
                Modo edición
              </span>
            ) : (
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
            )}
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (titleInput.trim()) setWorkoutName(titleInput.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (titleInput.trim()) setWorkoutName(titleInput.trim());
                }
              }}
              autoFocus
              className="set-input"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                textAlign: 'left',
                padding: '0.2rem 0.5rem',
                width: '100%',
                maxWidth: '320px',
              }}
            />
          ) : (
            <h2
              onClick={() => {
                setTitleInput(workoutName);
                setIsEditingTitle(true);
              }}
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0.1rem 0 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              title="Pulsa para cambiar el nombre"
            >
              <span>{workoutName}</span>
              <Edit3 size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            </h2>
          )}
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
            onClick={() => {
              haptics.light();
              navigate('/dashboard');
            }}
            className="btn btn-secondary live-session-minimize-btn btn-press"
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

      {/* Date & Time configuration card */}
      {activeWorkout && (
        <div
          className="workout-session-details-bar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.65rem 0.9rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              flex: 1,
              minWidth: '220px',
            }}
          >
            <Calendar
              size={16}
              style={{ color: 'var(--accent-primary-light, #38bdf8)', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Fecha y hora del entreno
                </span>
                {!isEditing && !showDatePicker && (
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary-light, #38bdf8)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    (Cambiar si fue ayer)
                  </button>
                )}
              </div>
              {isEditing || showDatePicker ? (
                <input
                  type="datetime-local"
                  value={toLocalDatetimeString(activeWorkout.startedAt)}
                  onChange={(e) => {
                    const ts = fromLocalDatetimeString(e.target.value);
                    setWorkoutDate(ts);
                  }}
                  className="workout-date-input"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.4rem',
                    cursor: 'pointer',
                    outline: 'none',
                    marginTop: '0.2rem',
                    maxWidth: '240px',
                  }}
                />
              ) : (
                <span
                  style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}
                >
                  {new Date(activeWorkout.startedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Duración
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginTop: '0.2rem',
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={durationMin}
                    onChange={(e) => {
                      const min = Math.max(1, parseInt(e.target.value, 10) || 1);
                      const newFinishedAt = activeWorkout.startedAt + min * 60000;
                      setWorkoutDate(activeWorkout.startedAt, newFinishedAt);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      width: '60px',
                      textAlign: 'center',
                      padding: '0.2rem 0.25rem',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isEditing && <RestBanner />}

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

function FooterActions() {
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

        {/* Modal de confirmación para cancelar edición */}
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

export default ActiveWorkout;
