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

  const registered = hasTodayWeight || justSaved;

  // Compact row: the weight is the one daily action, so it is the key sheet of the page.
  return (
    <div className="card quick-add-card p-3 sm:p-4 mb-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-40">
          <div className="flex items-center gap-2">
            <Scale size={16} aria-hidden="true" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Peso de hoy
            </span>
            <span
              className="text-[0.68rem] font-bold uppercase tracking-wide"
              style={{
                color: registered ? 'var(--color-success, #34d399)' : 'var(--color-warning)',
              }}
            >
              {registered ? 'Registrado' : 'Pendiente'}
            </span>
          </div>
          <div
            className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.72rem]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-1">
              <Calendar size={11} aria-hidden="true" /> {capitalizeFirst(todayLabel)}
            </span>
            {yesterdayWeight !== undefined && <span>Ayer: {yesterdayWeight.toFixed(2)} kg</span>}
            {DeltaIcon !== null && deltaVsYesterday !== null && (
              <span
                className="flex items-center gap-0.5 font-semibold tabular-nums"
                style={{ color: deltaColor }}
              >
                <DeltaIcon size={12} aria-hidden="true" />
                {deltaVsYesterday > 0 ? '+' : ''}
                {deltaVsYesterday.toFixed(2)} kg
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="quick-weight-input" className="sr-only">
            Peso corporal de hoy
          </label>
          <div className="relative flex w-[132px] items-center">
            <input
              ref={inputRef}
              id="quick-weight-input"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              aria-label="Peso corporal de hoy en kilogramos"
              className="quick-add-input min-h-11 w-full rounded-md border py-1 pl-3 pr-8 text-center text-2xl font-black tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderColor: isDirty ? 'var(--accent-primary)' : 'var(--border-medium)',
              }}
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveWeight()}
              placeholder={hasTodayWeight && todayWeight ? todayWeight.toFixed(2) : '00.00'}
              disabled={isPending}
            />
            <span
              className="pointer-events-none absolute right-2.5 text-xs font-bold"
              style={{ color: 'var(--text-secondary)' }}
            >
              kg
            </span>
          </div>

          <button
            type="button"
            onClick={() => saveWeight()}
            disabled={isPending}
            className={`btn ${isDirty || !hasTodayWeight ? 'btn-primary' : 'btn-secondary'} btn-press h-11 px-3.5 text-xs font-semibold flex items-center gap-1.5`}
            aria-label={
              hasTodayWeight ? 'Actualizar peso corporal de hoy' : 'Registrar peso corporal de hoy'
            }
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Check size={16} className="stroke-[2.5]" aria-hidden="true" />
                <span>{justSaved ? 'Guardado' : hasTodayWeight ? 'Actualizar' : 'Registrar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
