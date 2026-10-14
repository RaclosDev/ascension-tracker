import { useState, useId, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Activity, ChevronDown, Sparkles, HeartPulse } from 'lucide-react';
import api from '../../api/client';
import {
  calculateTdee,
  calculateWeyandSteps,
  calculateWeyandMetabolic,
  Sex,
  BmrFormulaType,
  CaloricGoal,
} from '../../utils/fitnessCalculators';

interface TdeeCalculatorProps {
  userDefaults?: {
    weightKg?: number;
    heightCm?: number;
    age?: number;
    sex?: Sex;
    activityFactor?: number;
  };
}

interface DashboardWeightData {
  currentWeight?: number;
}

interface UserSettingsData {
  age?: number;
  heightCm?: number;
  sex?: 'M' | 'F';
  activityFactor?: number;
}

export default function TdeeCalculator({ userDefaults }: TdeeCalculatorProps) {
  // Queries con fallback suave para auto-completar datos del usuario
  const { data: dashboardData } = useQuery<DashboardWeightData>({
    queryKey: ['dashboard'],
    queryFn: () =>
      api
        .get('/weights/dashboard')
        .then((r) => r.data)
        .catch(() => null),
  });

  const { data: settingsData } = useQuery<UserSettingsData>({
    queryKey: ['settings'],
    queryFn: () =>
      api
        .get('/settings')
        .then((r) => r.data)
        .catch(() => null),
  });

  const [sex, setSex] = useState<Sex>(userDefaults?.sex || 'M');
  const [age, setAge] = useState<string>(userDefaults?.age ? String(userDefaults.age) : '28');
  const [heightCm, setHeightCm] = useState<string>(
    userDefaults?.heightCm ? String(userDefaults.heightCm) : '175',
  );
  const [weightKg, setWeightKg] = useState<string>(
    userDefaults?.weightKg ? String(userDefaults.weightKg) : '75',
  );
  const [activityFactor, setActivityFactor] = useState<string>(
    userDefaults?.activityFactor ? String(userDefaults.activityFactor) : '1.55',
  );
  const [bodyFat, setBodyFat] = useState<string>('');
  const [formula, setFormula] = useState<BmrFormulaType>('mifflin');
  const [selectedGoal, setSelectedGoal] = useState<CaloricGoal>('maintenance');

  // Estado para sub-calculadoras Weyand
  const [showWeyand, setShowWeyand] = useState(false);
  const [weyandSteps, setWeyandSteps] = useState('10000');
  const [metabolicDistance, setMetabolicDistance] = useState('400');
  const [metabolicMinutes, setMetabolicMinutes] = useState('2');
  const [metabolicSeconds, setMetabolicSeconds] = useState('0');

  useEffect(() => {
    if (dashboardData?.currentWeight && !userDefaults?.weightKg) {
      setWeightKg(String(dashboardData.currentWeight));
    }
    if (settingsData) {
      if (settingsData.age && !userDefaults?.age) setAge(String(settingsData.age));
      if (settingsData.heightCm && !userDefaults?.heightCm)
        setHeightCm(String(settingsData.heightCm));
      if (settingsData.sex && !userDefaults?.sex) setSex(settingsData.sex);
      if (settingsData.activityFactor && !userDefaults?.activityFactor)
        setActivityFactor(String(settingsData.activityFactor));
    }
  }, [dashboardData, settingsData, userDefaults]);

  const sexId = useId();
  const weightId = useId();
  const heightId = useId();
  const ageId = useId();
  const activityId = useId();
  const bodyFatId = useId();
  const formulaId = useId();

  const numWeight = parseFloat(weightKg) || 0;
  const numHeight = parseFloat(heightCm) || 0;
  const numAge = parseInt(age, 10) || 0;
  const numActivity = parseFloat(activityFactor) || 1.55;
  const numBodyFat = bodyFat ? parseFloat(bodyFat) : undefined;

  const tdeeResult = useMemo(() => {
    return calculateTdee({
      weightKg: numWeight,
      heightCm: numHeight,
      age: numAge,
      sex,
      activityFactor: numActivity,
      bodyFatPercentage: numBodyFat,
      formula,
    });
  }, [numWeight, numHeight, numAge, sex, numActivity, numBodyFat, formula]);

  const numSteps = parseInt(weyandSteps, 10) || 0;
  const weyandStepsResult = useMemo(() => {
    return calculateWeyandSteps({
      weightKg: numWeight > 0 ? numWeight : 75,
      steps: numSteps,
    });
  }, [numWeight, numSteps]);

  const numDistance = parseFloat(metabolicDistance) || 0;
  const numMins = parseInt(metabolicMinutes, 10) || 0;
  const numSecs = parseInt(metabolicSeconds, 10) || 0;
  const totalSeconds = numMins * 60 + numSecs;

  const weyandMetabolicResult = useMemo(() => {
    return calculateWeyandMetabolic({
      weightKg: numWeight > 0 ? numWeight : 75,
      heightM: numHeight > 0 ? numHeight / 100 : 1.75,
      distanceM: numDistance,
      totalSeconds,
    });
  }, [numWeight, numHeight, numDistance, totalSeconds]);

  return (
    <div className="space-y-6">
      {/* FORM INPUTS - LIQUID GLASS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sexo */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={sexId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Sexo Biológico
          </label>
          <div className="relative flex items-center">
            <select
              id={sexId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
            >
              <option value="M" className="bg-[#14141e] text-white">
                Hombre
              </option>
              <option value="F" className="bg-[#14141e] text-white">
                Mujer
              </option>
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Peso corporal */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={weightId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Peso corporal (kg)
          </label>
          <div className="flex items-center justify-between">
            <input
              id={weightId}
              type="number"
              inputMode="decimal"
              step="0.1"
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

        {/* Altura */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={heightId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Altura (cm)
          </label>
          <div className="flex items-center justify-between">
            <input
              id={heightId}
              type="number"
              inputMode="decimal"
              step="0.5"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder="175"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              cm
            </span>
          </div>
        </div>

        {/* Edad */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={ageId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Edad (años)
          </label>
          <div className="flex items-center justify-between">
            <input
              id={ageId}
              type="number"
              inputMode="numeric"
              min="10"
              max="120"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder="28"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              años
            </span>
          </div>
        </div>

        {/* Nivel de Actividad */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={activityId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            Nivel de Actividad Diaria
          </label>
          <div className="relative flex items-center">
            <select
              id={activityId}
              className="w-full bg-transparent text-white font-medium text-sm focus:outline-none appearance-none cursor-pointer pr-6 truncate"
              value={activityFactor}
              onChange={(e) => setActivityFactor(e.target.value)}
            >
              <option value="1.2" className="bg-[#14141e] text-white">
                Sedentario (Oficina, poco ejercicio)
              </option>
              <option value="1.375" className="bg-[#14141e] text-white">
                Ligero (1-3 días/sem)
              </option>
              <option value="1.55" className="bg-[#14141e] text-white">
                Moderado (3-5 días/sem)
              </option>
              <option value="1.725" className="bg-[#14141e] text-white">
                Muy Activo (6-7 días/sem)
              </option>
              <option value="1.9" className="bg-[#14141e] text-white">
                Extremo (Atleta profesional)
              </option>
            </select>
            <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* % Grasa Corporal */}
        <div className="relative rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20 transition-all p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          <label
            htmlFor={bodyFatId}
            className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider"
          >
            % Grasa Corporal (Opcional)
          </label>
          <div className="flex items-center justify-between">
            <input
              id={bodyFatId}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="3"
              max="60"
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none placeholder:text-gray-600"
              placeholder="Ej: 15"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
            <span className="text-xs font-semibold text-gray-400 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              %
            </span>
          </div>
        </div>
      </div>

      {/* FORMULA TOGGLE ROW */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10">
        <div>
          <span className="text-xs font-bold text-white block">Fórmula de Metabolismo Basal</span>
          <span className="text-xs text-gray-400">
            Ajusta el método según tus datos antropométricos disponibles.
          </span>
        </div>
        <div className="relative flex items-center">
          <select
            id={formulaId}
            className="text-xs px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-medium focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none cursor-pointer pr-7"
            value={formula}
            onChange={(e) => setFormula(e.target.value as BmrFormulaType)}
          >
            <option value="mifflin" className="bg-[#14141e] text-white">
              Mifflin-St Jeor (Clínica moderna)
            </option>
            <option value="katch" className="bg-[#14141e] text-white">
              Katch-McArdle (Basada en Masa Magra)
            </option>
            <option value="harris" className="bg-[#14141e] text-white">
              Harris-Benedict revisado
            </option>
          </select>
          <ChevronDown size={13} className="text-gray-400 absolute right-2.5 pointer-events-none" />
        </div>
      </div>

      {/* KPI METRICS - DUAL GLOW HERO CARDS */}
      <div role="status" aria-live="polite" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card BMR */}
        <div className="relative overflow-hidden rounded-3xl p-6 backdrop-blur-2xl bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-black/60 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-2">
            <HeartPulse size={13} />
            Tasa Metabólica Basal (BMR)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white font-display tracking-tight">
              {tdeeResult.bmr}
            </span>
            <span className="text-sm font-semibold text-gray-400">kcal/día</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Energía consumida en reposo absoluto ({tdeeResult.formulaUsed}).
          </p>
        </div>

        {/* Card TDEE */}
        <div className="relative overflow-hidden rounded-3xl p-6 backdrop-blur-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 via-white/[0.04] to-black/60 border border-[var(--accent-primary)]/30 shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_20px_var(--accent-glow)]">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-2">
            <Flame size={13} />
            Gasto Energético Total (TDEE)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white font-display tracking-tight drop-shadow-[0_2px_15px_rgba(0,133,255,0.35)]">
              {tdeeResult.tdee}
            </span>
            <span className="text-sm font-semibold text-gray-400">kcal/día</span>
          </div>
          <p className="text-xs text-gray-300 mt-2">
            Calorías necesarias para mantener tu peso actual.
          </p>
        </div>
      </div>

      {/* CALORIC GOALS SELECTOR & SUMMARY */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} className="text-[var(--accent-primary)]" />
          Objetivos y Estrategias Calóricas
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {(Object.keys(tdeeResult.goals) as CaloricGoal[]).map((goalKey) => {
            const goal = tdeeResult.goals[goalKey];
            const isSelected = selectedGoal === goalKey;
            return (
              <button
                key={goalKey}
                type="button"
                onClick={() => setSelectedGoal(goalKey)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 backdrop-blur-md cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[var(--accent-primary)]/25 to-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-white shadow-[0_0_15px_var(--accent-glow)] scale-[1.02]'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-gray-300'
                }`}
              >
                <div className="text-xs font-bold truncate">{goal.label}</div>
                <div className="text-lg font-black text-white mt-1 font-display">
                  {goal.kcal} <span className="text-[10px] font-normal text-gray-400">kcal</span>
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 ${
                    goal.difference > 0
                      ? 'text-emerald-400'
                      : goal.difference < 0
                        ? 'text-amber-400'
                        : 'text-gray-400'
                  }`}
                >
                  {goal.difference > 0 ? `+${goal.difference}` : goal.difference} kcal
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* WEYAND ADVANCED BIOMECHANICS */}
      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowWeyand(!showWeyand)}
          className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors py-2 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--accent-primary)]" />
            Biomecánica Avanzada de Weyand (Pasos y Gasto Metabólico)
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${
              showWeyand ? 'rotate-180 text-[var(--accent-primary)]' : ''
            }`}
          />
        </button>

        {showWeyand && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            {/* Gasto por Pasos */}
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Gasto por Pasos (Weyand)
              </h5>
              <p className="text-xs text-gray-400">
                Estima la energía mecánica usada en cada impacto según la biomecánica de Weyand.
              </p>
              <div>
                <label
                  htmlFor="weyand-steps"
                  className="block text-[11px] font-semibold text-gray-400 mb-1"
                >
                  Pasos Totales
                </label>
                <input
                  id="weyand-steps"
                  aria-label="Pasos totales para cálculo Weyand"
                  type="number"
                  inputMode="numeric"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                  value={weyandSteps}
                  onChange={(e) => setWeyandSteps(e.target.value)}
                />
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">Pasos procesados:</span>
                  <span className="text-sm font-bold text-[var(--accent-primary)] font-display">
                    {numSteps.toLocaleString()} pasos
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block">Gasto estimado:</span>
                  <span className="text-lg font-black text-emerald-400 font-display">
                    {weyandStepsResult.toFixed(1)} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* Gasto por Carrera/Tiempo */}
            <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Coste Energético de Carrera
              </h5>
              <p className="text-xs text-gray-400">
                Calcula el consumo de oxígeno (VO2) y coste calórico neto en distancia.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label
                    htmlFor="weyand-dist"
                    className="block text-[11px] font-semibold text-gray-400 mb-1"
                  >
                    Metros
                  </label>
                  <input
                    id="weyand-dist"
                    aria-label="Distancia en metros para cálculo Weyand"
                    type="number"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                    value={metabolicDistance}
                    onChange={(e) => setMetabolicDistance(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="weyand-min"
                    className="block text-[11px] font-semibold text-gray-400 mb-1"
                  >
                    Minutos
                  </label>
                  <input
                    id="weyand-min"
                    aria-label="Minutos de tiempo para cálculo Weyand"
                    type="number"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                    value={metabolicMinutes}
                    onChange={(e) => setMetabolicMinutes(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="weyand-sec"
                    className="block text-[11px] font-semibold text-gray-400 mb-1"
                  >
                    Segundos
                  </label>
                  <input
                    id="weyand-sec"
                    aria-label="Segundos de tiempo para cálculo Weyand"
                    type="number"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                    value={metabolicSeconds}
                    onChange={(e) => setMetabolicSeconds(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-400 block">VO2 Consumido:</span>
                  <span className="text-sm font-bold text-[var(--accent-primary)] font-display">
                    {weyandMetabolicResult.vo2.toFixed(2)} ml/kg/min
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400 block">Gasto Total:</span>
                  <span className="text-lg font-black text-emerald-400 font-display">
                    {weyandMetabolicResult.kcal.toFixed(2)} kcal
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
