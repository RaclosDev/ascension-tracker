import React from 'react';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

interface ElevatedKpiGridProps {
  currentWeight?: number | null;
  weeklyAverage?: number | null;
  totalLost?: number | null;
  remaining?: number | null;
  estimatedDate?: string | null;
  avgWeeklyRate?: number | null;
}

export const ElevatedKpiGrid = React.memo(function ElevatedKpiGrid({
  currentWeight,
  weeklyAverage,
  totalLost,
  remaining,
  estimatedDate,
  avgWeeklyRate,
}: ElevatedKpiGridProps) {
  const isLoss = (totalLost ?? 0) <= 0;
  const numCurrent = currentWeight ?? 0;
  const numWeeklyAvg = weeklyAverage ?? 0;
  const numTotalLost = Math.abs(totalLost ?? 0);
  const numRemaining = remaining ?? 0;
  const numWeeklyRate = Math.abs(avgWeeklyRate ?? 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
      {/* 1. Peso Actual */}
      <div className="card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Peso Actual
          </span>
          <div
            className="p-1.5 rounded-lg border"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-primary-light, #38bdf8)',
            }}
          >
            <Scale size={15} />
          </div>
        </div>
        <div className="my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {numCurrent.toFixed(2)}
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: 'var(--text-secondary)' }}
            >
              kg
            </span>
          </div>
        </div>
        <div
          className="text-[0.68rem] font-medium truncate pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Media:{' '}
          <span className="font-mono text-gray-200 font-semibold">
            {numWeeklyAvg.toFixed(2)} kg
          </span>
        </div>
      </div>

      {/* 2. Total Perdido / Ganado */}
      <div className="card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Total {isLoss ? 'Perdido' : 'Ganado'}
          </span>
          <div
            className="p-1.5 rounded-lg border"
            style={{
              background: isLoss ? 'rgba(52, 211, 153, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: isLoss ? 'var(--color-success, #34d399)' : '#f43f5e',
            }}
          >
            {isLoss ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
          </div>
        </div>
        <div className="my-1">
          <div className="flex items-baseline gap-1">
            <span
              className="text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums"
              style={{ color: isLoss ? 'var(--color-success, #34d399)' : '#f43f5e' }}
            >
              {numTotalLost.toFixed(2)}
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: 'var(--text-secondary)' }}
            >
              kg
            </span>
          </div>
        </div>
        <div className="pt-1 border-t border-white/[0.04]">
          <span
            className="inline-flex items-center gap-0.5 text-[0.68rem] font-semibold"
            style={{ color: isLoss ? 'var(--color-success, #34d399)' : '#f43f5e' }}
          >
            {isLoss ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {numTotalLost.toFixed(1)} kg desde el inicio
          </span>
        </div>
      </div>

      {/* 3. Te Falta */}
      <div className="card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Te Falta
          </span>
          <div
            className="p-1.5 rounded-lg border"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-primary)',
            }}
          >
            <Target size={15} />
          </div>
        </div>
        <div className="my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {numRemaining > 0 ? numRemaining.toFixed(1) : '0.0'}
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: 'var(--text-secondary)' }}
            >
              kg
            </span>
          </div>
        </div>
        <div
          className="text-[0.68rem] font-medium truncate pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {numRemaining <= 0 ? '¡Meta alcanzada! 🎉' : 'Hasta peso objetivo'}
        </div>
      </div>

      {/* 4. Fecha Estimada */}
      <div className="card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Fecha Meta
          </span>
          <div
            className="p-1.5 rounded-lg border"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: '#fbbf24',
            }}
          >
            <Calendar size={15} />
          </div>
        </div>
        <div className="my-1">
          <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight block truncate">
            {estimatedDate || 'En cálculo'}
          </span>
        </div>
        <div
          className="text-[0.68rem] font-medium truncate pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Ritmo:{' '}
          <span className="font-mono text-gray-200 font-semibold">
            {numWeeklyRate.toFixed(2)} kg/sem
          </span>
        </div>
      </div>
    </div>
  );
});
