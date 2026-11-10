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

  // The .kpi-value/.kpi-detail classes stay as test hooks. The four figures share one sheet:
  // the current weight already lives in the weight card above, so it is not repeated here.
  const cell = 'kpi-card kpi-cell flex flex-col justify-between min-w-0';
  const label = 'kpi-label mb-1';
  const number = 'kpi-number tabular-nums';
  const unit = 'text-xs font-semibold text-[var(--text-secondary)]';

  return (
    <section
      aria-label="Resumen de tu progreso"
      className="card kpi-strip grid grid-cols-2 lg:grid-cols-4 mb-6"
    >
      <div className={cell}>
        <span className={label}>Media semanal</span>
        <div className="kpi-value flex items-baseline gap-1">
          <span className={number}>{numWeeklyAvg.toFixed(2)}</span> <span className={unit}>kg</span>
        </div>
        <div className="kpi-detail text-[0.72rem]" style={{ color: 'var(--text-secondary)' }}>
          Últimos 7 días
        </div>
      </div>

      <div className={cell}>
        <span className={label}>{isLoss ? 'Total perdido' : 'Total ganado'}</span>
        <div className="kpi-value flex items-baseline gap-1">
          <span className={number}>{numTotalLost.toFixed(2)}</span> <span className={unit}>kg</span>
          <span className="self-center" style={{ color: trendColor }}>
            {isLoss ? (
              <ArrowDownRight size={14} aria-label="bajando" />
            ) : (
              <ArrowUpRight size={14} aria-label="subiendo" />
            )}
          </span>
        </div>
        <div className="kpi-detail text-[0.72rem]" style={{ color: 'var(--text-secondary)' }}>
          Desde el inicio
        </div>
      </div>

      <div className={cell}>
        <span className={label}>Te falta</span>
        <div className="kpi-value flex items-baseline gap-1">
          <span className={number}>{numRemaining > 0 ? numRemaining.toFixed(1) : '0.0'}</span>{' '}
          <span className={unit}>kg</span>
        </div>
        <div className="kpi-detail text-[0.72rem]" style={{ color: 'var(--text-secondary)' }}>
          {numRemaining <= 0 ? '¡Meta alcanzada!' : 'por perder'}
        </div>
      </div>

      <div className={cell}>
        <span className={label}>Fecha estimada</span>
        <div className="kpi-value min-w-0">
          <span className="kpi-number kpi-number-date block truncate">
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
            className="flex items-center gap-1 min-h-11 text-[0.72rem] font-medium w-full text-left group"
            style={{ color: 'var(--text-secondary)' }}
            aria-expanded={popoverOpen}
          >
            <span>
              A ritmo de{' '}
              <span className="font-semibold tabular-nums whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                {numWeeklyRate.toFixed(2)} kg/sem
              </span>
              <span className="sr-only">, cambiar ritmo de proyección</span>
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
    </section>
  );
});
