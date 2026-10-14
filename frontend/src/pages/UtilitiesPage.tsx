import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import CalculatorCard from '../components/calculators/CalculatorCard';
import NutritionCalculators from '../components/calculators/NutritionCalculators';
import AiNutritionChef from '../components/utilities/AiNutritionChef';
import { calculateWeyandSteps, calculateWeyandMetabolic } from '../utils/fitnessCalculators';

interface DashboardData {
  currentWeight?: number;
}

export default function UtilitiesPage() {
  // --- CALCULATORS STATE ---
  const [weight1, setWeight1] = useState('');
  const [steps, setSteps] = useState('');

  const [weight2, setWeight2] = useState('');
  const [height, setHeight] = useState('1.73');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then((res) => res.data),
  });

  useEffect(() => {
    if (dashboardData?.currentWeight) {
      setWeight1(dashboardData.currentWeight.toString());
      setWeight2(dashboardData.currentWeight.toString());
    }
  }, [dashboardData?.currentWeight]);

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
    <div className="fade-in max-w-4xl mx-auto px-4 pb-16 pt-4">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Utilidades y Calculadoras
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Herramientas biomecánicas, gasto calórico y nutrición deportiva.
        </p>
      </header>

      {/* --- ESTRATEGA NUTRICIONAL IA --- */}
      <section className="mb-6">
        <CalculatorCard title="Estratega Nutricional IA" defaultOpen={false}>
          <AiNutritionChef />
        </CalculatorCard>
      </section>

      {/* --- CALCULADORAS BIOMECÁNICAS --- */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Calculadoras Biomecánicas</h2>
        <div className="flex flex-col gap-6">
          {/* Calculator 1: Steps */}
          <CalculatorCard title="Gasto por Pasos" defaultOpen={true}>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Estima la energía mecánica usada en cada impacto según la biomecánica de Weyand.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label" htmlFor="calc-weight-steps">
                  Peso Corporal (kg)
                </label>
                <input
                  id="calc-weight-steps"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={weight1}
                  onChange={(e) => setWeight1(e.target.value)}
                  placeholder="Ej: 80.5"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="calc-steps-total">
                  Pasos Totales
                </label>
                <input
                  id="calc-steps-total"
                  type="number"
                  inputMode="decimal"
                  className="form-input"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="Ej: 10000"
                />
              </div>
            </div>

            <div
              role="status"
              aria-live="polite"
              className="kpi-card accent mt-4"
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'rgba(0, 133, 255, 0.05)',
                border: '1px solid rgba(0, 133, 255, 0.2)',
              }}
            >
              <div className="kpi-label">Calorías Quemadas</div>
              <div
                className="kpi-value accent"
                style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}
              >
                {calc1Result > 0 ? calc1Result.toFixed(2) : '0.00'}{' '}
                <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>kcal</span>
              </div>
            </div>
          </CalculatorCard>

          {/* Calculator 2: Metabolic */}
          <CalculatorCard title="Gasto Metabólico por Tiempo" defaultOpen={true}>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Calcula el VO2 y gasto calórico avanzado de una sesión de carrera/caminata
              considerando tu biometría.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
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
                  placeholder="Ej: 80.5"
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
                  placeholder="Ej: 1.73"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group mb-3">
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
                placeholder="Ej: 400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div
              role="status"
              aria-live="polite"
              className="kpi-card success mt-4"
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div className="kpi-label">Gasto Metabólico Total</div>
              <div
                className="kpi-value success"
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--color-success, #10b981)',
                }}
              >
                {metabolicResult.kcal > 0 ? metabolicResult.kcal.toFixed(2) : '0.00'}{' '}
                <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>kcal</span>
              </div>
              {metabolicResult.vo2 > 0 && (
                <div className="text-xs text-gray-400 mt-2">
                  VO2 Consumido: {metabolicResult.vo2.toFixed(2)} ml/kg/min
                </div>
              )}
            </div>
          </CalculatorCard>
        </div>
      </section>

      {/* --- CALCULADORAS DE NUTRICIÓN --- */}
      <section>
        <NutritionCalculators />
      </section>
    </div>
  );
}
