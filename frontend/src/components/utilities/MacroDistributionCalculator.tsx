import { useState, useId, useMemo } from 'react';
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
      <p className="text-sm text-gray-300 leading-relaxed">
        Distribuye tus macronutrientes diarios (proteínas, carbohidratos y grasas) y calcula las
        raciones exactas por plato según tu número de comidas.
      </p>

      {/* STRATEGY TOGGLE */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 max-w-md">
        <button
          type="button"
          onClick={() => setStrategy('bodyweight')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            strategy === 'bodyweight'
              ? 'bg-[var(--accent-primary,#e11d48)] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Por Peso Corporal (g/kg - Atletas)
        </button>
        <button
          type="button"
          onClick={() => setStrategy('percentage')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            strategy === 'percentage'
              ? 'bg-[var(--accent-primary,#e11d48)] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Por Porcentajes (%)
        </button>
      </div>

      {/* TARGET INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor={kcalId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Calorías Objetivo Diarias (kcal)
          </label>
          <input
            id={kcalId}
            type="number"
            inputMode="numeric"
            step="50"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="2200"
            value={targetKcal}
            onChange={(e) => setTargetKcal(e.target.value)}
          />
        </div>

        {strategy === 'bodyweight' && (
          <div>
            <label htmlFor={weightId} className="block text-xs font-semibold text-gray-200 mb-1.5">
              Peso Corporal (kg)
            </label>
            <input
              id={weightId}
              type="number"
              inputMode="decimal"
              step="0.5"
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
              placeholder="75.0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor={mealsId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Comidas por día
          </label>
          <select
            id={mealsId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={mealsCount}
            onChange={(e) => setMealsCount(parseInt(e.target.value, 10))}
          >
            <option value="2">2 comidas (Ayuno / 16:8)</option>
            <option value="3">3 comidas (Desayuno, Almuerzo, Cena)</option>
            <option value="4">4 comidas (+ Merienda)</option>
            <option value="5">5 comidas (+ Media mañana)</option>
            <option value="6">6 comidas (Atleta alto rendimiento)</option>
          </select>
        </div>
      </div>

      {/* STRATEGY-SPECIFIC CONTROLS */}
      {strategy === 'bodyweight' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <div className="flex justify-between text-xs mb-1">
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
            <div className="flex justify-between text-xs mb-1">
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
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-gray-400 self-center">Presets populares:</span>
            <button
              type="button"
              onClick={() => applyPreset(30, 40, 30)}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              Balanceado (30P / 40C / 30G)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(35, 25, 40)}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              Definición (35P / 25C / 40G)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(25, 5, 70)}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              Keto / Cetogénica (25P / 5C / 70G)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(20, 60, 20)}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium"
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
                className="w-full px-2 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
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
                className="w-full px-2 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
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
                className="w-full px-2 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* WARNING NOTIFICATION */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          {result.warnings.map((w, idx) => (
            <div key={idx}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* KPI MACRO CARDS */}
      <div role="status" aria-live="polite" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Proteína */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-blue-300 font-bold uppercase">
            <span>Proteína</span>
            <span className="text-zinc-400 font-mono">{result.protein.percentage}%</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {result.protein.grams} <span className="text-sm font-normal text-gray-400">g</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{result.protein.kcal} kcal (4 kcal/g)</div>
        </div>

        {/* Carbohidratos */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-blue-400 font-bold uppercase">
            <span>Carbohidratos</span>
            <span className="text-zinc-400 font-mono">{result.carbs.percentage}%</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {result.carbs.grams} <span className="text-sm font-normal text-gray-400">g</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{result.carbs.kcal} kcal (4 kcal/g)</div>
        </div>

        {/* Grasas */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-blue-500 font-bold uppercase">
            <span>Grasas</span>
            <span className="text-zinc-400 font-mono">{result.fat.percentage}%</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-1">
            {result.fat.grams} <span className="text-sm font-normal text-gray-400">g</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{result.fat.kcal} kcal (9 kcal/g)</div>
        </div>
      </div>

      {/* PER-MEAL BREAKDOWN */}
      {result.perMeal && (
        <div className="p-4 rounded-xl bg-[#161618] border border-white/10 space-y-2">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Reparto recomendado por plato ({result.perMeal.mealCount} comidas):
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[11px] text-gray-400 block">Calorías por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.kcal} kcal
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] text-rose-300 block">Proteína por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.proteinGrams} g
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <span className="text-[11px] text-sky-300 block">Carbos por plato</span>
              <span className="text-base font-extrabold text-white">
                {result.perMeal.carbsGrams} g
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] text-amber-300 block">Grasas por plato</span>
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
