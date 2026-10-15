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

  return (
    <div className="card nutrition-summary-card p-4 sm:p-5 rounded-2xl mb-6 bg-white/[0.04] border border-white/10 backdrop-blur-xl">
      <div className="nutrition-summary-main mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center">
              <Flame size={16} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Calorías
              </span>
              <p className="text-[0.7rem] text-gray-500 font-medium">
                {caloriesTarget > 0
                  ? caloriesRemaining >= 0
                    ? `${caloriesRemaining} kcal restantes`
                    : `${Math.abs(caloriesRemaining)} kcal sobre el objetivo`
                  : 'Objetivo calórico no fijado'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="text-lg sm:text-xl font-extrabold text-white font-mono"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {caloriesConsumed}{' '}
              {caloriesTarget > 0 && (
                <span className="text-xs font-normal text-gray-400">/ {caloriesTarget} kcal</span>
              )}
            </span>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
            style={{ width: `${kcalPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-3 border-t border-white/[0.08]">
        {/* Protein */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
            <span className="font-semibold text-gray-300 text-[0.75rem] sm:text-xs">Proteínas</span>
            <span className="text-gray-400 font-mono text-[0.72rem] sm:text-xs tabular-nums">
              {proteinConsumed}
              <span className="text-gray-500 text-[0.65rem] sm:text-[0.7rem]">
                {proteinTarget > 0 ? `/${proteinTarget}g` : 'g'}
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary-light)] transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
            <span className="font-semibold text-gray-300 text-[0.75rem] sm:text-xs">Hidratos</span>
            <span className="text-gray-400 font-mono text-[0.72rem] sm:text-xs tabular-nums">
              {carbsConsumed}
              <span className="text-gray-500 text-[0.65rem] sm:text-[0.7rem]">
                {carbsTarget > 0 ? `/${carbsTarget}g` : 'g'}
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Fat */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
            <span className="font-semibold text-gray-300 text-[0.75rem] sm:text-xs">Grasas</span>
            <span className="text-gray-400 font-mono text-[0.72rem] sm:text-xs tabular-nums">
              {fatConsumed}
              <span className="text-gray-500 text-[0.65rem] sm:text-[0.7rem]">
                {fatTarget > 0 ? `/${fatTarget}g` : 'g'}
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent-primary-dark)] transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
