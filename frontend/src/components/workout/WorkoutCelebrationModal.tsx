import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Clock,
  Dumbbell,
  Share2,
  Check,
  X,
  Zap,
  Layers,
  Loader2,
  FileText,
  Calendar,
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
  onSave?: (
    name: string,
    durationMin: number,
    notes?: string,
    startedAtMs?: number,
  ) => Promise<void> | void;
  isSaving?: boolean;
  saveError?: string | null;
  // Mode 2: Viewing a previously completed record
  workout?: CompletedWorkout | null;
}

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

function formatWorkoutDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
  const [customDateTime, setCustomDateTime] = useState('');

  useEffect(() => {
    if (open && currentWorkout) {
      setCustomName(currentWorkout.name?.trim() || 'Entrenamiento');
      setCustomDuration(initialDurationMin);
      setCustomNotes(currentWorkout.notes || '');
      const initialStartedAt =
        'startedAt' in currentWorkout && currentWorkout.startedAt
          ? currentWorkout.startedAt
          : Date.now();
      setCustomDateTime(toLocalDatetimeString(initialStartedAt));
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
    const shareText = `¡He completado "${workoutTitle}" en Ascension Tracker!\n${formatKg(totalVolumeKg)} levantados • ${totalCompletedSets} series • ${customDuration} min\n${exercisesNames}`;

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
      const selectedStartedAt = fromLocalDatetimeString(customDateTime);
      onSave(customName, customDuration, customNotes, selectedStartedAt);
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
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-none sm:rounded-3xl border-0 sm:border border-white/10 flex flex-col shadow-2xl overflow-hidden bg-[#0D0D10]">
        {/* Modal Top Navigation Bar */}
        <div className="relative flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-3.5 border-b border-white/[0.08] flex-shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary-light)] shadow-sm">
              <Trophy size={16} />
            </div>
            <div>
              <h2
                id="finish-dialog-title"
                className="text-base font-bold text-white tracking-tight leading-tight"
              >
                Finalizar Sesión
              </h2>
              <p className="text-[0.7rem] text-zinc-400 capitalize">{dateLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            aria-label="Cerrar resumen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 overscroll-contain">
          {/* Workout Name Field */}
          <div>
            <label
              htmlFor="finish-workout-name"
              className="block mb-1.5 text-xs font-semibold text-zinc-300"
            >
              Nombre del entrenamiento
            </label>
            <input
              id="finish-workout-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={isSaving}
              placeholder="Nombre del entrenamiento"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 text-white text-sm font-semibold focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
            />
          </div>

          {/* Workout Date & Time Field */}
          <div>
            <label
              htmlFor="finish-workout-date"
              className="block mb-1.5 text-xs font-semibold text-zinc-300"
            >
              Fecha y hora del entrenamiento
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 focus-within:border-[var(--accent-primary)] focus-within:ring-1 focus-within:ring-[var(--accent-primary)] transition-all">
              <Calendar size={15} className="text-[var(--accent-primary-light)] shrink-0" />
              <input
                id="finish-workout-date"
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                disabled={isSaving}
                className="w-full bg-transparent text-white font-medium focus:outline-none text-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Duration & Exercise Count Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="finish-workout-duration"
                className="block mb-1.5 text-xs font-semibold text-zinc-300"
              >
                Duración (min)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 focus-within:border-[var(--accent-primary)] focus-within:ring-1 focus-within:ring-[var(--accent-primary)] transition-all">
                <Clock size={15} className="text-[var(--accent-primary-light)] shrink-0" />
                <input
                  id="finish-workout-duration"
                  type="number"
                  min="1"
                  value={customDuration}
                  onChange={(e) =>
                    setCustomDuration(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  disabled={isSaving}
                  className="w-full bg-transparent text-white font-mono font-semibold focus:outline-none tabular-nums text-sm"
                />
                <span className="text-zinc-500 text-xs">min</span>
              </div>
            </div>

            <div>
              <span className="block mb-1.5 text-xs font-semibold text-zinc-300">Ejercicios</span>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 text-white text-sm font-semibold">
                <Layers size={15} className="text-zinc-400 shrink-0" />
                <span className="font-mono">{completedExercisesList.length}</span>
                <span className="text-zinc-500 text-xs font-normal">
                  {completedExercisesList.length === 1 ? 'ejercicio' : 'ejercicios'}
                </span>
              </div>
            </div>
          </div>

          {/* Core Metric Cards (Volumen, Tiempo, Series) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-zinc-400 mb-1">Volumen</span>
              <span className="text-sm sm:text-base font-extrabold text-white font-mono tabular-nums">
                {formatKg(totalVolumeKg)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-zinc-400 mb-1">Tiempo</span>
              <span className="text-sm sm:text-base font-extrabold text-white font-mono tabular-nums">
                {formatWorkoutDuration(customDuration)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-zinc-400 mb-1">Series</span>
              <span className="text-sm sm:text-base font-extrabold text-white font-mono tabular-nums">
                {totalCompletedSets} {totalCompletedSets === 1 ? 'serie' : 'series'}
              </span>
            </div>
          </div>

          {/* Optional PRs Highlight Card */}
          {totalPrsCount > 0 && (
            <div className="p-3.5 rounded-xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary-light)] shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--accent-primary-light)] block">
                  ¡{totalPrsCount}{' '}
                  {totalPrsCount === 1 ? 'nuevo récord personal' : 'nuevos récords personales'}!
                </span>
                <p className="text-[0.7rem] text-zinc-300">
                  Has superado marcas históricas en esta sesión.
                </p>
              </div>
            </div>
          )}

          {/* Exercises Breakdown Section */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-zinc-300">
              Desglose por ejercicios ({completedExercisesList.length})
            </label>

            {completedExercisesList.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 text-center text-xs text-zinc-500">
                No hay series marcadas como completadas en esta sesión.
              </div>
            ) : (
              <div className="space-y-2">
                {completedExercisesList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {item.gifUrl ? (
                        <img
                          src={item.gifUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                          <Dumbbell size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                            {item.name}
                          </span>
                          {item.hasPr && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30 text-[0.6rem] font-bold text-[var(--accent-primary-light)]">
                              PR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[0.7rem] text-zinc-400 mt-0.5">
                          <span>
                            {item.completedSetsCount}{' '}
                            {item.completedSetsCount === 1 ? 'serie' : 'series'}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{formatKg(item.volume)}</span>
                        </div>
                      </div>
                    </div>

                    {item.bestSet && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-white/10 text-right shrink-0">
                        <span className="text-[10px] text-zinc-400 font-medium block">
                          Mejor serie
                        </span>
                        <span className="text-xs font-bold text-white font-mono tabular-nums">
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
          <div>
            <label
              htmlFor="finish-workout-notes"
              className="block mb-1.5 text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-[var(--accent-primary)] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Error Banner */}
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
              {saveError}
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-zinc-950 flex flex-col gap-2.5 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {isInteractiveFinish ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 active:scale-[0.98] font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={isSaving}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/10 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Share2 size={14} />
                  <span>Compartir</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/10 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <X size={14} />
                  <span>Volver</span>
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
                className="w-full py-3 rounded-xl bg-[var(--accent-primary)] hover:brightness-110 active:scale-[0.98] font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Check size={18} />
                <span>Aceptar y Continuar</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-white/10 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
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
