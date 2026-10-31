import { useState } from 'react';
import { Copy } from 'lucide-react';
import { formatPace, parsePace } from '../../utils/fitnessCalculators';
import { useUnitConversion } from './useUnitConversion';

type UnitCategory = 'weight' | 'height' | 'distance' | 'pace';

interface UnitConverterProps {
  defaultCategory?: UnitCategory;
}

export default function UnitConverter({ defaultCategory = 'weight' }: UnitConverterProps) {
  const [category, setCategory] = useState<UnitCategory>(defaultCategory);

  const {
    kgVal,
    lbsVal,
    stonesVal,
    stoneLbsVal,
    cmVal,
    inVal,
    feetVal,
    feetInVal,
    kmVal,
    miVal,
    paceMin,
    paceSec,
    paceMiMin,
    paceMiSec,
    speedKmhVal,
    speedMphVal,
    input1Id,
    input2Id,
    copyToClipboard,
    handleKgChange,
    handleLbsChange,
    handleStoneChange,
    handleCmChange,
    handleInchesChange,
    handleFeetInchesChange,
    handleKmChange,
    handleMilesChange,
    handlePaceKmChange,
    handleSpeedKmhChange,
  } = useUnitConversion();

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-300 leading-relaxed">
        Conversor bidireccional instantáneo para medidas de entrenamiento y nutrición: peso,
        estatura, distancias y ritmos de carrera a velocidad.
      </p>

      <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setCategory('weight')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            category === 'weight'
              ? 'bg-[var(--accent-primary,#e11d48)] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Peso (kg / lbs / stone)
        </button>
        <button
          type="button"
          onClick={() => setCategory('height')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            category === 'height'
              ? 'bg-[var(--accent-primary,#e11d48)] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Altura (cm / ft+in)
        </button>
        <button
          type="button"
          onClick={() => setCategory('distance')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            category === 'distance'
              ? 'bg-[var(--accent-primary,#e11d48)] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Distancia (km / mi)
        </button>
        <button
          type="button"
          onClick={() => setCategory('pace')}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            category === 'pace'
              ? 'bg-[var(--accent-primary,#e11d48)] text-white shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Ritmo y Velocidad (min/km ↔ km/h)
        </button>
      </div>

      <div role="status" aria-live="polite">
        {category === 'weight' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor={input1Id} className="block text-xs font-bold text-gray-200">
                Kilogramos (kg)
              </label>
              <div className="flex gap-2">
                <input
                  id={input1Id}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                  value={kgVal}
                  onChange={(e) => handleKgChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${kgVal} kg`, 'kg')}
                  className="px-2.5 bg-white/10 hover:bg-white/20 text-xs rounded-xl text-gray-300"
                  title="Copiar kg"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor={input2Id} className="block text-xs font-bold text-gray-200">
                Libras (lbs)
              </label>
              <div className="flex gap-2">
                <input
                  id={input2Id}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                  value={lbsVal}
                  onChange={(e) => handleLbsChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${lbsVal} lbs`, 'lbs')}
                  className="px-2.5 bg-white/10 hover:bg-white/20 text-xs rounded-xl text-gray-300"
                  title="Copiar lbs"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-gray-200">
                Stones &amp; Pounds (UK)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="weight-st" className="text-[10px] text-gray-400 block mb-0.5">
                    st
                  </label>
                  <input
                    id="weight-st"
                    type="number"
                    inputMode="numeric"
                    aria-label="Piedras (stones)"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={stonesVal}
                    onChange={(e) => handleStoneChange(e.target.value, stoneLbsVal)}
                  />
                </div>
                <div>
                  <label htmlFor="weight-st-lbs" className="text-[10px] text-gray-400 block mb-0.5">
                    lbs
                  </label>
                  <input
                    id="weight-st-lbs"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    aria-label="Libras adicionales (st)"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={stoneLbsVal}
                    onChange={(e) => handleStoneChange(stonesVal, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {category === 'height' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor="h-cm" className="block text-xs font-bold text-gray-200">
                Centímetros (cm)
              </label>
              <div className="flex gap-2">
                <input
                  id="h-cm"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                  value={cmVal}
                  onChange={(e) => handleCmChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${cmVal} cm`, 'cm')}
                  className="px-2.5 bg-white/10 hover:bg-white/20 text-xs rounded-xl text-gray-300"
                  title="Copiar cm"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor="h-in" className="block text-xs font-bold text-gray-200">
                Pulgadas (in)
              </label>
              <div className="flex gap-2">
                <input
                  id="h-in"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                  value={inVal}
                  onChange={(e) => handleInchesChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${inVal} in`, 'in')}
                  className="px-2.5 bg-white/10 hover:bg-white/20 text-xs rounded-xl text-gray-300"
                  title="Copiar in"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-gray-200">
                Pies y Pulgadas (ft &apos; in &quot;)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="height-ft" className="text-[10px] text-gray-400 block mb-0.5">
                    Pies (ft)
                  </label>
                  <input
                    id="height-ft"
                    type="number"
                    inputMode="numeric"
                    aria-label="Pies (ft)"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={feetVal}
                    onChange={(e) => handleFeetInchesChange(e.target.value, feetInVal)}
                  />
                </div>
                <div>
                  <label htmlFor="height-in" className="text-[10px] text-gray-400 block mb-0.5">
                    Pulgadas (in)
                  </label>
                  <input
                    id="height-in"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    aria-label="Pulgadas adicionales (in)"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={feetInVal}
                    onChange={(e) => handleFeetInchesChange(feetVal, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {category === 'distance' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor="dist-km" className="block text-xs font-bold text-gray-200">
                Kilómetros (km)
              </label>
              <div className="flex gap-2">
                <input
                  id="dist-km"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                  value={kmVal}
                  onChange={(e) => handleKmChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${kmVal} km`, 'km')}
                  className="px-2.5 bg-white/10 hover:bg-white/20 text-xs rounded-xl text-gray-300"
                  title="Copiar km"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor="dist-mi" className="block text-xs font-bold text-gray-200">
                Millas (mi)
              </label>
              <div className="flex gap-2">
                <input
                  id="dist-mi"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                  value={miVal}
                  onChange={(e) => handleMilesChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${miVal} mi`, 'millas')}
                  className="px-2.5 bg-white/10 hover:bg-white/20 text-xs rounded-xl text-gray-300"
                  title="Copiar millas"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {category === 'pace' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-gray-200">Ritmo (min/km)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pace-km-min" className="text-[10px] text-gray-400 block mb-0.5">
                    Min
                  </label>
                  <input
                    id="pace-km-min"
                    type="number"
                    inputMode="numeric"
                    aria-label="Minutos por kilómetro"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={paceMin}
                    onChange={(e) => handlePaceKmChange(e.target.value, paceSec)}
                  />
                </div>
                <div>
                  <label htmlFor="pace-km-sec" className="text-[10px] text-gray-400 block mb-0.5">
                    Seg
                  </label>
                  <input
                    id="pace-km-sec"
                    type="number"
                    inputMode="numeric"
                    max="59"
                    aria-label="Segundos por kilómetro"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={paceSec}
                    onChange={(e) => handlePaceKmChange(paceMin, e.target.value)}
                  />
                </div>
              </div>
              <span className="text-[11px] text-gray-400 block">
                {formatPace(parsePace(parseInt(paceMin, 10) || 0, parseInt(paceSec, 10) || 0))} /km
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-gray-200">Ritmo (min/mi)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pace-mi-min" className="text-[10px] text-gray-400 block mb-0.5">
                    Min
                  </label>
                  <input
                    id="pace-mi-min"
                    type="number"
                    inputMode="numeric"
                    aria-label="Minutos por milla (calculado)"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={paceMiMin}
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="pace-mi-sec" className="text-[10px] text-gray-400 block mb-0.5">
                    Seg
                  </label>
                  <input
                    id="pace-mi-sec"
                    type="number"
                    inputMode="numeric"
                    aria-label="Segundos por milla (calculado)"
                    className="w-full px-2 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-base"
                    value={paceMiSec}
                    readOnly
                  />
                </div>
              </div>
              <span className="text-[11px] text-gray-400 block">
                {formatPace(parsePace(parseInt(paceMiMin, 10) || 0, parseInt(paceMiSec, 10) || 0))}{' '}
                /mi
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor="spd-kmh" className="block text-xs font-bold text-gray-200">
                Velocidad (km/h)
              </label>
              <input
                id="spd-kmh"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                value={speedKmhVal}
                onChange={(e) => handleSpeedKmhChange(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <label htmlFor="spd-mph" className="block text-xs font-bold text-gray-200">
                Velocidad (mph)
              </label>
              <input
                id="spd-mph"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white font-bold text-lg"
                value={speedMphVal}
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
