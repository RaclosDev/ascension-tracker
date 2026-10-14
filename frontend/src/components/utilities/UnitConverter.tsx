import { useState, useId } from 'react';
import toast from 'react-hot-toast';
import { Scale, Ruler, Activity, Timer, Copy } from 'lucide-react';
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

  const handleStoneChange = (st: string, extraLbs: string) => {
    setStonesVal(st);
    setStoneLbsVal(extraLbs);
    const stonesNum = parseInt(st, 10) || 0;
    const extraLbsNum = parseFloat(extraLbs) || 0;
    if (stonesNum >= 0 && extraLbsNum >= 0) {
      const kg = stoneLbsToKg(stonesNum, extraLbsNum);
      setKgVal(String(kg));
      setLbsVal(String(kgToLbs(kg)));
    }
  };

  // Handlers para Altura
  const handleCmChange = (val: string) => {
    setCmVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setInVal(String(cmToInches(num)));
      const fi = cmToFeetInches(num);
      setFeetVal(String(fi.feet));
      setFeetInVal(String(fi.inches));
    }
  };

  const handleInchesChange = (val: string) => {
    setInVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const cm = inchesToCm(num);
      setCmVal(String(cm));
      const fi = cmToFeetInches(cm);
      setFeetVal(String(fi.feet));
      setFeetInVal(String(fi.inches));
    }
  };

  const handleFeetInchesChange = (ft: string, inc: string) => {
    setFeetVal(ft);
    setFeetInVal(inc);
    const ftNum = parseInt(ft, 10) || 0;
    const incNum = parseFloat(inc) || 0;
    if (ftNum >= 0 && incNum >= 0) {
      const cm = feetInchesToCm(ftNum, incNum);
      setCmVal(String(cm));
      setInVal(String(cmToInches(cm)));
    }
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

  // Handlers para Ritmo
  const handlePaceKmChange = (min: string, sec: string) => {
    setPaceMin(min);
    setPaceSec(sec);
    const m = parseInt(min, 10) || 0;
    const s = parseInt(sec, 10) || 0;
    const totalSecPerKm = parsePace(m, s);

    if (totalSecPerKm > 0) {
      const secPerMile = paceKmToPaceMiles(totalSecPerKm);
      setPaceMiMin(String(Math.floor(secPerMile / 60)));
      setPaceMiSec(String(Math.round(secPerMile % 60)));

      const kmh = paceToSpeedKmh(totalSecPerKm);
      setSpeedKmhVal(String(kmh));
      setSpeedMphVal(String(kmhToMph(kmh)));
    }
  };

  const handleSpeedKmhChange = (val: string) => {
    setSpeedKmhVal(val);
    const kmh = parseFloat(val);
    if (!isNaN(kmh) && kmh > 0) {
      setSpeedMphVal(String(kmhToMph(kmh)));
      const secPerKm = speedKmhToPace(kmh);
      setPaceMin(String(Math.floor(secPerKm / 60)));
      setPaceSec(String(Math.round(secPerKm % 60)));

      const secPerMile = paceKmToPaceMiles(secPerKm);
      setPaceMiMin(String(Math.floor(secPerMile / 60)));
      setPaceMiSec(String(Math.round(secPerMile % 60)));
    }
  };

  const CATEGORIES: { id: UnitCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'weight', label: 'Peso', icon: <Scale size={14} /> },
    { id: 'height', label: 'Altura', icon: <Ruler size={14} /> },
    { id: 'distance', label: 'Distancia', icon: <Activity size={14} /> },
    { id: 'pace', label: 'Ritmo / Velocidad', icon: <Timer size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        Conversión bidireccional instantánea de unidades biométricas entre el sistema métrico
        internacional y el sistema imperial/británico.
      </p>

      {/* CATEGORY TABS */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-white/10 text-white border border-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-glow)]'
                  : 'text-[var(--text-secondary)] hover:text-white border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-[var(--accent-primary)]' : 'opacity-60'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* CATEGORY PANELS */}
      <div role="status" aria-live="polite">
        {category === 'weight' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor={input1Id}
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Kilogramos (kg)
              </label>
              <div className="flex gap-2">
                <input
                  id={input1Id}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  value={kgVal}
                  onChange={(e) => handleKgChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${kgVal} kg`, 'kg')}
                  className="px-3 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shrink-0"
                  title="Copiar kg"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor={input2Id}
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Libras (lbs)
              </label>
              <div className="flex gap-2">
                <input
                  id={input2Id}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  value={lbsVal}
                  onChange={(e) => handleLbsChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${lbsVal} lbs`, 'lbs')}
                  className="px-3 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shrink-0"
                  title="Copiar lbs"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Stones &amp; Pounds (UK)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="weight-st"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    st
                  </label>
                  <input
                    id="weight-st"
                    type="number"
                    inputMode="numeric"
                    aria-label="Piedras (stones)"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                    value={stonesVal}
                    onChange={(e) => handleStoneChange(e.target.value, stoneLbsVal)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="weight-st-lbs"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    lbs
                  </label>
                  <input
                    id="weight-st-lbs"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    aria-label="Libras adicionales (st)"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
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
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor="h-cm"
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Centímetros (cm)
              </label>
              <div className="flex gap-2">
                <input
                  id="h-cm"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  value={cmVal}
                  onChange={(e) => handleCmChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${cmVal} cm`, 'cm')}
                  className="px-3 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shrink-0"
                  title="Copiar cm"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor="h-in"
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Pulgadas (in)
              </label>
              <div className="flex gap-2">
                <input
                  id="h-in"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  value={inVal}
                  onChange={(e) => handleInchesChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${inVal} in`, 'in')}
                  className="px-3 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shrink-0"
                  title="Copiar in"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Pies y Pulgadas (ft &apos; in &quot;)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="height-ft"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    Pies (ft)
                  </label>
                  <input
                    id="height-ft"
                    type="number"
                    inputMode="numeric"
                    aria-label="Pies (ft)"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                    value={feetVal}
                    onChange={(e) => handleFeetInchesChange(e.target.value, feetInVal)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="height-in"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    Pulgadas (in)
                  </label>
                  <input
                    id="height-in"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    aria-label="Pulgadas adicionales (in)"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
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
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor="dist-km"
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Kilómetros (km)
              </label>
              <div className="flex gap-2">
                <input
                  id="dist-km"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  value={kmVal}
                  onChange={(e) => handleKmChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${kmVal} km`, 'km')}
                  className="px-3 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shrink-0"
                  title="Copiar km"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor="dist-mi"
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Millas (mi)
              </label>
              <div className="flex gap-2">
                <input
                  id="dist-mi"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  value={miVal}
                  onChange={(e) => handleMilesChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${miVal} mi`, 'millas')}
                  className="px-3 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white rounded-xl border border-white/10 flex items-center justify-center transition-all shrink-0"
                  title="Copiar millas"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {category === 'pace' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Ritmo (min/km)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="pace-km-min"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    Min
                  </label>
                  <input
                    id="pace-km-min"
                    type="number"
                    inputMode="numeric"
                    aria-label="Minutos por kilómetro"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                    value={paceMin}
                    onChange={(e) => handlePaceKmChange(e.target.value, paceSec)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="pace-km-sec"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    Seg
                  </label>
                  <input
                    id="pace-km-sec"
                    type="number"
                    inputMode="numeric"
                    max="59"
                    aria-label="Segundos por kilómetro"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                    value={paceSec}
                    onChange={(e) => handlePaceKmChange(paceMin, e.target.value)}
                  />
                </div>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block font-medium">
                {formatPace(parsePace(parseInt(paceMin, 10) || 0, parseInt(paceSec, 10) || 0))} /km
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Ritmo (min/mi)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="pace-mi-min"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    Min
                  </label>
                  <input
                    id="pace-mi-min"
                    type="number"
                    inputMode="numeric"
                    aria-label="Minutos por milla (calculado)"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base opacity-90"
                    value={paceMiMin}
                    readOnly
                  />
                </div>
                <div>
                  <label
                    htmlFor="pace-mi-sec"
                    className="text-[10px] text-[var(--text-secondary)] block mb-1"
                  >
                    Seg
                  </label>
                  <input
                    id="pace-mi-sec"
                    type="number"
                    inputMode="numeric"
                    aria-label="Segundos por milla (calculado)"
                    className="w-full px-3 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-base opacity-90"
                    value={paceMiSec}
                    readOnly
                  />
                </div>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block font-medium">
                {formatPace(parsePace(parseInt(paceMiMin, 10) || 0, parseInt(paceMiSec, 10) || 0))}{' '}
                /mi
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor="spd-kmh"
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Velocidad (km/h)
              </label>
              <input
                id="spd-kmh"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                value={speedKmhVal}
                onChange={(e) => handleSpeedKmhChange(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label
                htmlFor="spd-mph"
                className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
              >
                Velocidad (mph)
              </label>
              <input
                id="spd-mph"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-display font-bold text-lg opacity-90"
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
