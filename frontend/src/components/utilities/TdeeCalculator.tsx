import { useState, useId, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Estado para sub-calculadoras Weyand (Retrocompatibilidad total)
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
  const ageId = useId();
  const heightId = useId();
  const weightId = useId();
  const activityId = useId();
  const bodyFatId = useId();
  const formulaId = useId();

  const numWeight = parseFloat(weightKg) || 0;
  const numHeight = parseFloat(heightCm) || 0;
  const numAge = parseInt(age, 10) || 0;
  const numFactor = parseFloat(activityFactor) || 1.2;
  const numBodyFat = bodyFat ? parseFloat(bodyFat) : undefined;

  const tdeeResult = useMemo(() => {
    return calculateTdee({
      sex,
      weightKg: numWeight,
      heightCm: numHeight,
      age: numAge,
      activityFactor: numFactor,
      bodyFatPercentage: numBodyFat,
      formula,
    });
  }, [sex, numWeight, numHeight, numAge, numFactor, numBodyFat, formula]);

  // Weyand calculations
  const weyandStepsKcal = useMemo(() => {
    const s = parseInt(weyandSteps, 10) || 0;
    return calculateWeyandSteps({ weightKg: numWeight, steps: s });
  }, [numWeight, weyandSteps]);

  const weyandMetabolicResult = useMemo(() => {
    const d = parseFloat(metabolicDistance) || 0;
    const m = parseInt(metabolicMinutes, 10) || 0;
    const s = parseInt(metabolicSeconds, 10) || 0;
    const totalSec = m * 60 + s;
    const heightM = numHeight / 100;
    return calculateWeyandMetabolic({
      weightKg: numWeight,
      heightM,
      distanceM: d,
      totalSeconds: totalSec,
    });
  }, [numWeight, numHeight, metabolicDistance, metabolicMinutes, metabolicSeconds]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-300 leading-relaxed">
        Calcula tu Metabolismo Basal (BMR), Gasto Energético Diario Total (TDEE) y objetivos
        calóricos para pérdida de grasa, mantenimiento o ganancia muscular.
      </p>

      {/* FORM INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor={sexId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Sexo Biológico
          </label>
          <select
            id={sexId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="M">Hombre</option>
            <option value="F">Mujer</option>
          </select>
        </div>

        <div>
          <label htmlFor={weightId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Peso corporal (kg)
          </label>
          <input
            id={weightId}
            type="number"
            inputMode="decimal"
            step="0.1"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="75.0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={heightId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Altura (cm)
          </label>
          <input
            id={heightId}
            type="number"
            inputMode="decimal"
            step="0.5"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="175"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={ageId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Edad (años)
          </label>
          <input
            id={ageId}
            type="number"
            inputMode="numeric"
            min="10"
            max="120"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="28"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={activityId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            Nivel de Actividad Diaria
          </label>
          <select
            id={activityId}
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            value={activityFactor}
            onChange={(e) => setActivityFactor(e.target.value)}
          >
            <option value="1.2">Sedentario (Trabajo de oficina, poco ejercicio)</option>
            <option value="1.375">Ligero (Ejercicio 1-3 días/sem)</option>
            <option value="1.55">Moderado (Entrenamiento 3-5 días/sem)</option>
            <option value="1.725">Muy Activo (Entrenamiento intenso 6-7 días/sem)</option>
            <option value="1.9">Extremo (Atleta profesional / Doble sesión)</option>
          </select>
        </div>

        <div>
          <label htmlFor={bodyFatId} className="block text-xs font-semibold text-gray-200 mb-1.5">
            % Grasa Corporal (Opcional)
          </label>
          <input
            id={bodyFatId}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="3"
            max="60"
            className="w-full px-3 py-2 bg-[#1C1C1E] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary,#e11d48)]"
            placeholder="Ej: 15 (Para Katch-McArdle)"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={formulaId} className="text-xs font-semibold text-gray-300">
          Fórmula metabólica:
        </label>
        <select
          id={formulaId}
          className="text-xs px-2.5 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white"
          value={formula}
          onChange={(e) => setFormula(e.target.value as BmrFormulaType)}
        >
          <option value="mifflin">Mifflin-St Jeor (Clínica moderna recomendada)</option>
          <option value="katch">Katch-McArdle (Basada en Masa Magra LBM)</option>
          <option value="harris">Harris-Benedict revisado</option>
        </select>
      </div>

      {/* KPI METRICS */}
      <div role="status" aria-live="polite" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/40 border border-purple-500/20">
          <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
            Tasa Metabólica Basal (BMR)
          </span>
          <div className="text-4xl font-extrabold text-white mt-1">
            {tdeeResult.bmr} <span className="text-lg font-normal text-gray-400">kcal/día</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Energía consumida en reposo absoluto ({tdeeResult.formulaUsed}).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-black/40 border border-emerald-500/20">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
            Gasto Energético Total (TDEE)
          </span>
          <div className="text-4xl font-extrabold text-white mt-1">
            {tdeeResult.tdee} <span className="text-lg font-normal text-gray-400">kcal/día</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Calorías necesarias para mantener tu peso actual.
          </p>
        </div>
      </div>

      {/* CALORIC GOALS SELECTOR & SUMMARY */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white tracking-wide">
          Objetivos y Estrategias Calóricas
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(tdeeResult.goals) as CaloricGoal[]).map((goalKey) => {
            const goal = tdeeResult.goals[goalKey];
            const isSelected = selectedGoal === goalKey;
            return (
              <button
                key={goalKey}
                type="button"
                onClick={() => setSelectedGoal(goalKey)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-semibold truncate">{goal.label}</div>
                <div className="text-base font-extrabold text-white mt-1">
                  {goal.kcal} <span className="text-[10px] font-normal text-gray-400">kcal</span>
                </div>
                <div
                  className={`text-[10px] font-medium mt-0.5 ${
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

      {/* RETROCOMPATIBILIDAD CON CALCULADORAS BIOMECÁNICAS WEYAND */}
      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowWeyand(!showWeyand)}
          className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-300 hover:text-white transition-colors"
        >
          <span>Biomecánica Avanzada de Weyand (Pasos y Gasto Metabólico)</span>
          <span className="text-xs text-gray-400">{showWeyand ? '▲ Ocultar' : '▼ Expandir'}</span>
        </button>

        {showWeyand && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            {/* Gasto por Pasos */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Gasto por Pasos (Weyand)
              </h5>
              <p className="text-xs text-gray-400">
                Estima la energía mecánica usada en cada impacto según la biomecánica de Weyand.
              </p>
              <div>
                <label htmlFor="weyand-steps" className="block text-[11px] text-gray-300 mb-1">
                  Pasos Totales
                </label>
                <input
                  id="weyand-steps"
                  aria-label="Pasos totales para cálculo Weyand"
                  type="number"
                  inputMode="numeric"
                  className="w-full px-3 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
                  value={weyandSteps}
                  onChange={(e) => setWeyandSteps(e.target.value)}
                />
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-400">Calorías quemadas:</span>
                <span className="text-base font-bold text-rose-400">
                  {weyandStepsKcal.toFixed(2)} kcal
                </span>
              </div>
            </div>

            {/* Gasto Metabólico por Tiempo */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Gasto Metabólico por Carrera/Marcha
              </h5>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="weyand-dist" className="block text-[11px] text-gray-300 mb-1">
                    Distancia (m)
                  </label>
                  <input
                    id="weyand-dist"
                    aria-label="Distancia en metros para gasto metabólico"
                    type="number"
                    inputMode="decimal"
                    className="w-full px-2 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
                    value={metabolicDistance}
                    onChange={(e) => setMetabolicDistance(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="weyand-min" className="block text-[11px] text-gray-300 mb-1">
                    Minutos
                  </label>
                  <input
                    id="weyand-min"
                    aria-label="Minutos de duración"
                    type="number"
                    inputMode="numeric"
                    className="w-full px-2 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
                    value={metabolicMinutes}
                    onChange={(e) => setMetabolicMinutes(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="weyand-sec" className="block text-[11px] text-gray-300 mb-1">
                    Segundos
                  </label>
                  <input
                    id="weyand-sec"
                    aria-label="Segundos de duración"
                    type="number"
                    inputMode="numeric"
                    className="w-full px-2 py-1.5 bg-[#1C1C1E] border border-white/10 rounded-lg text-white text-xs"
                    value={metabolicSeconds}
                    onChange={(e) => setMetabolicSeconds(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">VO2 Consumido:</span>
                  <span className="text-xs font-semibold text-sky-400">
                    {weyandMetabolicResult.vo2.toFixed(2)} ml/kg/min
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Gasto Total:</span>
                  <span className="text-base font-bold text-emerald-400">
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
