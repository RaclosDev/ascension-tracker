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
  const numAct = parseFloat(activityFactor) || 1.55;
  const numBf = bodyFat ? parseFloat(bodyFat) : undefined;

  const tdeeResult = useMemo(() => {
    return calculateTdee({
      sex,
      weightKg: numWeight,
      heightCm: numHeight,
      age: numAge,
      activityFactor: numAct,
      bodyFatPercentage: numBf,
      formula,
    });
  }, [sex, numWeight, numHeight, numAge, numAct, numBf, formula]);

  // Weyand calculations
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
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        Calcula tu Tasa Metabólica Basal (BMR), Gasto Energético Diario Total (TDEE) y objetivos
        calóricos para pérdida de grasa, mantenimiento o ganancia muscular.
      </p>

      {/* FORM INPUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor={sexId}
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
          >
            Sexo Biológico
          </label>
          <select
            id={sexId}
            className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all cursor-pointer"
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="M">Hombre</option>
            <option value="F">Mujer</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={weightId}
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
          >
            Peso corporal (kg)
          </label>
          <input
            id={weightId}
            type="number"
            inputMode="decimal"
            step="0.1"
            className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium text-sm placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            placeholder="75.0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={heightId}
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
          >
            Altura (cm)
          </label>
          <input
            id={heightId}
            type="number"
            inputMode="decimal"
            step="0.5"
            className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium text-sm placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            placeholder="175"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={ageId}
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
          >
            Edad (años)
          </label>
          <input
            id={ageId}
            type="number"
            inputMode="numeric"
            min="10"
            max="120"
            className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium text-sm placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            placeholder="28"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={activityId}
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
          >
            Nivel de Actividad Diaria
          </label>
          <select
            id={activityId}
            className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all cursor-pointer"
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
          <label
            htmlFor={bodyFatId}
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
          >
            % Grasa Corporal (Opcional)
          </label>
          <input
            id={bodyFatId}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="3"
            max="60"
            className="w-full px-3.5 py-2.5 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium text-sm placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            placeholder="Ej: 15 (Para Katch-McArdle)"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </div>
      </div>

      {/* FORMULA TOGGLE ROW */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <span className="text-xs font-bold text-white block">
            Fórmula de Cálculo de Metabolismo Basal
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            Ajusta el método según tus datos antropométricos disponibles.
          </span>
        </div>
        <select
          id={formulaId}
          className="text-xs px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-[var(--accent-primary)] transition-all cursor-pointer"
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
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_var(--accent-glow)]">
          <span className="text-xs font-bold tracking-wider uppercase text-[var(--accent-primary)]">
            Tasa Metabólica Basal (BMR)
          </span>
          <div className="text-4xl font-extrabold text-white mt-1 font-display tracking-tight">
            {tdeeResult.bmr}{' '}
            <span className="text-lg font-normal text-[var(--text-secondary)]">kcal/día</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5">
            Energía consumida en reposo absoluto ({tdeeResult.formulaUsed}).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_20px_var(--accent-glow)]">
          <span className="text-xs font-bold tracking-wider uppercase text-[var(--accent-primary)]">
            Gasto Energético Total (TDEE)
          </span>
          <div className="text-4xl font-extrabold text-white mt-1 font-display tracking-tight">
            {tdeeResult.tdee}{' '}
            <span className="text-lg font-normal text-[var(--text-secondary)]">kcal/día</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5">
            Calorías necesarias para mantener tu peso actual.
          </p>
        </div>
      </div>

      {/* CALORIC GOALS SELECTOR & SUMMARY */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
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
                    ? 'bg-white/10 border-[var(--accent-primary)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="text-xs font-semibold truncate">{goal.label}</div>
                <div className="text-base font-extrabold text-white mt-1 font-display">
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
          className="flex items-center justify-between w-full text-left text-sm font-semibold text-[var(--text-secondary)] hover:text-white transition-colors py-1"
        >
          <span>Biomecánica Avanzada de Weyand (Pasos y Gasto Metabólico)</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {showWeyand ? '▲ Ocultar' : '▼ Expandir'}
          </span>
        </button>

        {showWeyand && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            {/* Gasto por Pasos */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Gasto por Pasos (Weyand)
              </h5>
              <p className="text-xs text-[var(--text-secondary)]">
                Estima la energía mecánica usada en cada impacto según la biomecánica de Weyand.
              </p>
              <div>
                <label
                  htmlFor="weyand-steps"
                  className="block text-[11px] text-[var(--text-secondary)] mb-1"
                >
                  Pasos Totales
                </label>
                <input
                  id="weyand-steps"
                  aria-label="Pasos totales para cálculo Weyand"
                  type="number"
                  inputMode="numeric"
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                  value={weyandSteps}
                  onChange={(e) => setWeyandSteps(e.target.value)}
                />
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Pasos procesados:
                  </span>
                  <span className="text-xs font-semibold text-[var(--accent-primary)] font-display">
                    {numSteps.toLocaleString()} pasos
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Gasto estimado:
                  </span>
                  <span className="text-base font-bold text-emerald-400 font-display">
                    {weyandStepsResult.toFixed(1)} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* Gasto por Carrera/Tiempo */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                Coste Energético de Carrera
              </h5>
              <p className="text-xs text-[var(--text-secondary)]">
                Calcula el consumo de oxígeno (VO2) y coste calórico neto en distancia.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label
                    htmlFor="weyand-dist"
                    className="block text-[11px] text-[var(--text-secondary)] mb-1"
                  >
                    Metros
                  </label>
                  <input
                    id="weyand-dist"
                    aria-label="Distancia en metros para cálculo Weyand"
                    type="number"
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                    value={metabolicDistance}
                    onChange={(e) => setMetabolicDistance(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="weyand-min"
                    className="block text-[11px] text-[var(--text-secondary)] mb-1"
                  >
                    Minutos
                  </label>
                  <input
                    id="weyand-min"
                    aria-label="Minutos de tiempo para cálculo Weyand"
                    type="number"
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                    value={metabolicMinutes}
                    onChange={(e) => setMetabolicMinutes(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="weyand-sec"
                    className="block text-[11px] text-[var(--text-secondary)] mb-1"
                  >
                    Segundos
                  </label>
                  <input
                    id="weyand-sec"
                    aria-label="Segundos de tiempo para cálculo Weyand"
                    type="number"
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[var(--accent-primary)] font-medium"
                    value={metabolicSeconds}
                    onChange={(e) => setMetabolicSeconds(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-secondary)] block">VO2 Consumido:</span>
                  <span className="text-xs font-semibold text-[var(--accent-primary)] font-display">
                    {weyandMetabolicResult.vo2.toFixed(2)} ml/kg/min
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-secondary)] block">Gasto Total:</span>
                  <span className="text-base font-bold text-emerald-400 font-display">
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
