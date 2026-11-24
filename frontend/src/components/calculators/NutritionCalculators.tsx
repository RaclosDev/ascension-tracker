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
import { InfoTip } from '@/components/ui/InfoTip';

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

  const kcal = (n: number) => Math.round(n).toLocaleString('es-ES');
  const one = (n: number) =>
    n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="util-cards">
      <CalculatorCard
        title="Calorías de mantenimiento"
        subtitle="Lo que gastas al día con tu actividad"
        icon={<Flame size={18} />}
        defaultOpen={false}
      >
        {tdee && bmr ? (
          <div className="util-result">
            <span className="util-result-label">Gasto diario estimado</span>
            <span className="util-result-value tabular-nums">
              {kcal(tdee)} <small>kcal</small>
            </span>
            <span className="util-result-note tabular-nums">
              En reposo gastas {kcal(bmr)} kcal (metabolismo basal).
            </span>
          </div>
        ) : (
          <p className="calc-intro">
            Rellena sexo, edad, altura, peso y nivel de actividad en Ajustes.
          </p>
        )}
      </CalculatorCard>

      <CalculatorCard
        title="Grasa corporal"
        subtitle="Con cinta métrica: método de la Marina de EE. UU."
        icon={<Percent size={18} />}
        defaultOpen={false}
      >
        <div className="calc-fields">
          <div className="form-group">
            <label className="form-label" htmlFor="calc-bf-waist">
              Cintura (cm)
            </label>
            <input
              id="calc-bf-waist"
              type="number"
              inputMode="decimal"
              className="form-input"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              placeholder="A la altura del ombligo"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="calc-bf-neck">
              Cuello (cm)
            </label>
            <input
              id="calc-bf-neck"
              type="number"
              inputMode="decimal"
              className="form-input"
              value={neckCm}
              onChange={(e) => setNeckCm(e.target.value)}
              placeholder="Por debajo de la nuez"
            />
          </div>
          {sex === 'F' && (
            <div className="form-group calc-field-wide">
              <label className="form-label" htmlFor="calc-bf-hip">
                Cadera (cm)
              </label>
              <input
                id="calc-bf-hip"
                type="number"
                inputMode="decimal"
                className="form-input"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                placeholder="Parte más ancha"
              />
            </div>
          )}
        </div>

        {bfPct ? (
          <>
            <div className="util-result" role="status" aria-live="polite">
              <span className="util-result-label">
                Grasa corporal estimada{' '}
                <InfoTip label="Precisión de la estimación" align="start">
                  Margen de error de ±3-4 %. Un plicómetro o una DEXA afinan más.
                </InfoTip>
              </span>
              <span className="util-result-value tabular-nums">{one(bfPct)} %</span>
              {bodyComp && (
                <span className="util-result-note tabular-nums">
                  {one(bodyComp.fatKg)} kg de grasa · {one(bodyComp.leanKg)} kg de masa magra
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="calc-intro">
            {sex === 'F'
              ? 'Mide cintura, cuello y cadera para ver la estimación.'
              : 'Mide cintura y cuello para ver la estimación.'}
          </p>
        )}
      </CalculatorCard>
    </div>
  );
}
