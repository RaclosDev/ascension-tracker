import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Target,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  History,
  Crosshair,
  Pencil,
  Check,
} from 'lucide-react';
import { RatePreference, RateMode } from '../../hooks/useRatePreference';

interface ElevatedKpiGridProps {
  currentWeight?: number | null;
  weeklyAverage?: number | null;
  totalLost?: number | null;
  remaining?: number | null;
  estimatedDate?: string | null;
  avgWeeklyRate?: number | null;
  ratePref?: RatePreference;
  onRateChange?: (next: Partial<RatePreference>) => void;
  weeklyGoal?: number | null;
}

const MODE_OPTIONS: { mode: RateMode; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    mode: 'history',
    label: 'Historial real',
    icon: <History size={14} />,
    desc: 'Media calculada de todas tus semanas',
  },
  {
    mode: 'goal',
    label: 'Meta semanal',
    icon: <Crosshair size={14} />,
    desc: 'El ritmo que configuraste como objetivo',
  },
  {
    mode: 'custom',
    label: 'Personalizado',
    icon: <Pencil size={14} />,
    desc: 'Introduce el ritmo manualmente',
  },
];

export const ElevatedKpiGrid = React.memo(function ElevatedKpiGrid({
  currentWeight,
  weeklyAverage,
  totalLost,
  remaining,
  estimatedDate,
  avgWeeklyRate,
  ratePref,
  onRateChange,
  weeklyGoal,
}: ElevatedKpiGridProps) {
  const isLoss = (totalLost ?? 0) <= 0;
  const numCurrent = currentWeight ?? 0;
  const numWeeklyAvg = weeklyAverage ?? 0;
  const numTotalLost = Math.abs(totalLost ?? 0);
  const numRemaining = remaining ?? 0;
  const numWeeklyRate = Math.abs(avgWeeklyRate ?? 0);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [customInput, setCustomInput] = useState(ratePref?.customRate?.toFixed(2) ?? '0.50');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ratePref?.customRate != null) {
      setCustomInput(ratePref.customRate.toFixed(2));
    }
  }, [ratePref?.customRate]);

  // Close popover on outside click or scroll
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    const closeOnScrollOrResize = () => setPopoverOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', closeOnScrollOrResize, { passive: true });
    window.addEventListener('resize', closeOnScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', closeOnScrollOrResize);
      window.removeEventListener('resize', closeOnScrollOrResize);
    };
  }, [popoverOpen]);

  const handleModeSelect = (mode: RateMode) => {
    if (mode !== 'custom') {
      onRateChange?.({ mode });
      setPopoverOpen(false);
    } else {
      onRateChange?.({ mode });
      // stay open for custom input
    }
  };

  const handleCustomSave = () => {
    const val = parseFloat(customInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      onRateChange?.({ mode: 'custom', customRate: val });
      setPopoverOpen(false);
    }
  };

  const currentMode = ratePref?.mode ?? 'history';

  return (
    <div className="kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
      {/* 1. Peso Actual */}
      <div className="card kpi-card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="kpi-label text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Peso Actual
          </span>
          <div
            className="p-1.5 rounded-lg border"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--accent-primary)',
            }}
          >
            <Scale size={15} />
          </div>
        </div>
        <div className="my-1">
          <div className="kpi-value flex items-baseline gap-1 text-xl sm:text-2xl font-black text-white font-mono tracking-tight tabular-nums">
            {numCurrent.toFixed(2)} kg
          </div>
        </div>
        <div
          className="kpi-detail text-[0.68rem] font-medium truncate pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Media semanal:{' '}
          <span className="font-mono text-gray-200 font-semibold">
            {numWeeklyAvg.toFixed(2)} kg
          </span>
        </div>
      </div>

      {/* 2. Total Perdido / Ganado */}
      <div className="card kpi-card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="kpi-label text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Total Perdido
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
          <div
            className="kpi-value flex items-baseline gap-1 text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums"
            style={{ color: isLoss ? 'var(--color-success, #34d399)' : '#f43f5e' }}
          >
            {numTotalLost.toFixed(2)} kg
          </div>
        </div>
        <div className="kpi-detail pt-1 border-t border-white/[0.04]">
          <span
            className="inline-flex items-center gap-0.5 text-[0.68rem] font-semibold"
            style={{ color: isLoss ? 'var(--color-success, #34d399)' : '#f43f5e' }}
          >
            {isLoss ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {numTotalLost.toFixed(1)} kg {isLoss ? 'perdidos' : 'ganados'}
          </span>
        </div>
      </div>

      {/* 3. Te Falta */}
      <div className="card kpi-card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="kpi-label text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
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
          <div className="kpi-value flex items-baseline gap-1 text-xl sm:text-2xl font-black text-white font-mono tracking-tight tabular-nums">
            {numRemaining > 0 ? numRemaining.toFixed(1) : '0.0'} kg
          </div>
        </div>
        <div
          className="kpi-detail text-[0.68rem] font-medium truncate pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {numRemaining <= 0 ? '¡Meta alcanzada!' : 'por perder'}
        </div>
      </div>

      {/* 4. Fecha Estimada */}
      <div className="card kpi-card glass-panel-elevated relative rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span
            className="kpi-label text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Fecha Estimada
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
          <span className="kpi-value text-base sm:text-lg font-black text-white font-mono tracking-tight block truncate">
            {estimatedDate || 'En cálculo'}
          </span>
        </div>

        {/* Clickable rate trigger */}
        <div className="kpi-detail relative pt-1 border-t border-white/[0.04]">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              if (!popoverOpen && triggerRef.current) {
                setAnchorRect(triggerRef.current.getBoundingClientRect());
              }
              setPopoverOpen((o) => !o);
            }}
            className="flex items-center gap-1 text-[0.68rem] font-medium hover:opacity-100 opacity-70 transition-opacity w-full text-left group"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Cambiar ritmo de proyección"
          >
            <span>
              A ritmo de{' '}
              <span className="font-mono font-semibold text-gray-200">
                {numWeeklyRate.toFixed(2)} kg/sem
              </span>
            </span>
            <ChevronDown
              size={11}
              className={`ml-auto transition-transform duration-200 ${popoverOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Popover — rendered in body via portal to escape any overflow:hidden parent */}
          {popoverOpen &&
            anchorRect &&
            createPortal(
              <div
                ref={popoverRef}
                className="rounded-2xl border p-3.5 w-72 max-w-[calc(100vw-24px)] select-none"
                style={{
                  position: 'fixed',
                  top: anchorRect.top < 260 ? anchorRect.bottom + 8 : 'auto',
                  bottom:
                    anchorRect.top < 260
                      ? 'auto'
                      : Math.max(12, window.innerHeight - anchorRect.top + 8),
                  right: Math.max(12, window.innerWidth - anchorRect.right),
                  zIndex: 9999,
                  background: 'var(--bg-card, #1C1C1E)',
                  borderColor: 'var(--border-medium, rgba(255,255,255,0.15))',
                  boxShadow: 'var(--shadow-lg, 0 12px 36px rgba(0,0,0,0.65))',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <p
                  className="text-[0.68rem] font-bold uppercase tracking-wider mb-2.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Ritmo de proyección
                </p>

                <div className="flex flex-col gap-1.5">
                  {MODE_OPTIONS.map(({ mode, label, icon, desc }) => {
                    const active = currentMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleModeSelect(mode)}
                        className="flex items-start gap-2.5 w-full rounded-xl px-2.5 py-2 text-left transition-all"
                        style={{
                          background: active
                            ? 'var(--accent-glow)'
                            : 'var(--bg-glass, rgba(255, 255, 255, 0.02))',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderColor: active
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle, rgba(255,255,255,0.06))',
                        }}
                      >
                        <span
                          className="mt-0.5 shrink-0"
                          style={{
                            color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {icon}
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span
                            className="text-[0.75rem] font-semibold"
                            style={{ color: active ? 'white' : 'var(--text-primary)' }}
                          >
                            {label}
                            {mode === 'goal' && weeklyGoal != null && (
                              <span className="ml-1 font-mono opacity-60">
                                ({weeklyGoal.toFixed(2)} kg/sem)
                              </span>
                            )}
                          </span>
                          <span
                            className="text-[0.65rem]"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {desc}
                          </span>
                        </span>
                        {active && (
                          <Check
                            size={14}
                            className="ml-auto mt-0.5 shrink-0"
                            style={{ color: 'var(--accent-primary)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom rate input */}
                {currentMode === 'custom' && (
                  <div
                    className="mt-3 pt-2.5 border-t flex flex-col gap-1.5"
                    style={{ borderColor: 'var(--border-subtle, rgba(255,255,255,0.08))' }}
                  >
                    <span
                      className="text-[0.68rem] font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Ritmo personalizado
                    </span>
                    <div className="flex gap-2 items-center w-full">
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCustomSave()}
                          className="w-full min-w-0 rounded-lg pl-3 pr-14 py-2 text-sm font-mono font-semibold text-[var(--text-primary)] border outline-none transition-all focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                          style={{
                            background: 'var(--bg-input, #2C2C2E)',
                            borderColor: 'var(--border-medium, rgba(255,255,255,0.15))',
                          }}
                          placeholder="0.50"
                          autoFocus
                        />
                        <span
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.68rem] font-medium pointer-events-none select-none"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          kg/sem
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCustomSave}
                        className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-sm"
                        style={{
                          background: 'var(--gradient-primary, var(--accent-primary))',
                          boxShadow: '0 0 12px var(--accent-glow)',
                        }}
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}
              </div>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
});
