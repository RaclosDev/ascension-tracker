import { useState, useId } from 'react';
import toast from 'react-hot-toast';
import {
  kgToLbs,
  lbsToKg,
  kgToStoneLbs,
  stoneLbsToKg,
  cmToInches,
  inchesToCm,
  cmToFeetInches,
  feetInchesToCm,
  kmToMiles,
  milesToKm,
  paceKmToPaceMiles,
  paceToSpeedKmh,
  speedKmhToPace,
  kmhToMph,
  formatPace,
  parsePace,
} from '../../utils/fitnessCalculators';

type UnitCategory = 'weight' | 'height' | 'distance' | 'pace';

interface UnitConverterProps {
  defaultCategory?: UnitCategory;
}

export default function UnitConverter({ defaultCategory = 'weight' }: UnitConverterProps) {
  const [category, setCategory] = useState<UnitCategory>(defaultCategory);

  // PESO
  const [kgVal, setKgVal] = useState('75');
  const [lbsVal, setLbsVal] = useState('165.35');
  const [stonesVal, setStonesVal] = useState('11');
  const [stoneLbsVal, setStoneLbsVal] = useState('11.3');

  // ALTURA / LONGITUD
  const [cmVal, setCmVal] = useState('178');
  const [inVal, setInVal] = useState('70.08');
  const [feetVal, setFeetVal] = useState('5');
  const [feetInVal, setFeetInVal] = useState('10.1');

  // DISTANCIA
  const [kmVal, setKmVal] = useState('10');
  const [miVal, setMiVal] = useState('6.21');

  // RITMO Y VELOCIDAD
  const [paceMin, setPaceMin] = useState('5');
  const [paceSec, setPaceSec] = useState('0');
  const [paceMiMin, setPaceMiMin] = useState('8');
  const [paceMiSec, setPaceMiSec] = useState('3');
  const [speedKmhVal, setSpeedKmhVal] = useState('12');
  const [speedMphVal, setSpeedMphVal] = useState('7.46');

  const input1Id = useId();
  const input2Id = useId();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copiado: ${text} (${label})`);
  };

  // Handlers para Peso
  const handleKgChange = (val: string) => {
    setKgVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setLbsVal(String(kgToLbs(num)));
      const st = kgToStoneLbs(num);
      setStonesVal(String(st.stones));
      setStoneLbsVal(String(st.pounds));
    }
  };

  const handleLbsChange = (val: string) => {
    setLbsVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const kg = lbsToKg(num);
      setKgVal(String(kg));
      const st = kgToStoneLbs(kg);
      setStonesVal(String(st.stones));
      setStoneLbsVal(String(st.pounds));
    }
  };

  const handleStoneChange = (st: string, lb: string) => {
    setStonesVal(st);
    setStoneLbsVal(lb);
    const numSt = parseFloat(st) || 0;
    const numLb = parseFloat(lb) || 0;
    const kg = stoneLbsToKg(numSt, numLb);
    setKgVal(String(kg));
    setLbsVal(String(kgToLbs(kg)));
  };

  // Handlers para Altura
  const handleCmChange = (val: string) => {
    setCmVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setInVal(String(cmToInches(num)));
      const ftIn = cmToFeetInches(num);
      setFeetVal(String(ftIn.feet));
      setFeetInVal(String(ftIn.inches));
    }
  };

  const handleInchesChange = (val: string) => {
    setInVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const cm = inchesToCm(num);
      setCmVal(String(cm));
      const ftIn = cmToFeetInches(cm);
      setFeetVal(String(ftIn.feet));
      setFeetInVal(String(ftIn.inches));
    }
  };

  const handleFeetInchesChange = (ft: string, inc: string) => {
    setFeetVal(ft);
    setFeetInVal(inc);
    const numFt = parseFloat(ft) || 0;
    const numIn = parseFloat(inc) || 0;
    const cm = feetInchesToCm(numFt, numIn);
    setCmVal(String(cm));
    setInVal(String(cmToInches(cm)));
  };

  // Handlers para Distancia
  const handleKmChange = (val: string) => {
    setKmVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setMiVal(String(kmToMiles(num)));
    }
  };

  const handleMilesChange = (val: string) => {
    setMiVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setKmVal(String(milesToKm(num)));
    }
  };

  // Handlers para Ritmo / Velocidad
  const handlePaceKmChange = (m: string, s: string) => {
    setPaceMin(m);
    setPaceSec(s);
    const paceDec = parsePace(parseInt(m, 10) || 0, parseInt(s, 10) || 0);
    if (paceDec > 0) {
      const paceMiDec = paceKmToPaceMiles(paceDec);
      const miMin = Math.floor(paceMiDec);
      const miSec = Math.round((paceMiDec - miMin) * 60);
      setPaceMiMin(String(miMin));
      setPaceMiSec(String(miSec));

      const spdKmh = paceToSpeedKmh(paceDec);
      setSpeedKmhVal(String(spdKmh));
      setSpeedMphVal(String(kmhToMph(spdKmh)));
    }
  };

  const handleSpeedKmhChange = (val: string) => {
    setSpeedKmhVal(val);
    const spd = parseFloat(val);
    if (!isNaN(spd) && spd > 0) {
      setSpeedMphVal(String(kmhToMph(spd)));
      const pace = speedKmhToPace(spd);
      const m = Math.floor(pace);
      const s = Math.round((pace - m) * 60);
      setPaceMin(String(m));
      setPaceSec(String(s));

      const paceMi = paceKmToPaceMiles(pace);
      const miM = Math.floor(paceMi);
      const miS = Math.round((paceMi - miM) * 60);
      setPaceMiMin(String(miM));
      setPaceMiSec(String(miS));
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-300 leading-relaxed">
        Conversor bidireccional instantáneo para medidas de entrenamiento y nutrición: peso,
        estatura, distancias y ritmos de carrera a velocidad.
      </p>

      {/* CATEGORY SELECTOR */}
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
          ⚖️ Peso (kg / lbs / stone)
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
          📏 Altura (cm / ft+in)
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
          🏃 Distancia (km / mi)
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
          ⏱️ Ritmo y Velocidad (min/km ↔ km/h)
        </button>
      </div>

      {/* CATEGORY PANELS */}
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
                  📋
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
                  📋
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
                  📋
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
                  📋
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
                  📋
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
                  📋
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
