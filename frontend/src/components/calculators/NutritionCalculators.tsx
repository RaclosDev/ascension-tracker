import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import CalculatorCard from './CalculatorCard';
import {
  KCAL_PER_KG_FAT,
  parseNumber,
  calcBmr,
  calcTdee,
  calcMacros,
  calcStepsKcal,
  calcStepsFromKcal,
  calcBodyFatNavy,
  calcBodyComposition
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

  useEffect(() => {
    Promise.allSettled([
      api.get('/weights/dashboard'),
      api.get('/settings')
    ]).then(([weightsRes, settingsRes]) => {
      if (weightsRes.status === 'fulfilled' && weightsRes.value.data.currentWeight) {
        setWeightKg(String(weightsRes.value.data.currentWeight));
      }
      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value.data;
        if (s.age) setAge(String(s.age));
        if (s.heightCm) setHeightCm(String(s.heightCm));
        if (s.sex) setSex(s.sex);
        if (s.activityFactor) setActivityFactor(String(s.activityFactor));
      }
    });
  }, []);

  // Base calculations
  const pAge = parseNumber(age);
  const pHeight = parseNumber(heightCm);
  const pWeight = parseNumber(weightKg);
  const pAct = parseNumber(activityFactor) || 1.2;
  const pWaist = parseNumber(waistCm);
  const pNeck = parseNumber(neckCm);
  const pHip = parseNumber(hipCm);

  const bmr = (pWeight && pHeight && pAge) ? calcBmr(sex, pWeight, pHeight, pAge) : null;
  const tdee = bmr ? calcTdee(bmr, pAct) : null;



  const bfPct = calcBodyFatNavy({
    sex, heightCm: pHeight || 0, waistCm: pWaist || 0, neckCm: pNeck || 0, hipCm: pHip || 0
  });
  const bodyComp = (bfPct && pWeight) ? calcBodyComposition(pWeight, bfPct) : null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
        Calculadoras de Nutrición
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* TDEE Card */}
        <CalculatorCard title="Gasto de mantenimiento (TDEE)">
          {tdee && bmr ? (
            <div>
              <div className="kpi-card" style={{ textAlign: 'center', padding: '24px' }}>
                <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{Math.round(tdee)} kcal</div>
                <div className="kpi-detail">Gasto Energético Diario (TDEE)</div>
                <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Tu metabolismo basal (BMR) es de {Math.round(bmr)} kcal.
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Rellena tu sexo, edad, altura, peso y nivel de actividad en Ajustes.</p>
          )}
        </CalculatorCard>

        {/* Body fat Card */}
        <CalculatorCard title="% de grasa corporal (método Marina)">
          <div className="utilities-grid" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-bf-waist">Cintura (cm)</label>
              <input id="calc-bf-waist" type="number" className="form-input" value={waistCm} onChange={e => setWaistCm(e.target.value)} placeholder="A la altura del ombligo" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calc-bf-neck">Cuello (cm)</label>
              <input id="calc-bf-neck" type="number" className="form-input" value={neckCm} onChange={e => setNeckCm(e.target.value)} placeholder="Por debajo de la nuez" />
            </div>
            {sex === 'F' && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="calc-bf-hip">Cadera (cm)</label>
                <input id="calc-bf-hip" type="number" className="form-input" value={hipCm} onChange={e => setHipCm(e.target.value)} placeholder="Parte más ancha" />
              </div>
            )}
          </div>

          {bfPct ? (
            <div>
              <div className="kpi-card" style={{ marginBottom: '16px', textAlign: 'center', padding: '24px' }}>
                <div className="kpi-value" style={{ color: 'var(--accent-primary)', fontSize: '2.5rem' }}>{bfPct.toFixed(1)}%</div>
                <div className="kpi-detail">Grasa Corporal Estimada</div>
              </div>
              {bodyComp && (
                <div className="utilities-grid">
                  <div className="kpi-card">
                    <div className="kpi-value">{bodyComp.fatKg.toFixed(1)} kg</div>
                    <div className="kpi-detail">Masa Grasa</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-value">{bodyComp.leanKg.toFixed(1)} kg</div>
                    <div className="kpi-detail">Masa Magra</div>
                  </div>
                </div>
              )}
              <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Nota: Este método tiene un margen de error de ±3-4%. Para mayor precisión usa plicómetros (calipers) o DEXA.
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Faltan medidas para calcular (o los valores no son válidos).</p>
          )}
        </CalculatorCard>
      </div>

      <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Las calculadoras proporcionan estimaciones orientativas basadas en fórmulas estándar. No sustituyen el consejo de un profesional médico o nutricionista.
      </p>
    </div>
  );
}
