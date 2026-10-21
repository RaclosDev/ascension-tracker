import { useState, useId, useMemo, useEffect } from 'react';
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
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '');
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

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-300 leading-relaxed">
        Calcula tu repetición máxima (1RM) teórica a partir de una serie submáxima y genera la tabla
        de intensidades y zonas de entrenamiento.
      </p>

      {/* FORM INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor={weightId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Peso levantado ({unit})
          </label>
          <input
            id={weightId}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="Ej: 100"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={repsId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Repeticiones logradas
          </label>
          <input
            id={repsId}
            type="number"
            inputMode="numeric"
            min="1"
            max="36"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="Ej: 5"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={formulaId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Fórmula matemática
          </label>
          <select
            id={formulaId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={formula}
            onChange={(e) => setFormula(e.target.value as OneRepMaxFormula)}
          >
            <option value="average">Consenso Clínico (Media Epley/Brzycki)</option>
            <option value="epley">Epley (General)</option>
            <option value="brzycki">Brzycki (Reps ≤ 10)</option>
            <option value="lombardi">Lombardi (Exponencial)</option>
            <option value="oconner">O&apos;Conner</option>
          </select>
        </div>

        <div>
          <label htmlFor={roundId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Redondeo de barra
          </label>
          <select
            id={roundId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={roundStep}
            onChange={(e) => setRoundStep(parseFloat(e.target.value))}
          >
            <option value="0">Sin redondeo (Exacto)</option>
            <option value="0.5">0.5 {unit} (Microcargas)</option>
            <option value="1">1.0 {unit}</option>
            <option value="2.5">2.5 {unit} (Discos estándar)</option>
          </select>
        </div>
      </div>

      {/* KPI 1RM DISPLAY */}
      <div
        role="status"
        aria-live="polite"
        className="p-5 rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent-primary)]/20 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[var(--accent-primary-light)]">
            1RM Estimado ({formula.toUpperCase()})
          </span>
          <div className="text-4xl font-extrabold text-white mt-1">
            {result.oneRepMax > 0 ? result.oneRepMax : '0.0'}{' '}
            <span className="text-lg font-normal text-gray-400">{unit}</span>
          </div>
          {numReps > 10 && formula === 'brzycki' && (
            <p className="text-xs text-amber-400 mt-1">
              Nota: Brzycki tiene mayor precisión con 10 o menos repeticiones.
            </p>
          )}
        </div>

        {/* COMPARISON PILLS */}
        {result.oneRepMax > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-400 block">Epley</span>
              <span className="text-xs font-bold text-gray-200">
                {result.formulaResults.epley} {unit}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-400 block">Brzycki</span>
              <span className="text-xs font-bold text-gray-200">
                {result.formulaResults.brzycki} {unit}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-400 block">Lombardi</span>
              <span className="text-xs font-bold text-gray-200">
                {result.formulaResults.lombardi} {unit}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[10px] text-gray-400 block">O&apos;Conner</span>
              <span className="text-xs font-bold text-gray-200">
                {result.formulaResults.oconner} {unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PERCENTAGE BREAKDOWN TABLE */}
      {result.oneRepMax > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Tabla de Zonas de Carga e Intensidad
          </h4>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#161618]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 border-b border-white/10">
                <tr>
                  <th scope="col" className="py-2.5 px-3 font-semibold">
                    Intensidad
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">
                    Peso Estimado
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">
                    Reps aprox.
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-semibold">
                    Zona de Entrenamiento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.percentages.map((p) => (
                  <tr
                    key={p.percentage}
                    className={`transition-colors hover:bg-white/[0.03] ${
                      p.percentage === 100
                        ? 'bg-red-500/10 font-bold text-red-200'
                        : 'text-gray-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium text-white">{p.percentage}%</td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {p.weight} {unit}
                    </td>
                    <td className="py-2.5 px-3 text-gray-300">{p.repsEstimate} reps</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-white/5 text-gray-300 border border-white/10">
                        {p.intensityZone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
