import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import {
  parseNumber,
  calcBodyFatNavy,
  calcBodyComposition,
} from '../../utils/nutritionCalculators';

export default function NutritionCalculators() {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');

  // Medidas antropométricas
  const [waistCm, setWaistCm] = useState<string>('');
  const [neckCm, setNeckCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');

  interface DashboardData {
    currentWeight?: number;
  }
  interface SettingsData {
    heightCm?: number;
    sex?: 'M' | 'F';
  }

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () =>
      api
        .get('/weights/dashboard')
        .then((res) => res.data)
        .catch(() => null),
  });

  const { data: settingsData } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: () =>
      api
        .get('/settings')
        .then((res) => res.data)
        .catch(() => null),
  });

  useEffect(() => {
    if (dashboardData?.currentWeight && !weightKg) {
      setWeightKg(String(dashboardData.currentWeight));
    }
    if (settingsData) {
      if (settingsData.heightCm && !heightCm) setHeightCm(String(settingsData.heightCm));
      if (settingsData.sex) setSex(settingsData.sex);
    }
  }, [dashboardData, settingsData]);

  // Cálculos
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(weightKg);
  const pWaist = parseNumber(waistCm);
  const pNeck = parseNumber(neckCm);
  const pHip = parseNumber(hipCm);

  const bfPct = calcBodyFatNavy({
    sex,
    heightCm: pHeight || 0,
    waistCm: pWaist || 0,
    neckCm: pNeck || 0,
    hipCm: pHip || 0,
  });

  const bodyComp = bfPct && pWeight ? calcBodyComposition(pWeight, bfPct) : null;

  return (
    <div className="space-y-6">
      {/* Selector de Sexo */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
          Sexo Biológico
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSex('M')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
              sex === 'M'
                ? 'bg-white/10 text-white border-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-glow)]'
                : 'bg-white/5 text-[var(--text-secondary)] border-white/5 hover:border-white/20'
            }`}
          >
            Hombre
          </button>
          <button
            type="button"
            onClick={() => setSex('F')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
              sex === 'F'
                ? 'bg-white/10 text-white border-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-glow)]'
                : 'bg-white/5 text-[var(--text-secondary)] border-white/5 hover:border-white/20'
            }`}
          >
            Mujer
          </button>
        </div>
      </div>

      {/* Grid de Inputs Base */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="calc-bf-height"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
          >
            Altura (cm)
          </label>
          <input
            id="calc-bf-height"
            type="number"
            inputMode="decimal"
            className="w-full px-3.5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-medium text-sm"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="Ej: 175"
          />
        </div>
        <div>
          <label
            htmlFor="calc-bf-weight"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
          >
            Peso actual (kg)
          </label>
          <input
            id="calc-bf-weight"
            type="number"
            inputMode="decimal"
            className="w-full px-3.5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-medium text-sm"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="Ej: 75.0"
          />
        </div>
      </div>

      {/* Grid de Medidas Antropométricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="calc-bf-waist"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
          >
            Cintura (cm)
          </label>
          <input
            id="calc-bf-waist"
            type="number"
            inputMode="decimal"
            className="w-full px-3.5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-medium text-sm"
            value={waistCm}
            onChange={(e) => setWaistCm(e.target.value)}
            placeholder="A nivel del ombligo"
          />
        </div>

        <div>
          <label
            htmlFor="calc-bf-neck"
            className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
          >
            Cuello (cm)
          </label>
          <input
            id="calc-bf-neck"
            type="number"
            inputMode="decimal"
            className="w-full px-3.5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-medium text-sm"
            value={neckCm}
            onChange={(e) => setNeckCm(e.target.value)}
            placeholder="Debajo de la laringe"
          />
        </div>

        {sex === 'F' && (
          <div>
            <label
              htmlFor="calc-bf-hip"
              className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
            >
              Cadera (cm)
            </label>
            <input
              id="calc-bf-hip"
              type="number"
              inputMode="decimal"
              className="w-full px-3.5 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-medium text-sm"
              value={hipCm}
              onChange={(e) => setHipCm(e.target.value)}
              placeholder="Zona más ancha"
            />
          </div>
        )}
      </div>

      {/* Resultados KPI */}
      {bfPct ? (
        <div className="space-y-4 pt-2">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs uppercase font-bold text-[var(--text-secondary)] tracking-wider">
              Grasa Corporal Estimada
            </span>
            <div className="text-4xl font-extrabold text-[var(--accent-primary)] my-1 tracking-tight font-display">
              {bfPct.toFixed(1)}%
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Fórmula US Navy para {sex === 'M' ? 'hombres' : 'mujeres'}
            </p>
          </div>

          {bodyComp && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Masa Grasa
                </span>
                <div className="text-2xl font-bold text-white mt-0.5 font-display">
                  {bodyComp.fatKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-[var(--text-secondary)]">kg</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  Masa Magra
                </span>
                <div className="text-2xl font-bold text-white mt-0.5 font-display">
                  {bodyComp.leanKg.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-[var(--text-secondary)]">kg</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center pt-1">
            * Margen de error estimado: ±3-4%. Para calibración exacta deportiva se recomienda
            caliperometría de 7 pliegues o escaneo DEXA.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-[var(--text-secondary)]">
          Introduce las medidas de altura, cintura y cuello{sex === 'F' ? ' y cadera' : ''} para
          calcular tu porcentaje de grasa y composición magra.
        </div>
      )}
    </div>
  );
}
