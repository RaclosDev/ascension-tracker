import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Scale, Calendar, Check, Loader2, Sparkles, Pencil } from 'lucide-react';
import api from '../../api/client';
import { haptics } from '../../lib/haptics';
import { parseSafeWeight } from '../../utils/weightHelper';

interface QuickWeightCardProps {
  todayLabel: string;
  todayDateStr: string;
  todayWeight?: number;
  recentWeight?: number;
  hasTodayWeight: boolean;
}

export const QuickWeightCard = React.memo(function QuickWeightCard({
  todayLabel,
  todayDateStr,
  todayWeight,
  recentWeight,
  hasTodayWeight,
}: QuickWeightCardProps) {
  const queryClient = useQueryClient();
  const [quickWeight, setQuickWeight] = useState('');
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize display value
  useEffect(() => {
    if (todayWeight !== undefined) {
      setQuickWeight(todayWeight.toString());
    } else if (recentWeight !== undefined && quickWeight === '') {
      setQuickWeight(recentWeight.toString());
    }
  }, [todayWeight, recentWeight, quickWeight]);

  const addWeightMutation = useMutation({
    mutationFn: (val: number) => api.post('/weights', { date: todayDateStr, weight: val }),
    onSuccess: (_, val) => {
      haptics.success();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
      toast.success(hasTodayWeight ? `Peso actualizado: ${val} kg` : `Peso registrado: ${val} kg`);
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekSummaries'] });
    },
    onError: (err: unknown) => {
      haptics.error();
      const e = err as Error & { response?: { data?: { message?: string; error?: string } } };
      const msg = e.response?.data?.message || e.response?.data?.error || e.message;
      toast.error(msg ? `Error al guardar: ${msg}` : 'Error al registrar peso');
    },
  });

  const handleQuickAdd = () => {
    const val = parseSafeWeight(quickWeight);
    if (val === null) {
      haptics.error();
      toast.error('Introduce un peso válido en kg (ej: 80.5)');
      return;
    }
    haptics.medium();
    inputRef.current?.blur();
    setIsManualEdit(false);
    addWeightMutation.mutate(val);
  };

  const adjustWeight = (delta: number) => {
    haptics.step();
    const currentNum = parseSafeWeight(quickWeight) ?? recentWeight ?? 70.0;
    const nextVal = Math.round((currentNum + delta) * 10) / 10;
    const clamped = Math.max(30, Math.min(250, nextVal));
    setQuickWeight(clamped.toFixed(1));
  };

  const isPending = addWeightMutation.isPending;
  const numericDisplay = parseSafeWeight(quickWeight) ?? todayWeight ?? recentWeight ?? 70.0;

  return (
    <div className="card nutrition-summary-card glass-panel-elevated p-4 sm:p-5 rounded-2xl mb-6 relative overflow-hidden border border-white/[0.08]">
      {/* Background ambient radial glow matching active skin */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-2xl"
        style={{
          background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
        }}
      />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-4 relative z-10">
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
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: 'var(--text-primary)' }}
            >
              Peso Hoy
            </span>
            <span
              className="text-[0.72rem] capitalize flex items-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Calendar size={11} className="opacity-70" /> {todayLabel}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center">
          {hasTodayWeight ? (
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

      {/* Hero Display & Stepper Controls */}
      <div className="flex flex-col items-center justify-center my-1 relative z-10">
        <div className="flex items-baseline gap-1.5 mb-3">
          {isManualEdit ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autoFocus
              className="text-3xl sm:text-4xl font-black font-mono text-center rounded-xl w-36 py-1 outline-none text-white border"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderColor: 'var(--accent-primary)',
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              onBlur={() => setIsManualEdit(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsManualEdit(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="group flex items-baseline gap-2 cursor-pointer transition-transform active:scale-95"
              title="Toca para editar manualmente"
            >
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight tabular-nums group-hover:text-[var(--accent-primary-light,#38bdf8)] transition-colors">
                {numericDisplay.toFixed(1)}
              </span>
              <Pencil
                size={14}
                className="opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--accent-primary-light, #38bdf8)' }}
              />
            </button>
          )}
          <span
            className="text-sm sm:text-base font-bold font-mono"
            style={{ color: 'var(--text-secondary)' }}
          >
            kg
          </span>
        </div>

        {/* Nudge Stepper Chips */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs mb-3.5">
          <button
            type="button"
            onClick={() => adjustWeight(-0.5)}
            className="btn-press py-2 rounded-xl border text-xs font-mono font-bold text-gray-300 hover:text-white transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            -0.5
          </button>
          <button
            type="button"
            onClick={() => adjustWeight(-0.1)}
            className="btn-press py-2 rounded-xl border text-xs font-mono font-bold text-gray-300 hover:text-white transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            -0.1
          </button>
          <button
            type="button"
            onClick={() => adjustWeight(0.1)}
            className="btn-press py-2 rounded-xl border text-xs font-mono font-bold text-gray-300 hover:text-white transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            +0.1
          </button>
          <button
            type="button"
            onClick={() => adjustWeight(0.5)}
            className="btn-press py-2 rounded-xl border text-xs font-mono font-bold text-gray-300 hover:text-white transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            +0.5
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isPending}
          className={`w-full max-w-xs py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-press transition-all duration-300 ${
            justSaved ? 'text-white' : 'text-white hover:brightness-110 active:scale-[0.98]'
          }`}
          style={
            justSaved
              ? {
                  background: 'var(--color-success, #10b981)',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                }
              : {
                  background: 'var(--accent-primary)',
                  boxShadow: '0 0 16px var(--accent-glow)',
                }
          }
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Guardando...
            </>
          ) : justSaved ? (
            <>
              <Check size={18} /> ¡Peso Guardado!
            </>
          ) : hasTodayWeight ? (
            <>
              <Sparkles size={16} /> Actualizar Peso
            </>
          ) : (
            <>
              <Check size={16} /> Guardar Peso de Hoy
            </>
          )}
        </button>
      </div>
    </div>
  );
});
