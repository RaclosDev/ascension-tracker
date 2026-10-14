import React, { useEffect } from 'react';
import { Trophy, Clock, Dumbbell, Award, Share2, Check } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import type { CompletedWorkout } from '@/lib/workout/types';

interface Props {
  open: boolean;
  onClose: () => void;
  workout: CompletedWorkout | null;
}

export function WorkoutCelebrationModal({ open, onClose, workout }: Props) {
  useEffect(() => {
    if (open) {
      haptics.celebration();
    }
  }, [open]);

  if (!open || !workout) return null;

  // Calculate stats
  let totalVolumeKg = 0;
  let totalSets = 0;
  workout.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      if (s.completed) {
        totalSets++;
        const w = parseFloat(String(s.weight || '0').replace(',', '.'));
        const r = parseInt(String(s.reps || '0'), 10);
        if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
          totalVolumeKg += w * r;
        }
      }
    });
  });

  const durationMs =
    workout.finishedAt && workout.startedAt ? workout.finishedAt - workout.startedAt : 60000;
  const durationMin = Math.max(1, Math.round(durationMs / 60000));

  // Fun real-world volume equivalence
  const getVolumeEquivalence = (kg: number) => {
    if (kg >= 20000) return '🚀 ¡Equivale al peso de una nave espacial!';
    if (kg >= 10000) return '🐘 ¡Más de 2 elefantes africanos levantados!';
    if (kg >= 5000) return '🚗 ¡Más de 3 coches utilitarios completos!';
    if (kg >= 2500) return '🦏 ¡Más que el peso de un rinoceronte blanco!';
    if (kg >= 1000) return '🐎 ¡Más que un caballo de tiro de granja!';
    return '⚡ ¡Gran trabajo de fuerza y constancia!';
  };

  const handleShare = async () => {
    haptics.light();
    const shareText = `💪 ¡He completado "${workout.name}" en Ascension Tracker!\n📊 ${totalVolumeKg.toLocaleString()} kg levantados · ${totalSets} series · ${durationMin} min`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Ascension Tracker - Entrenamiento Completado',
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-white/10 p-6 text-center shadow-2xl overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(28, 28, 30, 0.98) 0%, rgba(18, 18, 20, 0.98) 100%)',
          backdropFilter: 'blur(30px)',
        }}
      >
        {/* Glow ambient background effect */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0, 133, 255, 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Celebration Trophy Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Trophy size={32} className="animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        <h3 id="celebration-title" className="text-xl font-black text-white tracking-tight">
          ¡Sesión Completada!
        </h3>
        <p className="text-xs text-[var(--accent-primary-light)] font-semibold mt-0.5 uppercase tracking-wider">
          {workout.name}
        </p>

        {/* Fun equivalence badge */}
        <div className="mt-3 py-1.5 px-3 rounded-full bg-white/5 border border-white/10 text-[0.72rem] text-gray-300 font-medium inline-block">
          {getVolumeEquivalence(totalVolumeKg)}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 text-left">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Dumbbell size={14} className="text-[var(--accent-primary)]" />
              <span className="text-[0.68rem] uppercase font-bold tracking-wider">Volumen</span>
            </div>
            <div
              className="text-base font-extrabold text-white font-mono"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {totalVolumeKg >= 1000 ? `${(totalVolumeKg / 1000).toFixed(1)}k` : totalVolumeKg}
              <span className="text-xs text-gray-400 font-normal ml-0.5">kg</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Clock size={14} className="text-cyan-400" />
              <span className="text-[0.68rem] uppercase font-bold tracking-wider">Tiempo</span>
            </div>
            <div
              className="text-base font-extrabold text-white font-mono"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {durationMin}
              <span className="text-xs text-gray-400 font-normal ml-0.5">min</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <Award size={14} className="text-emerald-400" />
              <span className="text-[0.68rem] uppercase font-bold tracking-wider">Series</span>
            </div>
            <div
              className="text-base font-extrabold text-white font-mono"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {totalSets}
              <span className="text-xs text-gray-400 font-normal ml-0.5">sets</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              haptics.success();
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-sm shadow-lg shadow-[var(--accent-primary)]/25 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            <Check size={18} />
            <span>Aceptar y Continuar</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium text-xs flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
          >
            <Share2 size={14} />
            <span>Compartir logros</span>
          </button>
        </div>
      </div>
    </div>
  );
}
