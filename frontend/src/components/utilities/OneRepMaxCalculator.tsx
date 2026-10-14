import { useState, useId, useMemo, useEffect } from 'react';
import { ChevronDown, Sparkles, TrendingUp, Dumbbell, Hash } from 'lucide-react';
import { calculateOneRepMax, OneRepMaxFormula } from '../../utils/fitnessCalculators';

interface OneRepMaxCalculatorProps {
  initialWeight?: number;
  unit?: 'kg' | 'lbs';
  onCalculated?: (rm: number) => void;
}

export default function OneRepMaxCalculator({
  initialWeight,
  unit = 'kg',
  onCalculated,
}: OneRepMaxCalculatorProps) {
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '100');
  const [reps, setReps] = useState<string>('5');
  const [formula, setFormula] = useState<OneRepMaxFormula>('average');
  const [roundStep, setRoundStep] = useState<number>(0.5);

  const weightId = useId();
  const repsId = useId();
  const formulaId = useId();
  const roundId = useId();

  const numWeight = parseFloat(weight) || 0;
  const numReps = parseInt(reps, 10) || 0;

  const result = useMemo(() => {
    return calculateOneRepMax({
      weight: numWeight,
      reps: numReps,
      formula,
      roundStep: roundStep > 0 ? roundStep : undefined,
    });
  }, [numWeight, numReps, formula, roundStep]);

  useEffect(() => {
    if (result.oneRepMax > 0 && onCalculated) {
      onCalculated(result.oneRepMax);
    }
  }, [result.oneRepMax, onCalculated]);

  const getZoneBadgeColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (percentage >= 85) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (percentage >= 70) return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    if (percentage >= 60) return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* FORM INPUTS - LIQUID GLASS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Input Peso */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={weightId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            <Dumbbell size={12} className="text-[var(--accent-primary)]" />
            Peso levantado ({unit})
          </label>
          <div className="flex items-center justify-between">
            <input
              id={weightId}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder="100"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              {unit}
            </span>
          </div>
        </div>

        {/* Input Repeticiones */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={repsId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            <Hash size={12} className="text-[var(--accent-primary)]" />
            Repeticiones logradas
          </label>
          <div className="flex items-center justify-between">
            <input
              id={repsId}
              type="number"
              inputMode="numeric"
              min="1"
              max="36"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder="5"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              reps
            </span>
          </div>
        </div>

        {/* Select Fórmula */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={formulaId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            <Sparkles size={12} className="text-[var(--accent-primary)]" />
            Fórmula matemática
          </label>
          <div className="relative flex items-center">
            <select
              id={formulaId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={formula}
              onChange={(e) => setFormula(e.target.value as OneRepMaxFormula)}
            >
              <option value="average" className="bg-[#14141e] text-white">
                Consenso Clínico (Media)
              </option>
              <option value="epley" className="bg-[#14141e] text-white">
                Epley (General)
              </option>
              <option value="brzycki" className="bg-[#14141e] text-white">
                Brzycki (Reps ≤ 10)
              </option>
              <option value="lombardi" className="bg-[#14141e] text-white">
                Lombardi (Exponencial)
              </option>
              <option value="oconner" className="bg-[#14141e] text-white">
                O&apos;Conner
              </option>
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Select Redondeo */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={roundId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            <TrendingUp size={12} className="text-[var(--accent-primary)]" />
            Redondeo de barra
          </label>
          <div className="relative flex items-center">
            <select
              id={roundId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={roundStep}
              onChange={(e) => setRoundStep(parseFloat(e.target.value))}
            >
              <option value="0" className="bg-[#14141e] text-white">
                Sin redondeo (Exacto)
              </option>
              <option value="0.5" className="bg-[#14141e] text-white">
                0.5 {unit} (Microcargas)
              </option>
              <option value="1" className="bg-[#14141e] text-white">
                1.0 {unit}
              </option>
              <option value="2.5" className="bg-[#14141e] text-white">
                2.5 {unit} (Discos estándar)
              </option>
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI 1RM DISPLAY - LIQUID GLASS HERO CARD */}
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 backdrop-blur-2xl bg-gradient-to-br from-[var(--accent-primary)]/15 via-white/[0.04] to-black/60 border border-[var(--accent-primary)]/30 shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_25px_var(--accent-glow),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        {/* Glow ambient background element */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-[var(--accent-primary)]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[11px] font-bold tracking-wider uppercase text-[var(--accent-primary)] mb-2">
            <Sparkles size={11} />
            1RM Estimado ({formula.toUpperCase()})
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black text-white font-display tracking-tight drop-shadow-[0_2px_15px_rgba(0,133,255,0.35)]">
              {result.oneRepMax > 0 ? result.oneRepMax : '0.0'}
            </span>
            <span className="text-xl sm:text-2xl font-semibold text-gray-400">{unit}</span>
          </div>
          {numReps > 10 && formula === 'brzycki' && (
            <p className="text-xs text-amber-400 mt-2 font-medium flex items-center gap-1.5">
              <span>⚠</span> Brzycki ofrece mayor fidelidad matemática con 10 o menos repeticiones.
            </p>
          )}
        </div>

        {/* COMPARISON PILLS */}
        {result.oneRepMax > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center hover:bg-white/[0.08] transition-all">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                Epley
              </span>
              <span className="text-sm font-bold text-white font-display">
                {result.formulaResults.epley} {unit}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center hover:bg-white/[0.08] transition-all">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                Brzycki
              </span>
              <span className="text-sm font-bold text-white font-display">
                {result.formulaResults.brzycki} {unit}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center hover:bg-white/[0.08] transition-all">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                Lombardi
              </span>
              <span className="text-sm font-bold text-white font-display">
                {result.formulaResults.lombardi} {unit}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-center hover:bg-white/[0.08] transition-all">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">
                O&apos;Conner
              </span>
              <span className="text-sm font-bold text-white font-display">
                {result.formulaResults.oconner} {unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PERCENTAGE BREAKDOWN TABLE - LIQUID GLASS LIST */}
      {result.oneRepMax > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-[var(--accent-primary)]" />
              Tabla de Zonas de Carga e Intensidad
            </h4>
            <span className="text-xs text-gray-400 font-medium">
              Porcentajes basados en {result.oneRepMax} {unit}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl p-2 sm:p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th scope="col" className="py-2 px-4">
                      Intensidad
                    </th>
                    <th scope="col" className="py-2 px-4">
                      Peso Estimado
                    </th>
                    <th scope="col" className="py-2 px-4">
                      Reps aprox.
                    </th>
                    <th scope="col" className="py-2 px-4">
                      Zona de Entrenamiento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.percentages.map((p) => {
                    const isMax = p.percentage === 100;
                    return (
                      <tr
                        key={p.percentage}
                        className={`group transition-all duration-200 rounded-xl ${
                          isMax
                            ? 'bg-gradient-to-r from-[var(--accent-primary)]/25 via-[var(--accent-primary)]/10 to-white/[0.02] border border-[var(--accent-primary)]/40 shadow-[0_0_15px_var(--accent-glow)]'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/5'
                        }`}
                      >
                        <td
                          role="cell"
                          className="py-3 px-4 font-bold text-sm text-white font-display rounded-l-xl"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isMax ? 'bg-[var(--accent-primary)] animate-pulse' : 'bg-white/30'
                              }`}
                            />
                            {p.percentage}%
                          </div>
                        </td>
                        <td
                          role="cell"
                          className="py-3 px-4 font-black text-white font-display text-sm sm:text-base"
                        >
                          {p.weight}{' '}
                          <span className="text-xs font-normal text-gray-400">{unit}</span>
                        </td>
                        <td role="cell" className="py-3 px-4 text-xs font-medium text-gray-300">
                          {p.repsEstimate} reps
                        </td>
                        <td role="cell" className="py-3 px-4 rounded-r-xl">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${getZoneBadgeColor(
                              p.percentage,
                            )}`}
                          >
                            {p.intensityZone}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
