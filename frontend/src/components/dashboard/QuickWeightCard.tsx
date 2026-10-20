import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Scale,
  Calendar,
  Check,
  Loader2,
  Pencil,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import api from '../../api/client';
import { haptics } from '../../lib/haptics';
import { parseSafeWeight } from '../../utils/weightHelper';

interface QuickWeightCardProps {
  todayLabel: string;
  todayDateStr: string;
  todayWeight?: number;
  recentWeight?: number;
  yesterdayWeight?: number;
  hasTodayWeight: boolean;
}

const STEPPER_DELTAS = [-0.1, -0.05, +0.05, +0.1] as const;

export const QuickWeightCard = React.memo(function QuickWeightCard({
  todayLabel,
  todayDateStr,
  todayWeight,
  recentWeight,
  yesterdayWeight,
  hasTodayWeight,
}: QuickWeightCardProps) {
  const queryClient = useQueryClient();
  const [quickWeight, setQuickWeight] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const undoToastIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show the card as read-only when already registered and not actively editing
  const isReadOnly = hasTodayWeight && !isEditing;

  // Initialize display value only once (or when todayWeight changes from outside)
  useEffect(() => {
    if (todayWeight !== undefined) {
      setQuickWeight(todayWeight.toFixed(2));
    } else if (recentWeight !== undefined && quickWeight === '') {
      setQuickWeight(recentWeight.toFixed(2));
    }
  }, [todayWeight, recentWeight, quickWeight]);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['weights'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
  }, [queryClient]);

  const addWeightMutation = useMutation({
    mutationFn: (val: number) => api.post('/weights', { date: todayDateStr, weight: val }),
    onSuccess: (_, val) => {
      haptics.success();
      setJustSaved(true);
      setIsEditing(false);
      setTimeout(() => setJustSaved(false), 2200);

      // Undo toast: dismiss previous if still pending
      if (undoToastIdRef.current) toast.dismiss(undoToastIdRef.current);

      const toastId = toast.success(
        (t) => (
          <span className="flex items-center gap-3">
            <span>
              {hasTodayWeight ? `Peso actualizado: ${val} kg` : `Peso registrado: ${val} kg`}
            </span>
            <button
              className="text-xs font-bold underline opacity-80 hover:opacity-100"
              onClick={() => {
                toast.dismiss(t.id);
                // Restore input to previous value and re-open edit mode
                const prev = yesterdayWeight ?? recentWeight;
                if (prev !== undefined) setQuickWeight(prev.toFixed(2));
                setIsEditing(true);
              }}
            >
              Deshacer
            </button>
          </span>
        ),
        { duration: 5000 },
      );
      undoToastIdRef.current = toastId;

      invalidateQueries();
    },
    onError: (err: unknown) => {
      haptics.error();
      const e = err as Error & { response?: { data?: { message?: string; error?: string } } };
      const msg = e.response?.data?.message || e.response?.data?.error || e.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al registrar peso');
    },
  });

  const saveWeight = useCallback(
    (valueStr?: string) => {
      const val = parseSafeWeight(valueStr ?? quickWeight);
      if (val === null) {
        haptics.error();
        toast.error('Introduce un peso válido en kg (ej: 80.5)');
        return;
      }
      haptics.medium();
      inputRef.current?.blur();
      addWeightMutation.mutate(val);
    },
    [quickWeight, addWeightMutation],
  );

  const adjustWeight = (delta: number) => {
    haptics.step();
    const currentNum = parseSafeWeight(quickWeight) ?? recentWeight ?? 70.0;
    const nextVal = Math.round((currentNum + delta) * 100) / 100;
    const clamped = Math.max(30, Math.min(250, nextVal));
    setQuickWeight(clamped.toFixed(2));
  };

  const isPending = addWeightMutation.isPending;

  // Delta vs yesterday
  const deltaVsYesterday =
    yesterdayWeight !== undefined && parseSafeWeight(quickWeight) !== null
      ? Math.round((parseSafeWeight(quickWeight)! - yesterdayWeight) * 100) / 100
      : null;

  const DeltaIcon =
    deltaVsYesterday === null
      ? null
      : deltaVsYesterday < 0
        ? TrendingDown
        : deltaVsYesterday > 0
          ? TrendingUp
          : Minus;

  const deltaColor =
    deltaVsYesterday === null
      ? 'var(--text-secondary)'
      : deltaVsYesterday < 0
        ? 'var(--color-success, #34d399)'
        : deltaVsYesterday > 0
          ? 'var(--color-fat-strong, #f87171)'
          : 'var(--text-secondary)';

  return (
    <div className="card quick-add-card glass-panel-elevated p-4 sm:p-5 rounded-2xl mb-6 relative overflow-hidden border border-white/[0.08]">
      {/* Background ambient radial glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)' }}
      />

      {/* Header Row */}
      <div className="quick-add-header flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--accent-primary-light, #38bdf8)',
            }}
          >
            <Scale size={16} />
          </div>
          <div>
            <span
              className="quick-add-title text-xs font-bold uppercase tracking-wider block"
              style={{ color: 'var(--text-primary)' }}
            >
              Peso Hoy
            </span>
            <span
              className="quick-add-date text-[0.72rem] capitalize flex items-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Calendar size={11} className="opacity-70" /> {todayLabel}
            </span>
          </div>
        </div>

        {/* Status Badge / Edit button */}
        <div className="flex items-center gap-2">
          {hasTodayWeight ? (
            <>
              {!isEditing && (
                <button
                  type="button"
                  aria-label="Editar peso de hoy"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Pencil size={13} />
                </button>
              )}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold border"
                style={{
                  background: 'rgba(52, 211, 153, 0.15)',
                  borderColor: 'rgba(52, 211, 153, 0.3)',
                  color: 'var(--color-success, #34d399)',
                }}
              >
                <Check size={11} /> Registrado
              </span>
            </>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold border animate-pulse"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
              }}
            >
              Pendiente
            </span>
          )}
        </div>
      </div>

      {/* Input Body */}
      <div className="quick-add-body flex flex-col items-center justify-center my-1 relative z-10">
        {/* Weight display / input */}
        <div className="flex items-baseline gap-2 mb-1 w-full justify-center">
          <label htmlFor="quick-weight-input" className="sr-only">
            Peso corporal de hoy
          </label>
          <input
            ref={inputRef}
            id="quick-weight-input"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            aria-label="Peso corporal de hoy en kilogramos"
            className="quick-add-input text-3xl sm:text-4xl font-black font-mono text-center rounded-xl w-36 py-1 outline-none text-white border transition-opacity"
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              borderColor: isReadOnly ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
              boxShadow: isReadOnly ? 'none' : '0 0 12px var(--accent-glow)',
              opacity: isReadOnly ? 0.75 : 1,
              pointerEvents: isReadOnly ? 'none' : 'auto',
            }}
            value={quickWeight}
            onChange={(e) => setQuickWeight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveWeight()}
            placeholder={hasTodayWeight && todayWeight ? todayWeight.toFixed(2) : '00.00'}
            disabled={isPending || isReadOnly}
            readOnly={isReadOnly}
          />
          <span
            className="text-sm sm:text-base font-bold font-mono"
            style={{ color: 'var(--text-secondary)' }}
          >
            kg
          </span>
        </div>

        {/* Delta vs yesterday + yesterday context */}
        <div className="flex items-center gap-3 mb-3 h-5">
          {yesterdayWeight !== undefined && (
            <span className="text-[0.68rem]" style={{ color: 'var(--text-secondary)' }}>
              Ayer: {yesterdayWeight.toFixed(2)} kg
            </span>
          )}
          {DeltaIcon !== null && deltaVsYesterday !== null && (
            <span
              className="flex items-center gap-0.5 text-[0.68rem] font-semibold"
              style={{ color: deltaColor }}
            >
              <DeltaIcon size={11} />
              {deltaVsYesterday > 0 ? '+' : ''}
              {deltaVsYesterday.toFixed(2)} kg
            </span>
          )}
        </div>

        {/* Stepper Chips — hidden in read-only mode */}
        {!isReadOnly && (
          <div className="grid grid-cols-4 gap-2 w-full max-w-xs mb-3.5">
            {STEPPER_DELTAS.map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => adjustWeight(delta)}
                disabled={isPending}
                className="btn-press py-2.5 rounded-xl border text-xs font-mono font-bold text-gray-300 hover:text-white transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
              </button>
            ))}
          </div>
        )}

        {/* Action Button — hidden in read-only mode */}
        {!isReadOnly && (
          <button
            aria-label={
              hasTodayWeight ? 'Actualizar peso corporal de hoy' : 'Registrar peso corporal de hoy'
            }
            type="button"
            onClick={() => saveWeight()}
            disabled={isPending}
            className={`btn w-full max-w-xs min-h-[44px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-press transition-all duration-300 ${
              hasTodayWeight ? 'btn-secondary' : 'btn-primary'
            }`}
            style={
              justSaved
                ? {
                    background: 'var(--color-success, #10b981)',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                  }
                : undefined
            }
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando...
              </>
            ) : justSaved ? (
              <>
                <Check size={18} /> {hasTodayWeight ? 'Actualizado' : 'Registrado'}
              </>
            ) : hasTodayWeight ? (
              'Actualizar'
            ) : (
              'Registrar'
            )}
          </button>
        )}
      </div>
    </div>
  );
});
