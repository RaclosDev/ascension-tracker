import { useState, useId, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { calculateMacroDistribution, MacroStrategy } from '../../utils/fitnessCalculators';

interface MacroDistributionCalculatorProps {
  initialKcal?: number;
  initialWeight?: number;
}

export default function MacroDistributionCalculator({
  initialKcal = 2200,
  initialWeight = 75,
}: MacroDistributionCalculatorProps) {
  const [strategy, setStrategy] = useState<MacroStrategy>('bodyweight');
  const [targetKcal, setTargetKcal] = useState<string>(String(initialKcal));
  const [weightKg, setWeightKg] = useState<string>(String(initialWeight));

  // Parámetros g/kg (Estrategia por peso corporal)
  const [proteinGPerKg, setProteinGPerKg] = useState<number>(2.0);
  const [fatGPerKg, setFatGPerKg] = useState<number>(0.9);

  // Parámetros porcentaje (Estrategia por porcentaje)
  const [proteinPct, setProteinPct] = useState<number>(30);
  const [carbsPct, setCarbsPct] = useState<number>(40);
  const [fatPct, setFatPct] = useState<number>(30);

  // Número de comidas al día
  const [mealsCount, setMealsCount] = useState<number>(4);

  const kcalId = useId();
  const weightId = useId();
  const mealsId = useId();

  const numKcal = parseFloat(targetKcal) || 0;
  const numWeight = parseFloat(weightKg) || 0;

  const result = useMemo(() => {
    return calculateMacroDistribution({
      strategy,
      targetKcal: numKcal,
      weightKg: numWeight,
      proteinGPerKg,
      fatGPerKg,
      proteinPercent: proteinPct,
      carbsPercent: carbsPct,
      fatPercent: fatPct,
      mealsCount,
    });
  }, [
    strategy,
    numKcal,
    numWeight,
    proteinGPerKg,
    fatGPerKg,
    proteinPct,
    carbsPct,
    fatPct,
    mealsCount,
  ]);

  const applyPreset = (p: number, c: number, f: number) => {
    setStrategy('percentage');
    setProteinPct(p);
    setCarbsPct(c);
    setFatPct(f);
  };

  return (
    <div className="space-y-6">
      {/* STRATEGY TOGGLE */}
      <div className="flex gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 max-w-md shadow-inner">
        <button
          type="button"
          onClick={() => setStrategy('bodyweight')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            strategy === 'bodyweight'
              ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_var(--accent-glow)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Por Peso Corporal (g/kg - Atletas)
        </button>
        <button
          type="button"
          onClick={() => setStrategy('percentage')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            strategy === 'percentage'
              ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_var(--accent-glow)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Por Porcentajes (%)
        </button>
      </div>

      {/* TARGET INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={kcalId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Calorías Objetivo Diarias (kcal)
          </label>
          <div className="flex items-center justify-between">
            <input
              id={kcalId}
              type="number"
              inputMode="numeric"
              step="50"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder="2200"
              value={targetKcal}
              onChange={(e) => setTargetKcal(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              kcal
            </span>
          </div>
        </div>

        {strategy === 'bodyweight' && (
          <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <label
              htmlFor={weightId}
              className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
            >
              Peso Corporal (kg)
            </label>
            <div className="flex items-center justify-between">
              <input
                id={weightId}
                type="number"
                inputMode="decimal"
                step="0.5"
                className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
                placeholder="75.0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                kg
              </span>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={mealsId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Comidas por día
          </label>
          <div className="relative flex items-center">
            <select
              id={mealsId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={mealsCount}
              onChange={(e) => setMealsCount(parseInt(e.target.value, 10))}
            >
              <option value="2" className="bg-[#14141e] text-white">
                2 comidas (Ayuno / 16:8)
              </option>
              <option value="3" className="bg-[#14141e] text-white">
                3 comidas (Desayuno, Almuerzo, Cena)
              </option>
              <option value="4" className="bg-[#14141e] text-white">
                4 comidas (+ Merienda)
              </option>
              <option value="5" className="bg-[#14141e] text-white">
                5 comidas (+ Media mañana)
              </option>
              <option value="6" className="bg-[#14141e] text-white">
                6 comidas (Atleta alto rendimiento)
              </option>
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* STRATEGY-SPECIFIC CONTROLS */}
      {strategy === 'bodyweight' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-rose-300">Proteína: {proteinGPerKg} g/kg</span>
              <span className="text-gray-400">Recomendado: 1.6 - 2.4 g/kg</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="3.0"
              step="0.1"
              value={proteinGPerKg}
              onChange={(e) => setProteinGPerKg(parseFloat(e.target.value))}
              aria-label="Proteína gramos por kilogramo"
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-amber-300">Grasas: {fatGPerKg} g/kg</span>
              <span className="text-gray-400">Recomendado: 0.7 - 1.2 g/kg</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.05"
              value={fatGPerKg}
              onChange={(e) => setFatGPerKg(parseFloat(e.target.value))}
              aria-label="Grasas gramos por kilogramo"
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-gray-400 self-center">Presets populares:</span>
            <button
              type="button"
              onClick={() => applyPreset(30, 40, 30)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-white font-medium transition-all"
            >
              Balanceado (30P / 40C / 30G)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(35, 25, 40)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-white font-medium transition-all"
            >
              Definición (35P / 25C / 40G)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(25, 5, 70)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-white font-medium transition-all"
            >
              Keto / Cetogénica (25P / 5C / 70G)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(20, 60, 20)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-white font-medium transition-all"
            >
              Resistencia (20P / 60C / 20G)
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="macro-protein-pct"
                className="block text-[11px] text-rose-300 font-semibold mb-1"
              >
                % Proteína ({proteinPct}%)
              </label>
              <input
                id="macro-protein-pct"
                type="number"
                inputMode="numeric"
                min="5"
                max="70"
                value={proteinPct}
                onChange={(e) => setProteinPct(parseInt(e.target.value, 10) || 0)}
                aria-label="Porcentaje de proteína"
                className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="macro-carbs-pct"
                className="block text-[11px] text-sky-300 font-semibold mb-1"
              >
                % Carbohidratos ({carbsPct}%)
              </label>
              <input
                id="macro-carbs-pct"
                type="number"
                inputMode="numeric"
                min="0"
                max="80"
                value={carbsPct}
                onChange={(e) => setCarbsPct(parseInt(e.target.value, 10) || 0)}
                aria-label="Porcentaje de carbohidratos"
                className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="macro-fat-pct"
                className="block text-[11px] text-amber-300 font-semibold mb-1"
              >
                % Grasas ({fatPct}%)
              </label>
              <input
                id="macro-fat-pct"
                type="number"
                inputMode="numeric"
                min="10"
                max="80"
                value={fatPct}
                onChange={(e) => setFatPct(parseInt(e.target.value, 10) || 0)}
                aria-label="Porcentaje de grasas"
                className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* WARNING NOTIFICATION */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col gap-1">
          {result.warnings.map((w, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span>⚠</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI MACRO CARDS */}
      <div role="status" aria-live="polite" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Proteína */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/30 to-black/40 border border-rose-500/20 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs text-rose-400 font-bold uppercase tracking-wider">
            <span>Proteína</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              {result.protein.percentage}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {result.protein.grams} <span className="text-sm font-normal text-gray-400">g</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{result.protein.kcal} kcal (4 kcal/g)</div>
        </div>

        {/* Carbohidratos */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/30 to-black/40 border border-sky-500/20 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs text-sky-400 font-bold uppercase tracking-wider">
            <span>Carbohidratos</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
              {result.carbs.percentage}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {result.carbs.grams} <span className="text-sm font-normal text-gray-400">g</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{result.carbs.kcal} kcal (4 kcal/g)</div>
        </div>

        {/* Grasas */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-black/40 border border-amber-500/20 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>Grasas Saludables</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              {result.fat.percentage}%
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {result.fat.grams} <span className="text-sm font-normal text-gray-400">g</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{result.fat.kcal} kcal (9 kcal/g)</div>
        </div>
      </div>

      {/* PER-MEAL BREAKDOWN */}
      {result.perMeal && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 backdrop-blur-sm">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Reparto recomendado por plato ({result.perMeal.mealCount} comidas):
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5">
              <span className="text-[11px] text-gray-400 block mb-0.5">Calorías por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.kcal} kcal
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] text-rose-300 block mb-0.5">Proteína por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.proteinGrams} g
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <span className="text-[11px] text-sky-300 block mb-0.5">Carbos por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.carbsGrams} g
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] text-amber-300 block mb-0.5">Grasas por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.fatGrams} g
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
