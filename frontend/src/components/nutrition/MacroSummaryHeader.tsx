import React from 'react';
import { Flame } from 'lucide-react';

interface MacroSummaryHeaderProps {
  consumed: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function MacroSummaryHeader({ consumed, macros }: MacroSummaryHeaderProps) {
  const caloriesConsumed = Math.round(Number(consumed?.kcal) || 0);
  const caloriesTarget = Math.round(Number(macros?.kcal) || 0);
  const caloriesRemaining = caloriesTarget > 0 ? caloriesTarget - caloriesConsumed : 0;
  const kcalPercent =
    caloriesTarget > 0 ? Math.min(100, Math.max(0, (caloriesConsumed / caloriesTarget) * 100)) : 0;

  const proteinConsumed = Math.round(Number(consumed?.protein) || 0);
  const proteinTarget = Math.round(Number(macros?.protein) || 0);
  const proteinPercent =
    proteinTarget > 0 ? Math.min(100, Math.max(0, (proteinConsumed / proteinTarget) * 100)) : 0;

  const carbsConsumed = Math.round(Number(consumed?.carbs) || 0);
  const carbsTarget = Math.round(Number(macros?.carbs) || 0);
  const carbsPercent =
    carbsTarget > 0 ? Math.min(100, Math.max(0, (carbsConsumed / carbsTarget) * 100)) : 0;

  const fatConsumed = Math.round(Number(consumed?.fat) || 0);
  const fatTarget = Math.round(Number(macros?.fat) || 0);
  const fatPercent =
    fatTarget > 0 ? Math.min(100, Math.max(0, (fatConsumed / fatTarget) * 100)) : 0;

  // SVG Ring calculation for Calories
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * kcalPercent) / 100;

  return (
    <div className="card nutrition-summary-card glass-panel-elevated p-4 sm:p-5 rounded-2xl mb-6 relative overflow-hidden">
      {/* Main Calories Header Row */}
      <div className="flex items-center gap-4 sm:gap-6 mb-4">
        {/* Animated Calorie Progress Ring */}
        <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
            <defs>
              <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary-light, #38bdf8)" />
                <stop offset="100%" stopColor="var(--accent-primary, #0284c7)" />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated progress stroke */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="url(#calorieGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </svg>

          {/* Center Content in Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Flame size={15} className="text-[var(--accent-primary-light)] mb-0.5" />
            <span className="text-base sm:text-lg font-black text-white tabular-nums leading-none tracking-tight">
              {caloriesTarget > 0
                ? caloriesRemaining >= 0
                  ? caloriesRemaining
                  : `+${Math.abs(caloriesRemaining)}`
                : caloriesConsumed}
            </span>
            <span className="text-[0.62rem] sm:text-[0.65rem] font-medium text-gray-400 leading-tight mt-0.5">
              {caloriesTarget > 0 ? (caloriesRemaining >= 0 ? 'kcal rest.' : 'kcal sobre') : 'kcal'}
            </span>
          </div>
        </div>

        {/* Calorie Stats Breakdown */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-300">Calorías totales</span>
            <span className="text-xs font-bold text-[var(--accent-primary-light)] tabular-nums">
              {Math.round(kcalPercent)}%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              {caloriesConsumed}
            </span>
            {caloriesTarget > 0 ? (
              <span className="text-xs sm:text-sm font-medium text-gray-400 tabular-nums">
                / {caloriesTarget} kcal
              </span>
            ) : (
              <span className="text-xs text-gray-500">kcal consumidas</span>
            )}
          </div>

          <p className="text-[0.72rem] text-gray-400 font-medium truncate">
            {caloriesTarget > 0
              ? caloriesRemaining >= 0
                ? `${caloriesRemaining} kcal para alcanzar el objetivo diario`
                : `${Math.abs(caloriesRemaining)} kcal por encima de la meta`
              : 'Configura tu objetivo en Ajustes'}
          </p>
        </div>
      </div>

      {/* 3 Macro Cards / Badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3.5 border-t border-white/[0.08]">
        <div className="flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-300 text-[0.72rem] sm:text-xs">Proteínas</span>
            <span className="text-[0.65rem] text-[var(--accent-primary-light)] font-bold tabular-nums">
              {Math.round(proteinPercent)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-bold text-white tabular-nums">
              {proteinConsumed}
            </span>
            <span className="text-[0.68rem] text-gray-400 tabular-nums">
              {proteinTarget > 0 ? `/${proteinTarget}g` : 'g'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary-light)] transition-all duration-700 ease-out"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-300 text-[0.72rem] sm:text-xs">Hidratos</span>
            <span className="text-[0.65rem] text-[var(--accent-primary)] font-bold tabular-nums">
              {Math.round(carbsPercent)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-bold text-white tabular-nums">
              {carbsConsumed}
            </span>
            <span className="text-[0.68rem] text-gray-400 tabular-nums">
              {carbsTarget > 0 ? `/${carbsTarget}g` : 'g'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-700 ease-out"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-300 text-[0.72rem] sm:text-xs">Grasas</span>
            <span className="text-[0.65rem] text-gray-400 font-bold tabular-nums">
              {Math.round(fatPercent)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm sm:text-base font-bold text-white tabular-nums">
              {fatConsumed}
            </span>
            <span className="text-[0.68rem] text-gray-400 tabular-nums">
              {fatTarget > 0 ? `/${fatTarget}g` : 'g'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary-dark)] transition-all duration-700 ease-out"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
