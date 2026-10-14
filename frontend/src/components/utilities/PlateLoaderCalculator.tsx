import { useState, useId, useMemo } from 'react';
import { ChevronDown, Disc, Plus, Minus, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { calculatePlateLoader, PlateCount } from '../../utils/fitnessCalculators';

interface PlateLoaderCalculatorProps {
  initialWeight?: number;
  unit?: 'kg' | 'lbs';
}

export default function PlateLoaderCalculator({
  initialWeight = 100,
  unit: initialUnit = 'kg',
}: PlateLoaderCalculatorProps) {
  const [unit, setUnit] = useState<'kg' | 'lbs'>(initialUnit);
  const [targetWeight, setTargetWeight] = useState<string>(String(initialWeight));
  const [barWeight, setBarWeight] = useState<number>(unit === 'kg' ? 20 : 45);
  const [includeCollars, setIncludeCollars] = useState<boolean>(false);

  const targetId = useId();
  const barId = useId();
  const collarsId = useId();
  const unitId = useId();

  const numTarget = parseFloat(targetWeight) || 0;
  const collarsWeight = includeCollars ? (unit === 'kg' ? 2.5 / 2 : 5 / 2) : 0;

  const result = useMemo(() => {
    return calculatePlateLoader({
      targetWeight: numTarget,
      barWeight,
      collarsWeight,
      unit,
    });
  }, [numTarget, barWeight, collarsWeight, unit]);

  const adjustWeight = (delta: number) => {
    const current = parseFloat(targetWeight) || 0;
    const next = Math.max(0, current + delta);
    setTargetWeight(String(Math.round(next * 10) / 10));
  };

  const getPlateVisualHeight = (weight: number): number => {
    if (weight >= 10) return 96;
    if (weight === 5) return 76;
    if (weight === 2.5) return 64;
    if (weight === 1.25) return 50;
    return 40;
  };

  const getPlateVisualWidth = (weight: number): number => {
    if (weight >= 20) return 20;
    if (weight >= 10) return 16;
    if (weight >= 5) return 12;
    return 9;
  };

  return (
    <div className="space-y-6">
      {/* FORM INPUTS - LIQUID GLASS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Input Peso Objetivo */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={targetId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            <Disc size={12} className="text-[var(--accent-primary)]" />
            Peso total objetivo ({unit})
          </label>
          <div className="flex items-center justify-between">
            <input
              id={targetId}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder={unit === 'kg' ? '100' : '225'}
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              {unit}
            </span>
          </div>
        </div>

        {/* Select Tipo de Barra */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={barId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            <Layers size={12} className="text-[var(--accent-primary)]" />
            Tipo de Barra ({unit})
          </label>
          <div className="relative flex items-center">
            <select
              id={barId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={barWeight}
              onChange={(e) => setBarWeight(parseFloat(e.target.value))}
            >
              {unit === 'kg' ? (
                <>
                  <option value="20" className="bg-[#14141e] text-white">
                    Olímpica estándar (20 kg)
                  </option>
                  <option value="15" className="bg-[#14141e] text-white">
                    Olímpica femenina (15 kg)
                  </option>
                  <option value="10" className="bg-[#14141e] text-white">
                    Técnica (10 kg)
                  </option>
                  <option value="25" className="bg-[#14141e] text-white">
                    Powerlifting (25 kg)
                  </option>
                </>
              ) : (
                <>
                  <option value="45" className="bg-[#14141e] text-white">
                    Olímpica estándar (45 lbs)
                  </option>
                  <option value="35" className="bg-[#14141e] text-white">
                    Olímpica femenina (35 lbs)
                  </option>
                  <option value="25" className="bg-[#14141e] text-white">
                    Técnica (25 lbs)
                  </option>
                  <option value="55" className="bg-[#14141e] text-white">
                    Powerlifting (55 lbs)
                  </option>
                </>
              )}
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Select Sistema de Unidades */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={unitId}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Sistema de Unidades
          </label>
          <div className="relative flex items-center">
            <select
              id={unitId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={unit}
              onChange={(e) => {
                const newUnit = e.target.value as 'kg' | 'lbs';
                setUnit(newUnit);
                setBarWeight(newUnit === 'kg' ? 20 : 45);
              }}
            >
              <option value="kg" className="bg-[#14141e] text-white">
                Kilogramos (kg - IWF)
              </option>
              <option value="lbs" className="bg-[#14141e] text-white">
                Libras (lbs)
              </option>
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Checkbox Collares */}
        <div className="flex flex-col justify-end">
          <label
            htmlFor={collarsId}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 cursor-pointer select-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
          >
            <input
              id={collarsId}
              type="checkbox"
              className="accent-[var(--accent-primary)] w-4 h-4 rounded cursor-pointer shrink-0"
              checked={includeCollars}
              onChange={(e) => setIncludeCollars(e.target.checked)}
            />
            <span className="text-xs font-semibold text-gray-300">
              Collares ({unit === 'kg' ? '2.5 kg par' : '5 lbs par'})
            </span>
          </label>
        </div>
      </div>

      {/* QUICK STEPPERS */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
          Ajuste rápido:
        </span>
        {[-20, -10, -2.5, 2.5, 10, 20].map((delta) => (
          <button
            key={delta}
            type="button"
            onClick={() => adjustWeight(delta)}
            className="flex items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/25 text-white shadow-sm cursor-pointer shrink-0"
          >
            {delta > 0 ? (
              <Plus size={11} className="text-emerald-400" />
            ) : (
              <Minus size={11} className="text-rose-400" />
            )}
            {Math.abs(delta)} {unit}
          </button>
        ))}
      </div>

      {/* KPI HERO STATUS */}
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 backdrop-blur-2xl bg-gradient-to-br from-[var(--accent-primary)]/15 via-white/[0.04] to-black/60 border border-[var(--accent-primary)]/30 shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_25px_var(--accent-glow),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[11px] font-bold tracking-wider uppercase text-[var(--accent-primary)] mb-2">
            <Disc size={11} />
            Carga por cada lado
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black text-white font-display tracking-tight drop-shadow-[0_2px_15px_rgba(0,133,255,0.35)]">
              {result.weightPerSide}
            </span>
            <span className="text-xl sm:text-2xl font-semibold text-gray-400"> {unit}</span>
          </div>
          <div className="text-xs text-gray-300 mt-2.5 flex flex-wrap items-center gap-3">
            <span>
              Total barra + discos:{' '}
              <strong className="text-white font-display font-bold">
                {result.actualTotalWeight} {unit}
              </strong>
            </span>
            {result.isExact ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                <CheckCircle size={12} />✓ Carga Exacta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                <AlertTriangle size={12} />⚠ Diferencia de {Math.abs(result.difference)} {unit}
              </span>
            )}
          </div>
        </div>

        {/* Quick summary per side badge list */}
        <div className="relative z-10 flex flex-wrap gap-2 justify-start md:justify-end">
          {result.platesPerSide.length === 0 ? (
            <span className="text-xs text-gray-400 italic bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              Solo la barra sin discos
            </span>
          ) : (
            result.platesPerSide.map((p: PlateCount) => (
              <span
                key={p.plate.weight}
                className="px-3 py-1.5 rounded-xl text-xs font-black font-display tracking-wide border border-black/40 shadow-lg backdrop-blur-sm"
                style={{
                  backgroundColor: p.plate.color,
                  color: p.plate.textColor || '#FFFFFF',
                  boxShadow: `0 4px 12px ${p.plate.color}40`,
                }}
              >
                {p.countPerSide} × {p.plate.label}
              </span>
            ))
          )}
        </div>
      </div>

      {/* SVG COMPETITION BARBELL VISUALIZER */}
      <div className="p-6 rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center overflow-x-auto">
        <svg
          viewBox="0 0 460 130"
          className="w-full max-w-xl h-32"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="barbellSleeve" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E4E4E7" />
              <stop offset="30%" stopColor="#A1A1AA" />
              <stop offset="70%" stopColor="#71717A" />
              <stop offset="100%" stopColor="#3F3F46" />
            </linearGradient>
            <linearGradient id="barbellShaft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#71717A" />
              <stop offset="50%" stopColor="#52525B" />
              <stop offset="100%" stopColor="#27272A" />
            </linearGradient>
          </defs>

          {/* Barra central (lado izquierdo) */}
          <rect x="0" y="56" width="50" height="18" fill="url(#barbellShaft)" rx="2" />
          <line
            x1="12"
            y1="56"
            x2="12"
            y2="74"
            stroke="#A1A1AA"
            strokeDasharray="2,2"
            strokeWidth="1"
          />

          {/* Collar interior (tope de la manga) */}
          <rect
            x="50"
            y="38"
            width="15"
            height="54"
            fill="url(#barbellSleeve)"
            stroke="#27272A"
            strokeWidth="1.5"
            rx="3"
          />

          {/* Manga olímpica con acabado metálico */}
          <rect
            x="65"
            y="50"
            width="390"
            height="30"
            fill="url(#barbellSleeve)"
            stroke="#27272A"
            strokeWidth="1"
            rx="2"
          />

          {/* Renderizado de discos cargados */}
          {(() => {
            let currentX = 73;
            const elements: React.JSX.Element[] = [];

            result.platesPerSide.forEach((p: PlateCount) => {
              for (let i = 0; i < p.countPerSide; i++) {
                const h = getPlateVisualHeight(p.plate.weight);
                const w = getPlateVisualWidth(p.plate.weight);
                const y = (130 - h) / 2;

                elements.push(
                  <g key={`${p.plate.weight}-${i}`}>
                    {/* Sombra del disco */}
                    <rect
                      x={currentX + 1}
                      y={y}
                      width={w}
                      height={h}
                      fill="rgba(0,0,0,0.5)"
                      rx="4"
                    />
                    {/* Cuerpo del disco */}
                    <rect
                      x={currentX}
                      y={y}
                      width={w}
                      height={h}
                      fill={p.plate.color}
                      stroke={p.plate.border || '#18181b'}
                      strokeWidth="1.5"
                      rx="4"
                    />
                    {/* Borde biselado interior */}
                    <rect
                      x={currentX + 2}
                      y={y + 3}
                      width={w - 4}
                      height={h - 6}
                      fill="none"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1"
                      rx="2"
                    />
                    {/* Texto del peso dentro del disco si cabe */}
                    {h >= 64 && (
                      <text
                        x={currentX + w / 2}
                        y={68}
                        fill={p.plate.textColor || '#FFFFFF'}
                        fontSize="10"
                        fontWeight="900"
                        fontFamily="var(--font-display, sans-serif)"
                        textAnchor="middle"
                        transform={`rotate(-90 ${currentX + w / 2} 68)`}
                      >
                        {p.plate.weight}
                      </text>
                    )}
                  </g>,
                );
                currentX += w + 4;
              }
            });

            // Cierre / Collar exterior si está activo
            if (includeCollars) {
              elements.push(
                <rect
                  key="collar"
                  x={currentX + 2}
                  y="45"
                  width="12"
                  height="40"
                  fill="#F3F4F6"
                  stroke="#374151"
                  strokeWidth="1.5"
                  rx="3"
                />,
              );
            }

            return elements;
          })()}
        </svg>
      </div>

      {/* DETAILED LIST BREAKDOWN */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} className="text-[var(--accent-primary)]" />
          Desglose para montar por cada extremo:
        </h4>
        {result.platesPerSide.length === 0 ? (
          <p className="text-xs text-gray-400 bg-white/5 p-4 rounded-2xl border border-white/5">
            No se requieren discos adicionales. El peso deseado corresponde únicamente a la barra.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {result.platesPerSide.map((p: PlateCount) => (
              <li
                key={p.plate.weight}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-white/20 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0 shadow-md"
                    style={{ backgroundColor: p.plate.color }}
                  />
                  <span className="font-bold text-white text-sm">
                    {p.countPerSide} × disco de {p.plate.label}
                  </span>
                </div>
                <span className="text-gray-400 font-semibold font-display text-sm">
                  {p.countPerSide * p.plate.weight} {unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
