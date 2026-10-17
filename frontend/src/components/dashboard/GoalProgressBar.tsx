import React from 'react';
import { Target, Flag, Sparkles } from 'lucide-react';

interface GoalProgressBarProps {
  progress?: number | null;
  startWeight?: number | null;
  goalWeight?: number | null;
  currentWeight?: number | null;
}

export const GoalProgressBar = React.memo(function GoalProgressBar({
  progress,
  startWeight,
  goalWeight,
  currentWeight,
}: GoalProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(100, progress || 0));
  const numCurrent = currentWeight ?? 0;
  const numStart = startWeight ?? 0;
  const numGoal = goalWeight ?? 0;

  return (
    <div className="card glass-panel-elevated relative overflow-hidden rounded-2xl p-4 sm:p-5 mb-6 border border-white/[0.08]">
      {/* Ambient background glow */}
      <div
        className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-15 blur-2xl"
        style={{
          background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
        }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-primary-light, #38bdf8)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h3
              className="text-xs sm:text-sm font-bold uppercase tracking-wider block"
              style={{ color: 'var(--text-primary)' }}
            >
              Camino a la Meta
            </h3>
            <p className="text-[0.72rem] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Actualmente en{' '}
              <span className="text-white font-mono font-bold">{numCurrent.toFixed(1)} kg</span>
            </p>
          </div>
        </div>

        {/* Highlighted Percentage Pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm"
          style={{
            background: 'var(--accent-glow)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
          }}
        >
          <span
            className="text-base sm:text-lg font-black font-mono tabular-nums leading-none"
            style={{ color: 'var(--accent-primary-light, #38bdf8)' }}
          >
            {safeProgress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-4 bg-black/50 border border-white/[0.08] rounded-full p-0.5 overflow-hidden my-3">
        {/* Fill Bar */}
        <div
          className="h-full rounded-full relative transition-all duration-1000 ease-out flex items-center justify-end"
          style={{
            width: `${safeProgress}%`,
            background:
              'linear-gradient(90deg, var(--accent-primary), var(--accent-primary-light, #38bdf8))',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}
        >
          {/* Luminous Puck Head */}
          {safeProgress > 2 && (
            <div className="w-2.5 h-2.5 rounded-full bg-white mr-0.5 shadow-[0_0_8px_#ffffff] animate-pulse" />
          )}
        </div>
      </div>

      {/* Bottom Milestone Markers */}
      <div
        className="flex items-center justify-between text-[0.72rem] font-mono font-medium pt-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-1">
          <Flag size={12} className="opacity-70" />
          <span>
            Inicio: <strong className="text-gray-200">{numStart.toFixed(1)} kg</strong>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={12} style={{ color: 'var(--accent-primary-light, #38bdf8)' }} />
          <span>
            Objetivo: <strong className="text-white">{numGoal.toFixed(1)} kg</strong>
          </span>
        </div>
      </div>
    </div>
  );
});
