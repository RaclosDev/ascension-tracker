import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChefHat, Footprints, Activity } from 'lucide-react';
import api from '../api/client';
import CalculatorCard from '../components/calculators/CalculatorCard';
import NutritionCalculators from '../components/calculators/NutritionCalculators';
import AiNutritionChef from '../components/utilities/AiNutritionChef';
import { useCoachProfile } from '../lib/coach/api';
import { CoachPageHeader } from '../components/coach/CoachWorkspace';
import { calculateWeyandSteps, calculateWeyandMetabolic } from '../utils/fitnessCalculators';
import '../styles/utilities.css';

interface DashboardData {
  currentWeight?: number;
}

interface SettingsData {
  heightCm?: number;
}

const kcalFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const vo2Fmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export default function UtilitiesPage() {
  const [weight1, setWeight1] = useState('');
  const [steps, setSteps] = useState('');

  const [weight2, setWeight2] = useState('');
  const [height, setHeight] = useState('1.73');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  // A coach works out figures for an athlete, so nothing is filled in from the coach's own data.
  const coach = useCoachProfile().data?.coach === true;
  const { data: dashboardData } = useQuery<DashboardData>({
    enabled: !coach,
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then((res) => res.data),
  });

  const { data: settingsData } = useQuery<SettingsData>({
    enabled: !coach,
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
  });

  useEffect(() => {
    if (dashboardData?.currentWeight) {
      setWeight1(dashboardData.currentWeight.toString());
      setWeight2(dashboardData.currentWeight.toString());
    }
  }, [dashboardData?.currentWeight]);

  useEffect(() => {
    if (settingsData?.heightCm) {
      setHeight((settingsData.heightCm / 100).toFixed(2));
    }
  }, [settingsData?.heightCm]);

  // Calculations 1: Gasto por Pasos (Weyand)
  const numWeight1 = parseFloat(weight1) || 0;
  const numSteps = parseInt(steps, 10) || 0;
  const calc1Result = calculateWeyandSteps({ weightKg: numWeight1, steps: numSteps });

  // Calculations 2: Gasto Metabólico por Tiempo (VO2)
  const numWeight2 = parseFloat(weight2) || 0;
  const numHeight = parseFloat(height) || 0;
  const numDistance = parseFloat(distance) || 0;
  const numMinutes = parseInt(minutes || '0', 10);
  const numSeconds = parseInt(seconds || '0', 10);
  const totalSeconds = numMinutes * 60 + numSeconds;

  const metabolicResult = calculateWeyandMetabolic({
    weightKg: numWeight2,
    heightM: numHeight,
    distanceM: numDistance,
    totalSeconds,
  });

  return (
    <div
      className={
        coach ? 'fade-in coach-page coach-workspace coach-utilities util-page' : 'fade-in util-page'
      }
    >
      {coach ? (
        <CoachPageHeader
          title="Utilidades"
          description="Calculadoras de gasto y de nutrición para preparar las pautas de tus atletas."
        />
      ) : (
        <header className="util-head">
          <h1 className="page-title-desktop">Utilidades</h1>
          <p className="util-lede">
            Gasto calórico, composición corporal y recetas con tus macros.
          </p>
        </header>
      )}

      {!coach && (
        <section className="util-section">
          <h2 className="util-section-title">Recetas</h2>
          <CalculatorCard
            title="Recetas con tus macros"
            subtitle="La IA propone platos con lo que te queda hoy"
            icon={<ChefHat size={18} />}
            defaultOpen={false}
          >
            <AiNutritionChef />
          </CalculatorCard>
        </section>
      )}
      <section className="util-section">
        <h2 className="util-section-title">Gasto calórico</h2>
        <div className="util-cards">
          {/* Calculator 1: Steps */}
          <CalculatorCard
            title="Calorías por pasos"
            subtitle="Lo que gastas andando, según el peso"
            icon={<Footprints size={18} />}
            defaultOpen={false}
          >
            <p className="calc-intro">
              Suma la energía de cada pisada según el peso (modelo de Weyand).
            </p>

            <div className="calc-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-weight-steps">
                  Peso corporal (kg)
                </label>
                <input
                  id="calc-weight-steps"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={weight1}
                  onChange={(e) => setWeight1(e.target.value)}
                  placeholder="80,5"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calc-steps-total">
                  Pasos totales
                </label>
                <input
                  id="calc-steps-total"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>

            <div role="status" aria-live="polite" className="util-result">
              <span className="util-result-label">Calorías quemadas</span>
              <span className="util-result-value tabular-nums">
                {calc1Result > 0 ? kcalFmt.format(calc1Result) : '—'} <small>kcal</small>
              </span>
            </div>
          </CalculatorCard>

          {/* Calculator 2: Metabolic */}
          <CalculatorCard
            title="Calorías por carrera o caminata"
            subtitle="Según la distancia y el tiempo que has tardado"
            icon={<Activity size={18} />}
            defaultOpen={false}
          >
            <p className="calc-intro">
              Calcula el gasto de una sesión a partir del ritmo, con{' '}
              {coach ? 'el peso y la altura del atleta' : 'tu peso y tu altura'}.
            </p>

            <div className="calc-fields">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-metabolic-weight">
                  Peso (kg)
                </label>
                <input
                  id="calc-metabolic-weight"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={weight2}
                  onChange={(e) => setWeight2(e.target.value)}
                  placeholder="80,5"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calc-metabolic-height">
                  Altura (m)
                </label>
                <input
                  id="calc-metabolic-height"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="1,73"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group calc-field-wide">
              <label className="form-label" htmlFor="calc-metabolic-distance">
                Distancia (metros)
              </label>
              <input
                id="calc-metabolic-distance"
                type="number"
                inputMode="decimal"
                className="form-input"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="400"
              />
            </div>

            <div className="calc-fields" data-cols="2">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-metabolic-minutes">
                  Tiempo (min)
                </label>
                <input
                  id="calc-metabolic-minutes"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calc-metabolic-seconds">
                  Tiempo (seg)
                </label>
                <input
                  id="calc-metabolic-seconds"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div role="status" aria-live="polite" className="util-result">
              <span className="util-result-label">Calorías quemadas</span>
              <span className="util-result-value tabular-nums">
                {metabolicResult.kcal > 0 ? kcalFmt.format(metabolicResult.kcal) : '—'}{' '}
                <small>kcal</small>
              </span>
              {metabolicResult.vo2 > 0 && (
                <span className="util-result-note tabular-nums">
                  Consumo de oxígeno (VO2): {vo2Fmt.format(metabolicResult.vo2)} ml/kg/min
                </span>
              )}
            </div>
          </CalculatorCard>
        </div>
      </section>
      <section className="util-section">
        <h2 className="util-section-title">Mantenimiento y composición</h2>
        <NutritionCalculators />
      </section>
      <p className="util-disclaimer">
        Son estimaciones con fórmulas estándar: sirven de orientación y no sustituyen el consejo de
        un médico o un nutricionista.
      </p>
    </div>
  );
}
