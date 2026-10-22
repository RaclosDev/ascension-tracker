import { useState, useId, useMemo } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
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

  // Altura visual relativa para los discos en el SVG según su peso
  const getPlateVisualHeight = (weight: number): number => {
    if (weight >= 10) return 90; // Diámetro olímpico reglamentario 450mm
    if (weight === 5) return 72;
    if (weight === 2.5) return 60;
    if (weight === 1.25) return 48;
    return 38; // 0.5 kg
  };

  const getPlateVisualWidth = (weight: number): number => {
    if (weight >= 20) return 18;
    if (weight >= 10) return 14;
    if (weight >= 5) return 10;
    return 8;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-300 leading-relaxed">
        Distribuye de forma óptima los discos en la barra olímpica por lado utilizando el código
        oficial de colores de la IWF (Federación Internacional de Halterofilia).
      </p>

      {/* FORM INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor={targetId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Peso total objetivo ({unit})
          </label>
          <input
            id={targetId}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder={unit === 'kg' ? 'Ej: 100' : 'Ej: 225'}
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={barId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Tipo de Barra ({unit})
          </label>
          <select
            id={barId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={barWeight}
            onChange={(e) => setBarWeight(parseFloat(e.target.value))}
          >
            {unit === 'kg' ? (
              <>
                <option value="20">Olímpica estándar (20 kg)</option>
                <option value="15">Olímpica femenina (15 kg)</option>
                <option value="10">Técnica / Entrenamiento (10 kg)</option>
                <option value="25">Barra de sentadilla / Powerlifting (25 kg)</option>
              </>
            ) : (
              <>
                <option value="45">Olímpica estándar (45 lbs)</option>
                <option value="35">Olímpica femenina (35 lbs)</option>
                <option value="25">Técnica (25 lbs)</option>
                <option value="55">Powerlifting (55 lbs)</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label htmlFor={unitId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Sistema de Unidades
          </label>
          <select
            id={unitId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={unit}
            onChange={(e) => {
              const newUnit = e.target.value as 'kg' | 'lbs';
              setUnit(newUnit);
              setBarWeight(newUnit === 'kg' ? 20 : 45);
            }}
          >
            <option value="kg">Kilogramos (kg - IWF)</option>
            <option value="lbs">Libras (lbs)</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <label
            htmlFor={collarsId}
            className="flex items-center gap-2 px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white cursor-pointer select-none"
          >
            <input
              id={collarsId}
              type="checkbox"
              className="accent-[var(--accent-primary,#e11d48)] w-4 h-4 rounded"
              checked={includeCollars}
              onChange={(e) => setIncludeCollars(e.target.checked)}
            />
            <span className="text-xs font-medium">
              Incluir collares ({unit === 'kg' ? '2.5 kg par' : '5 lbs par'})
            </span>
          </label>
        </div>
      </div>

      {/* KPI STATUS */}
      <div
        role="status"
        aria-live="polite"
        className="p-5 rounded-2xl bg-gradient-to-br from-[var(--accent-glow)] via-black/30 to-black/40 border border-[var(--accent-primary)]/20 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div>
          <span className="text-xs font-semibold text-[var(--accent-primary-light)]">
            Carga por cada lado
          </span>
          <div className="text-4xl font-extrabold text-white mt-1">
            {result.weightPerSide} <span className="text-lg font-normal text-gray-400">{unit}</span>
          </div>
          <div className="text-xs text-gray-300 mt-1 flex items-center gap-2">
            <span>
              Total barra + discos:{' '}
              <strong className="text-white">
                {result.actualTotalWeight} {unit}
              </strong>
            </span>
            {result.isExact ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--accent-glow)] text-[var(--accent-primary-light)] border border-[var(--accent-primary)]/30 inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Carga exacta
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                <AlertTriangle size={12} /> Diferencia de {Math.abs(result.difference)} {unit}
              </span>
            )}
          </div>
        </div>

        {/* Quick summary per side badge list */}
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
          {result.platesPerSide.length === 0 ? (
            <span className="text-xs text-gray-400 italic">Solo la barra sin discos</span>
          ) : (
            result.platesPerSide.map((p: PlateCount) => (
              <span
                key={p.plate.weight}
                style={{
                  backgroundColor: p.plate.color,
                  color: p.plate.textColor || '#FFFFFF',
                  borderColor: p.plate.border || 'transparent',
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm"
              >
                {p.countPerSide}× {p.plate.label}
              </span>
            ))
          )}
        </div>
      </div>

      {/* SVG BARBELL VISUALIZER */}
      <div className="p-4 rounded-xl border border-white/10 bg-[#121214] flex flex-col items-center overflow-x-auto">
        <span className="text-xs font-semibold text-gray-400 mb-2 self-start">
          Esquema visual de la manga (Carga por lado)
        </span>
        <svg
          viewBox="0 0 460 120"
          className="w-full max-w-lg h-32 select-none"
          role="img"
          aria-label="Visualización gráfica de los discos cargados en la barra olímpica"
        >
          {/* Eje central de la barra (acero) */}
          <rect x="0" y="54" width="460" height="12" fill="#4B5563" rx="2" />

          {/* Tope / Collar interior de la manga */}
          <rect
            x="50"
            y="35"
            width="14"
            height="50"
            fill="#9CA3AF"
            rx="2"
            stroke="#374151"
            strokeWidth="1"
          />
          <rect x="64" y="48" width="390" height="24" fill="#6B7280" rx="1" />

          {/* Renderizado de discos cargados en la manga de izquierda a derecha */}
          {(() => {
            let currentX = 72;
            const elements: React.JSX.Element[] = [];

            // Discos
            result.platesPerSide.forEach((p: PlateCount) => {
              for (let i = 0; i < p.countPerSide; i++) {
                const h = getPlateVisualHeight(p.plate.weight);
                const w = getPlateVisualWidth(p.plate.weight);
                const y = (120 - h) / 2;

                elements.push(
                  <g key={`${p.plate.weight}-${i}`}>
                    <rect
                      x={currentX}
                      y={y}
                      width={w}
                      height={h}
                      fill={p.plate.color}
                      stroke={p.plate.border || '#000000'}
                      strokeWidth="1.5"
                      rx="3"
                    />
                    {/* Texto del peso dentro del disco si cabe */}
                    {h >= 60 && (
                      <text
                        x={currentX + w / 2}
                        y={64}
                        fill={p.plate.textColor || '#FFFFFF'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        transform={`rotate(-90 ${currentX + w / 2} 64)`}
                      >
                        {p.plate.weight}
                      </text>
                    )}
                  </g>,
                );
                currentX += w + 3;
              }
            });

            // Cierre / Collar exterior si está activo
            if (includeCollars) {
              elements.push(
                <rect
                  key="collar"
                  x={currentX + 2}
                  y="42"
                  width="10"
                  height="36"
                  fill="#E5E7EB"
                  stroke="#374151"
                  strokeWidth="1"
                  rx="2"
                />,
              );
            }

            return elements;
          })()}
        </svg>
      </div>

      {/* DETAILED LIST BREAKDOWN */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-300">
          Desglose para montar por cada extremo:
        </h4>
        {result.platesPerSide.length === 0 ? (
          <p className="text-xs text-gray-400">
            No se requieren discos adicionales. El peso deseado corresponde únicamente a la barra.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {result.platesPerSide.map((p: PlateCount) => (
              <li
                key={p.plate.weight}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0"
                    style={{ backgroundColor: p.plate.color }}
                  />
                  <span className="font-semibold text-white">
                    {p.countPerSide} × disco de {p.plate.label}
                  </span>
                </div>
                <span className="text-gray-400">
                  Total lado: {p.countPerSide * p.plate.weight} {unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
