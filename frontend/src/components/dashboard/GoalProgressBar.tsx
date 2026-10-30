import React from 'react';
import { Target, Flag, Trophy } from 'lucide-react';

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
  const numCurrent = currentWeight ?? 0;
  const numStart = startWeight ?? 0;
  const numGoal = goalWeight ?? 0;
  const isGainGoal = numGoal > numStart && numStart > 0;

  const calculatedProgress = React.useMemo(() => {
    if (isGainGoal && numStart > 0 && numGoal > numStart && numCurrent > 0) {
      const gained = numCurrent - numStart;
      const total = numGoal - numStart;
      return total > 0 ? (gained / total) * 100 : 0;
    }
    if (progress !== undefined && progress !== null) {
      return progress;
    }
    if (numStart > 0 && numGoal > 0 && numStart !== numGoal && numCurrent > 0) {
      const lost = numStart - numCurrent;
      const total = numStart - numGoal;
      return total > 0 ? (lost / total) * 100 : 0;
    }
    return 0;
  }, [progress, isGainGoal, numStart, numGoal, numCurrent]);

  const safeProgress = Math.max(0, Math.min(100, calculatedProgress));

  return (
    <div className="card progress-card glass-panel-elevated relative overflow-hidden rounded-2xl p-4 sm:p-5 mb-6 border border-white/[0.08]">
      {/* Header Info */}
      <div className="progress-info flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-primary-light, #38bdf8)',
            }}
          >
            <Trophy size={16} />
          </div>
          <div>
            <span
              className="progress-label text-xs sm:text-sm font-semibold block"
              style={{ color: 'var(--text-primary)' }}
            >
              {isGainGoal ? 'Meta de ganancia' : 'Progreso hacia tu meta'}
            </span>
            <p className="text-[0.72rem] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Actualmente en{' '}
              <span className="text-white font-bold tabular-nums">{numCurrent.toFixed(1)} kg</span>
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
            className="progress-pct text-base sm:text-lg font-black tabular-nums leading-none"
            style={{ color: 'var(--accent-primary-light, #38bdf8)' }}
          >
            {safeProgress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="progress-bar-container relative w-full h-4 bg-black/50 border border-white/[0.08] rounded-full p-0.5 overflow-hidden my-3">
        {/* Fill Bar */}
        <div
          className="progress-bar-fill h-full rounded-full relative transition-all duration-1000 ease-out flex items-center justify-end"
          style={{
            width: `${safeProgress}%`,
            background:
              'linear-gradient(90deg, var(--accent-primary), var(--accent-primary-light, #38bdf8))',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}
        >
          {/* Puck Head */}
          {safeProgress > 2 && <div className="w-2 h-2 rounded-full bg-white/90 mr-0.5" />}
        </div>
      </div>

      {/* Bottom Milestone Markers */}
      <div
        className="progress-markers flex items-center justify-between text-[0.72rem] font-medium tabular-nums pt-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        <div className="flex items-center gap-1">
          <Flag size={12} className="opacity-70" />
          <span>{numStart.toFixed(1)} kg</span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={12} style={{ color: 'var(--accent-primary-light, #38bdf8)' }} />
          <span>{numGoal.toFixed(1)} kg</span>
        </div>
      </div>
    </div>
  );
});
