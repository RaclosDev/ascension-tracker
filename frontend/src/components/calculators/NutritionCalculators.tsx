import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Percent } from 'lucide-react';
import api from '../../api/client';
import CalculatorCard from './CalculatorCard';
import {
  parseNumber,
  calcBmr,
  calcTdee,
  calcBodyFatNavy,
  calcBodyComposition,
} from '../../utils/nutritionCalculators';

export default function NutritionCalculators() {
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [age, setAge] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [activityFactor, setActivityFactor] = useState<string>('1.2');

  // Body fat inputs
  const [waistCm, setWaistCm] = useState<string>('');
  const [neckCm, setNeckCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');

  interface DashboardData {
    currentWeight?: number;
  }
  interface SettingsData {
    age?: number;
    heightCm?: number;
    sex?: 'M' | 'F';
    activityFactor?: number;
  }

  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/weights/dashboard').then((res) => res.data),
  });
  const { data: settingsData } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
  });

  useEffect(() => {
    if (dashboardData?.currentWeight) {
      setWeightKg(String(dashboardData.currentWeight));
    }
    if (settingsData) {
      const s = settingsData;
      if (s.age) setAge(String(s.age));
      if (s.heightCm) setHeightCm(String(s.heightCm));
      if (s.sex) setSex(s.sex);
      if (s.activityFactor) setActivityFactor(String(s.activityFactor));
    }
  }, [dashboardData, settingsData]);

  // Base calculations
  const pAge = parseNumber(age);
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(weightKg);
  const pAct = parseNumber(activityFactor) || 1.2;
  const pWaist = parseNumber(waistCm);
  const pNeck = parseNumber(neckCm);
  const pHip = parseNumber(hipCm);

  const bmr = pWeight && pHeight && pAge ? calcBmr(sex, pWeight, pHeight, pAge) : null;
  const tdee = bmr ? calcTdee(bmr, pAct) : null;

  const bfPct = calcBodyFatNavy({
    sex,
    heightCm: pHeight || 0,
    waistCm: pWaist || 0,
    neckCm: pNeck || 0,
    hipCm: pHip || 0,
  });
  const bodyComp = bfPct && pWeight ? calcBodyComposition(pWeight, bfPct) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* TDEE Card */}
      <CalculatorCard
        title="Gasto de mantenimiento (TDEE)"
        subtitle="Metabolismo basal y gasto calórico diario"
        icon={<Flame size={18} />}
        defaultOpen={false}
      >
        {tdee && bmr ? (
          <div>
            <div
              className="kpi-card accent"
              style={{
                textAlign: 'center',
                padding: '1.15rem',
                borderRadius: '14px',
                background: 'rgba(0, 133, 255, 0.05)',
                border: '1px solid rgba(0, 133, 255, 0.2)',
              }}
            >
              <div
                className="kpi-value accent"
                style={{ color: 'var(--accent-primary)', fontSize: '2rem', fontWeight: 800 }}
              >
                {Math.round(tdee)} <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>kcal</span>
              </div>
              <div className="kpi-label" style={{ marginTop: '4px' }}>
                Gasto Energético Diario (TDEE)
              </div>
              <div
                style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
              >
                Tu metabolismo basal (BMR) es de {Math.round(bmr)} kcal.
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Rellena tu sexo, edad, altura, peso y nivel de actividad en Ajustes.
          </p>
        )}
      </CalculatorCard>

      {/* Body fat Card */}
      <CalculatorCard
        title="% Grasa Corporal (Marina)"
        subtitle="Estimación Navy según perímetros"
        icon={<Percent size={18} />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="calc-bf-waist">
              Cintura (cm)
            </label>
            <input
              id="calc-bf-waist"
              type="number"
              className="form-input"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              placeholder="A la altura del ombligo"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="calc-bf-neck">
              Cuello (cm)
            </label>
            <input
              id="calc-bf-neck"
              type="number"
              className="form-input"
              value={neckCm}
              onChange={(e) => setNeckCm(e.target.value)}
              placeholder="Por debajo de la nuez"
            />
          </div>
          {sex === 'F' && (
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="form-label" htmlFor="calc-bf-hip">
                Cadera (cm)
              </label>
              <input
                id="calc-bf-hip"
                type="number"
                className="form-input"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                placeholder="Parte más ancha"
              />
            </div>
          )}
        </div>

        {bfPct ? (
          <div>
            <div
              className="kpi-card accent"
              style={{
                marginBottom: '1rem',
                textAlign: 'center',
                padding: '1.15rem',
                borderRadius: '14px',
                background: 'rgba(0, 133, 255, 0.05)',
                border: '1px solid rgba(0, 133, 255, 0.2)',
              }}
            >
              <div
                className="kpi-value accent"
                style={{ color: 'var(--accent-primary)', fontSize: '2.5rem', fontWeight: 800 }}
              >
                {bfPct.toFixed(1)}%
              </div>
              <div className="kpi-label" style={{ marginTop: '4px' }}>
                Grasa Corporal Estimada
              </div>
            </div>
            {bodyComp && (
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="kpi-card"
                  style={{
                    textAlign: 'center',
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {bodyComp.fatKg.toFixed(1)}{' '}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>kg</span>
                  </div>
                  <div className="kpi-label">Masa Grasa</div>
                </div>
                <div
                  className="kpi-card"
                  style={{
                    textAlign: 'center',
                    padding: '1rem',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="kpi-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {bodyComp.leanKg.toFixed(1)}{' '}
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>kg</span>
                  </div>
                  <div className="kpi-label">Masa Magra</div>
                </div>
              </div>
            )}
            <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Nota: Este método tiene un margen de error de ±3-4%. Para mayor precisión usa
              plicómetros (calipers) o DEXA.
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Faltan medidas para calcular (o los valores no son válidos).
          </p>
        )}
      </CalculatorCard>
    </div>
  );
}
