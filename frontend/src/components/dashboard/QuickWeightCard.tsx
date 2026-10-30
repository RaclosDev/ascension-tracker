import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Scale, Calendar, Check, Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import api from '../../api/client';
import { haptics } from '../../lib/haptics';
import { parseSafeWeight } from '../../utils/weightHelper';
import { capitalizeFirst } from '../../utils/dateHelper';

interface QuickWeightCardProps {
  todayLabel: string;
  todayDateStr: string;
  todayWeight?: number;
  recentWeight?: number;
  yesterdayWeight?: number;
  hasTodayWeight: boolean;
}

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
  const [justSaved, setJustSaved] = useState(false);
  const undoToastIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize display value only once when empty
  useEffect(() => {
    if (todayWeight !== undefined && quickWeight === '') {
      setQuickWeight(todayWeight.toString());
    } else if (recentWeight !== undefined && quickWeight === '') {
      setQuickWeight(recentWeight.toString());
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
                const prev = yesterdayWeight ?? recentWeight;
                if (prev !== undefined) setQuickWeight(prev.toFixed(2));
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

  const parsedCurrent = parseSafeWeight(quickWeight);
  const isDirty =
    parsedCurrent !== null &&
    (todayWeight === undefined || Math.abs(parsedCurrent - todayWeight) > 0.001);

  return (
    <div className="card quick-add-card glass-panel-elevated p-4 sm:p-5 rounded-2xl mb-6 relative overflow-hidden border border-white/[0.08]">
      {/* Header Row */}
      <div className="quick-add-header flex items-center justify-between mb-3 relative z-10">
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
              className="quick-add-title text-xs font-semibold block"
              style={{ color: 'var(--text-primary)' }}
            >
              Peso Hoy
            </span>
            <span
              className="quick-add-date text-[0.72rem] flex items-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Calendar size={11} className="opacity-70" /> {capitalizeFirst(todayLabel)}
            </span>
          </div>
        </div>

        {/* Status Badge: Top Right */}
        <div className="flex items-center gap-2">
          {hasTodayWeight || justSaved ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{
                background: 'rgba(52, 211, 153, 0.15)',
                borderColor: 'rgba(52, 211, 153, 0.3)',
                color: 'var(--color-success, #34d399)',
              }}
            >
              <Check size={13} className="stroke-[2.5]" /> Registrado
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
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

      {/* Input Body: Clean, integrated action without steppers or giant button */}
      <div className="quick-add-body flex flex-col items-center justify-center py-2 relative z-10">
        <div className="flex items-center justify-center gap-2.5 w-full max-w-xs mb-2">
          <label htmlFor="quick-weight-input" className="sr-only">
            Peso corporal de hoy
          </label>
          <div className="relative flex-1 max-w-[170px] flex items-center">
            <input
              ref={inputRef}
              id="quick-weight-input"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              aria-label="Peso corporal de hoy en kilogramos"
              className="quick-add-input text-3xl sm:text-4xl font-black tabular-nums text-center rounded-xl w-full py-1.5 pr-8 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 text-white border transition-all"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderColor: isDirty ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.12)',
                boxShadow: isDirty ? '0 0 16px var(--accent-glow)' : 'none',
              }}
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveWeight()}
              placeholder={hasTodayWeight && todayWeight ? todayWeight.toFixed(2) : '00.00'}
              disabled={isPending}
            />
            <span
              className="absolute right-2.5 text-xs font-bold pointer-events-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              kg
            </span>
          </div>

          <button
            type="button"
            onClick={() => saveWeight()}
            disabled={isPending}
            className={`btn-press h-11 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              isPending
                ? 'opacity-60 cursor-not-allowed bg-white/5 border border-white/10 text-zinc-400'
                : isDirty || !hasTodayWeight
                  ? 'btn btn-primary text-white shadow-md shadow-[var(--accent-shadow)]'
                  : 'bg-white/10 border border-white/15 text-zinc-200 hover:text-white'
            }`}
            aria-label={
              hasTodayWeight ? 'Actualizar peso corporal de hoy' : 'Registrar peso corporal de hoy'
            }
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : justSaved ? (
              <>
                <Check size={16} className="text-emerald-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Guardado</span>
              </>
            ) : (
              <>
                <Check size={16} className="stroke-[2.5]" />
                <span>{hasTodayWeight ? 'Actualizar' : 'Registrar'}</span>
              </>
            )}
          </button>
        </div>

        {/* Delta vs yesterday + yesterday context */}
        <div className="flex items-center gap-3 h-5 text-xs">
          {yesterdayWeight !== undefined && (
            <span className="text-[0.72rem]" style={{ color: 'var(--text-secondary)' }}>
              Ayer: {yesterdayWeight.toFixed(2)} kg
            </span>
          )}
          {DeltaIcon !== null && deltaVsYesterday !== null && (
            <span
              className="flex items-center gap-0.5 text-[0.72rem] font-semibold tabular-nums"
              style={{ color: deltaColor }}
            >
              <DeltaIcon size={12} />
              {deltaVsYesterday > 0 ? '+' : ''}
              {deltaVsYesterday.toFixed(2)} kg
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
