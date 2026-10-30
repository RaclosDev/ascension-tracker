import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
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

  // Close popover on outside click or scroll (ignoring resize when typing in inputs)
  useEffect(() => {
    if (!popoverOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    const closeOnScroll = () => {
      if (popoverRef.current?.contains(document.activeElement)) return;
      setPopoverOpen(false);
    };
    const closeOnResize = () => {
      if (popoverRef.current?.contains(document.activeElement)) return;
      setPopoverOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('resize', closeOnResize);
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
  const trendColor = isLoss ? 'var(--color-success, #34d399)' : '#f43f5e';

  // The .kpi-value/.kpi-detail classes stay as test hooks; the global .kpi-value font-size
  // would override Tailwind on that element, so the number sizes live on the inner spans.
  const secondaryLabel = 'text-xs font-medium mb-1.5';
  const secondaryNumber = 'text-lg sm:text-xl font-bold leading-tight text-white tabular-nums';
  const unit = 'text-xs font-semibold text-[var(--text-secondary)]';

  return (
    <div className="kpi-grid grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
      {/* Current weight is checked daily, so it is the focal card; the other three defer to it. */}
      <div className="card kpi-card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <span className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Peso actual
        </span>
        <div className="kpi-value flex items-baseline gap-1 my-1">
          <span className="text-[2rem] sm:text-[2.5rem] font-extrabold leading-none tracking-tight text-white tabular-nums">
            {numCurrent.toFixed(2)}
          </span>{' '}
          <span className="text-sm font-semibold text-[var(--text-secondary)]">kg</span>
        </div>
        <div
          className="kpi-detail text-[0.68rem] font-medium pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Media semanal:{' '}
          <span className="text-gray-200 font-semibold tabular-nums whitespace-nowrap">
            {numWeeklyAvg.toFixed(2)} kg
          </span>
        </div>
      </div>

      <div className="card kpi-card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <span className={secondaryLabel} style={{ color: 'var(--text-secondary)' }}>
          {isLoss ? 'Total perdido' : 'Total ganado'}
        </span>
        <div className="kpi-value flex items-baseline gap-1 my-1">
          <span className={secondaryNumber}>{numTotalLost.toFixed(2)}</span>{' '}
          <span className={unit}>kg</span>
        </div>
        <div className="kpi-detail pt-1 border-t border-white/[0.04]">
          <span
            className="inline-flex items-center gap-0.5 text-[0.68rem] font-semibold tabular-nums"
            style={{ color: trendColor }}
          >
            {isLoss ? (
              <ArrowDownRight size={12} aria-hidden />
            ) : (
              <ArrowUpRight size={12} aria-hidden />
            )}
            {numTotalLost.toFixed(1)} kg {isLoss ? 'perdidos' : 'ganados'}
          </span>
        </div>
      </div>

      <div className="card kpi-card glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <span className={secondaryLabel} style={{ color: 'var(--text-secondary)' }}>
          Te falta
        </span>
        <div className="kpi-value flex items-baseline gap-1 my-1">
          <span className={secondaryNumber}>
            {numRemaining > 0 ? numRemaining.toFixed(1) : '0.0'}
          </span>{' '}
          <span className={unit}>kg</span>
        </div>
        <div
          className="kpi-detail text-[0.68rem] font-medium truncate pt-1 border-t border-white/[0.04]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {numRemaining <= 0 ? '¡Meta alcanzada!' : 'por perder'}
        </div>
      </div>

      <div className="card kpi-card glass-panel-elevated relative rounded-2xl p-3.5 sm:p-4 border border-white/[0.08] flex flex-col justify-between">
        <span className={secondaryLabel} style={{ color: 'var(--text-secondary)' }}>
          Fecha estimada
        </span>
        <div className="kpi-value my-1 min-w-0">
          <span className="block truncate text-lg sm:text-xl font-bold leading-tight text-white">
            {estimatedDate || 'En cálculo'}
          </span>
        </div>

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
              <span className="font-semibold text-gray-200 tabular-nums whitespace-nowrap">
                {numWeeklyRate.toFixed(2)} kg/sem
              </span>
            </span>
            <ChevronDown
              size={11}
              className={`ml-auto transition-transform duration-200 ${popoverOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Popover: rendered in body via portal to escape any overflow:hidden parent */}
          {popoverOpen &&
            anchorRect &&
            (() => {
              const popoverWidth = Math.min(
                320,
                typeof window !== 'undefined' ? window.innerWidth - 24 : 296,
              );
              const preferredLeft = anchorRect.right - popoverWidth;
              const safeLeft = Math.max(
                12,
                Math.min(
                  preferredLeft,
                  (typeof window !== 'undefined' ? window.innerWidth : 360) - popoverWidth - 12,
                ),
              );
              const spaceBelow =
                typeof window !== 'undefined' ? window.innerHeight - anchorRect.bottom : 300;
              const placeAbove = spaceBelow < 280 && anchorRect.top > 280;

              return createPortal(
                <div
                  ref={popoverRef}
                  className="rounded-2xl border p-4 select-none"
                  style={{
                    position: 'fixed',
                    width: `${popoverWidth}px`,
                    left: `${safeLeft}px`,
                    top: placeAbove ? 'auto' : `${anchorRect.bottom + 8}px`,
                    bottom: placeAbove
                      ? `${Math.max(12, window.innerHeight - anchorRect.top + 8)}px`
                      : 'auto',
                    maxHeight: 'calc(100vh - 24px)',
                    overflowY: 'auto',
                    zIndex: 9999,
                    background: 'var(--bg-card, #1C1C1E)',
                    borderColor: 'var(--border-medium, rgba(255,255,255,0.15))',
                    boxShadow: 'var(--shadow-lg, 0 12px 36px rgba(0,0,0,0.65))',
                  }}
                >
                  <p
                    className="text-xs font-semibold mb-2.5"
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
                                <span className="ml-1 opacity-60 tabular-nums">
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
                      className="mt-3 pt-3 border-t flex flex-col gap-2"
                      style={{ borderColor: 'var(--border-subtle, rgba(255,255,255,0.08))' }}
                    >
                      <span
                        className="text-[0.68rem] font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Introduce el ritmo manualmente
                      </span>
                      <div className="flex gap-2 items-center w-full">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomSave()}
                            className="w-full min-w-0 rounded-lg pl-3 pr-16 py-2 text-sm font-semibold tabular-nums text-[var(--text-primary)] border outline-none transition-all focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                            style={{
                              background: 'var(--bg-input, #2C2C2E)',
                              borderColor: 'var(--border-medium, rgba(255,255,255,0.15))',
                            }}
                            placeholder="0.50"
                            autoFocus
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.68rem] font-medium pointer-events-none select-none text-[var(--text-muted)]">
                            kg/sem
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCustomSave}
                          className="btn btn-primary shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
                          style={{
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>,
                document.body,
              );
            })()}
        </div>
      </div>
    </div>
  );
});
