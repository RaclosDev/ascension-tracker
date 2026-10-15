import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Clock,
  Dumbbell,
  Award,
  Share2,
  Check,
  X,
  Zap,
  Layers,
  Loader2,
  FileText,
} from 'lucide-react';
import { haptics } from '@/lib/haptics';
import {
  formatKg,
  isPrSet,
  sessionVolume,
  completedSets,
  formatDayLong,
} from '@/lib/workout/format';
import { useExerciseCatalog } from '@/lib/workout/catalog-query';
import { useCustomExercises, useRecentWorkouts } from '@/lib/workout/api';
import { getExerciseMap } from '@/lib/workout/exercises';
import type {
  CompletedWorkout,
  ActiveWorkout,
  WorkoutExercise,
  WorkoutSet,
} from '@/lib/workout/types';

interface Props {
  open: boolean;
  onClose: () => void;
  // Mode 1: Finishing an active session (interactive review & save)
  activeWorkout?: ActiveWorkout | null;
  onSave?: (name: string, durationMin: number, notes?: string) => Promise<void> | void;
  isSaving?: boolean;
  saveError?: string | null;
  // Mode 2: Viewing a previously completed record
  workout?: CompletedWorkout | null;
}

export function WorkoutCelebrationModal({
  open,
  onClose,
  activeWorkout,
  onSave,
  isSaving = false,
  saveError = null,
  workout,
}: Props) {
  const { data: catalogExercises } = useExerciseCatalog();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: recentWorkouts = [] } = useRecentWorkouts();
  const catalog = useMemo(
    () => getExerciseMap(customExercises),
    [customExercises, catalogExercises],
  );

  // Determine current workout source
  const currentWorkout = activeWorkout || workout;

  // Local editable form fields for active finishing flow
  const initialDurationMin = useMemo(() => {
    if (!currentWorkout) return 45;
    if ('startedAt' in currentWorkout && currentWorkout.startedAt) {
      const end =
        'editingFinishedAt' in currentWorkout && currentWorkout.editingFinishedAt
          ? currentWorkout.editingFinishedAt
          : 'finishedAt' in currentWorkout && currentWorkout.finishedAt
            ? currentWorkout.finishedAt
            : Date.now();
      return Math.max(1, Math.round((end - currentWorkout.startedAt) / 60000));
    }
    return 45;
  }, [currentWorkout]);

  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState(initialDurationMin);
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    if (open && currentWorkout) {
      setCustomName(currentWorkout.name?.trim() || 'Entrenamiento');
      setCustomDuration(initialDurationMin);
      setCustomNotes(currentWorkout.notes || '');
      haptics.celebration();
    }
  }, [open, currentWorkout, initialDurationMin]);

  if (!open || !currentWorkout) return null;

  const exercises: WorkoutExercise[] = currentWorkout.exercises || [];

  // Filter completed sets and exercises
  const completedExercisesList = exercises
    .map((ex) => {
      const meta = catalog.get(ex.exerciseId);
      const doneSets = ex.sets.filter((s) => s.completed);
      const exVolume = doneSets.reduce((sum, s) => {
        const w = parseFloat(String(s.weight || '0').replace(',', '.'));
        const r = parseInt(String(s.reps || '0'), 10);
        return sum + (!isNaN(w) && !isNaN(r) ? w * r : 0);
      }, 0);

      // Best set calculation (highest weight or 1RM)
      let bestSet: WorkoutSet | null = null;
      let maxWeight = -1;
      let maxReps = -1;
      for (const s of doneSets) {
        const w = parseFloat(String(s.weight || '0').replace(',', '.')) || 0;
        const r = parseInt(String(s.reps || '0'), 10) || 0;
        if (w > maxWeight || (w === maxWeight && r > maxReps)) {
          maxWeight = w;
          maxReps = r;
          bestSet = s;
        }
      }

      const hasPr = doneSets.some((s) =>
        isPrSet(ex.exerciseId, ex.variant, s.weight, recentWorkouts),
      );

      return {
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: meta?.name || 'Ejercicio',
        muscle: meta?.muscle,
        gifUrl: meta?.gifUrl,
        variant: ex.variant,
        completedSetsCount: doneSets.length,
        sets: doneSets,
        volume: exVolume,
        bestSet,
        hasPr,
      };
    })
    .filter((e) => e.completedSetsCount > 0);

  // High-level real metrics
  const totalVolumeKg = sessionVolume(exercises);
  const totalCompletedSets = completedSets(exercises);
  const totalPrsCount = exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets.filter(
        (s) => s.completed && isPrSet(ex.exerciseId, ex.variant, s.weight, recentWorkouts),
      ).length,
    0,
  );

  const dateLabel = formatDayLong(
    'startedAt' in currentWorkout && currentWorkout.startedAt
      ? currentWorkout.startedAt
      : Date.now(),
  );

  const handleShare = async () => {
    haptics.light();
    const workoutTitle = customName.trim() || currentWorkout.name || 'Entrenamiento';
    const exercisesNames = completedExercisesList.map((e) => e.name).join(', ');
    const shareText = `🏋️‍♂️ ¡He completado "${workoutTitle}" en Ascension Tracker!\n📊 ${formatKg(totalVolumeKg)} levantados • ${totalCompletedSets} series • ${customDuration} min\n💪 ${exercisesNames}`;

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Ascension Tracker - ${workoutTitle}`,
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(customName, customDuration, customNotes);
    } else {
      onClose();
    }
  };

  const isInteractiveFinish = !!onSave;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md fade-in overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-dialog-title"
    >
      <div
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl rounded-none sm:rounded-3xl border-0 sm:border border-white/10 flex flex-col shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #121214 0%, #09090B 100%)',
          backdropFilter: 'blur(30px)',
        }}
      >
        {/* Subtle Ambient Accent Glow at the top */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(0, 133, 255, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Modal Top Navigation Bar */}
        <div className="relative flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-3.5 border-b border-white/[0.08] flex-shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
              <Trophy size={16} />
            </div>
            <div>
              <h2
                id="finish-dialog-title"
                className="text-base font-bold text-white tracking-tight leading-tight"
              >
                Finalizar Sesión
              </h2>
              <p className="text-[0.7rem] text-gray-400 capitalize">{dateLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            aria-label="Cerrar resumen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">
          {/* Editable Session Details (Workout Name & Duration) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div>
              <label
                htmlFor="finish-workout-name"
                className="text-[0.7rem] uppercase tracking-wider font-bold text-gray-400 block mb-1.5"
              >
                Nombre del entrenamiento
              </label>
              <input
                id="finish-workout-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                disabled={isSaving}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1C1C1E] border border-white/10 text-white font-semibold text-sm focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                placeholder="Ej. Torso Fuerza, Pierna..."
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label
                  htmlFor="finish-workout-duration"
                  className="text-[0.7rem] uppercase tracking-wider font-bold text-gray-400 block mb-1.5"
                >
                  Duración (min)
                </label>
                <input
                  id="finish-workout-duration"
                  type="number"
                  min="1"
                  value={customDuration}
                  onChange={(e) =>
                    setCustomDuration(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  disabled={isSaving}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1C1C1E] border border-white/10 text-white font-semibold text-sm font-mono focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <span className="text-[0.7rem] uppercase tracking-wider font-bold text-gray-400 block mb-1.5">
                  Ejercicios
                </span>
                <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold text-sm font-mono flex items-center gap-1.5">
                  <Layers size={14} className="text-gray-400" />
                  <span>{completedExercisesList.length}</span>
                  <span className="text-xs text-gray-400 font-normal">ejercicios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Dumbbell size={13} className="text-[var(--accent-primary)]" />
                <span className="text-[0.65rem] uppercase font-bold tracking-wider">Volumen</span>
              </div>
              <div
                className="text-base font-extrabold text-white font-mono"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatKg(totalVolumeKg)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Clock size={13} className="text-cyan-400" />
                <span className="text-[0.65rem] uppercase font-bold tracking-wider">Tiempo</span>
              </div>
              <div
                className="text-base font-extrabold text-white font-mono"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {customDuration}
                <span className="text-xs text-gray-400 font-normal ml-0.5">min</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Award size={13} className="text-emerald-400" />
                <span className="text-[0.65rem] uppercase font-bold tracking-wider">Series</span>
              </div>
              <div
                className="text-base font-extrabold text-white font-mono"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {totalCompletedSets}
                <span className="text-xs text-gray-400 font-normal ml-0.5">sets</span>
              </div>
            </div>
          </div>

          {/* Optional PRs Highlight Card if athlete beat any records */}
          {totalPrsCount > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Zap size={14} />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-300">
                    {totalPrsCount}{' '}
                    {totalPrsCount === 1
                      ? 'Récord personal superado'
                      : 'Récords personales superados'}
                  </span>
                  <p className="text-[0.7rem] text-amber-200/70">
                    ¡Progreso verificado en tus levantamientos de hoy!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Exercises Breakdown Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Desglose por ejercicios ({completedExercisesList.length})
              </h3>
            </div>

            {completedExercisesList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-gray-500">
                No hay series marcadas como completadas en esta sesión.
              </div>
            ) : (
              <div className="space-y-2">
                {completedExercisesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-width-0 flex-1">
                      {item.gifUrl ? (
                        <img
                          src={item.gifUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-gray-400 flex-shrink-0">
                          <Dumbbell size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {item.name}
                          </span>
                          {item.hasPr && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[0.6rem] font-bold text-amber-300">
                              PR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[0.7rem] text-gray-400 mt-0.5">
                          <span>{item.completedSetsCount} series</span>
                          <span>•</span>
                          <span className="font-mono">{formatKg(item.volume)}</span>
                        </div>
                      </div>
                    </div>

                    {item.bestSet && (
                      <div className="text-right flex-shrink-0">
                        <span className="text-[0.65rem] text-gray-400 uppercase font-semibold block">
                          Mejor serie
                        </span>
                        <span className="text-xs font-extrabold text-white font-mono">
                          {item.bestSet.weight} kg × {item.bestSet.reps}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Notes Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="finish-workout-notes"
              className="text-[0.7rem] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5"
            >
              <FileText size={12} />
              <span>Notas de la sesión (opcional)</span>
            </label>
            <textarea
              id="finish-workout-notes"
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              disabled={isSaving}
              placeholder="¿Sensaciones, fatiga, material o notas de entrenamiento?..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-white/10 text-white text-xs placeholder:text-gray-500 focus:border-[var(--accent-primary)] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Error Banner */}
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
              {saveError}
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer (Thumb Zone) */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] bg-[#121214]/90 backdrop-blur-xl flex flex-col gap-2 flex-shrink-0 pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))]">
          {isInteractiveFinish ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[var(--accent-primary)]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Guardar</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Share2 size={14} />
                  <span>Compartir Resumen</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="py-2.5 px-4 rounded-xl text-gray-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Volver al entrenamiento
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  haptics.success();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-[var(--accent-primary)]/25 flex items-center justify-center gap-2 transition-all"
              >
                <Check size={18} />
                <span>Aceptar y Continuar</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 text-gray-300 font-medium text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Share2 size={14} />
                <span>Compartir logros</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
